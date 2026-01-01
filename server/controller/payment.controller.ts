import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";
import type { AuthRequest } from "./auth.controller.ts";
import {
  createPayment,
  getPaymentbyId,
  getPaymentsByLandlord,
  getPaymentsByTenancy,
  getPaymentsByTenant,
  updatePaymentProof,
  updatePaymentStatus,
} from "../service/payment.service.ts";
import {
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from "../generated/prisma/enums.ts";
import type { Payment } from "../generated/prisma/client.ts";
import { s3Service } from "../service/s3.service.ts";
import { getTenancyById } from "../service/tenancy.service.ts";
import { logger } from "../middleware/loggers.ts";

export const createPaymentHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.TENANT) {
      throw new AppError("Unauthorized: Tenant access only.", 403);
    }

    const { tenancyId, amount, currency, method, paidAt } = req.body;
    const tenantId = req.user.userId;

    // Validate tenancy belongs to tenant
    const tenancy = await getTenancyById(tenancyId);
    if (!tenancy || tenancy.tenantId !== tenantId) {
      throw new AppError("Invalid tenancy.", 400);
    }

    const paymentData = {
      tenantId,
      amount,
      currency,
      method,
      paidAt: paidAt ? new Date(paidAt) : null,
      propertyId: tenancy.propertyId,
    };
    const result = await createPayment(paymentData, tenancy.id);

    res.status(201).json({
      success: true,
      message: "Payment initiated successfully.",
      data: result,
    });
  }
);

export const getPaymentsHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { tenancyId } = req.query;
    let payments: Payment[];

    if (req.user?.role === UserRole.LANDLORD) {
      // If tenancyId provided, get payments for that specific tenancy
      if (tenancyId) {
        const tId = parseInt(tenancyId as string);
        const tenancy = await getTenancyById(tId);
        if (!tenancy || tenancy.landlordId !== req.user.userId) {
          throw new AppError("Unauthorized: Not your tenancy.", 403);
        }
        payments = await getPaymentsByTenancy(tId);
      } else {
        // Get all payments for all landlord's tenancies
        payments = await getPaymentsByLandlord(req.user.userId);
      }
    } else if (req.user?.role === UserRole.TENANT) {
      payments = await getPaymentsByTenant(req.user.userId);
    } else {
      throw new AppError("Unauthorized access.", 403);
    }

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully.",
      data: payments,
    });
  }
);

export const updatePaymentStatusHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.LANDLORD) {
      throw new AppError("Unauthorized: Landlord access only.", 403);
    }

    const { id } = req.params;
    if (!id) throw new AppError("Id cannot be found.", 404);
    const paymentId = parseInt(id);
    const { status } = req.body;

    if (!Object.values(PaymentStatus).includes(status as any)) {
      throw new AppError(`Invalid status value provided: ${status}`, 400);
    }

    const payment = await getPaymentbyId(paymentId);
    if (!payment) throw new AppError("Payment not found.", 404);
    if (!payment.tenancyId)
      throw new AppError("Payment's tenancy ID not found.", 404);

    const tenancy = await getTenancyById(payment.tenancyId as number);
    if (!tenancy || tenancy.landlordId !== req.user.userId) {
      throw new AppError("Unauthorized: Not your payment.", 403);
    }

    logger.info(payment.method);
    logger.info(status);

    // if (
    //   payment.method !== PaymentMethod.MANUAL ||
    //   status === PaymentStatus.COMPLETED
    // ) {
    //   throw new AppError("Can only approve manual payments.", 400);
    // }

    const updated = await updatePaymentStatus(paymentId, status);

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      data: updated,
    });
  }
);

export const getPaymentProofPresignedUrl = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.TENANT) {
      throw new AppError("Unauthorized: Tenant access only.", 403);
    }

    const { id } = req.params;
    if (!id) throw new AppError("Payment ID required.", 400);
    const paymentId = parseInt(id);

    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      throw new AppError("Filename and contentType required.", 400);
    }

    const payment = await getPaymentbyId(paymentId);
    if (
      !payment ||
      payment.tenantId !== req.user.userId ||
      payment.method !== PaymentMethod.MANUAL ||
      payment.status !== PaymentStatus.PENDING
    ) {
      throw new AppError("Invalid payment for proof upload.", 400);
    }

    const { presignedUrl, publicUrl } = await s3Service.generatePresignedUrl(
      filename,
      contentType,
      `payments/${paymentId}`
    );

    res.status(200).json({
      success: true,
      message: "Presigned URL for payment proof generated.",
      data: { presignedUrl, publicUrl },
    });
  }
);

export const uploadPaymentProofHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.TENANT) {
      throw new AppError("Unauthorized: Tenant access only.", 403);
    }

    const { id } = req.params;
    if (!id) throw new AppError("Payment ID required.", 400);
    const paymentId = parseInt(id);

    const { proofUrl } = req.body;
    if (
      !proofUrl ||
      typeof proofUrl !== "string" ||
      !proofUrl.startsWith(
        `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/payments/${paymentId}/`
      )
    ) {
      throw new AppError("Valid S3 proof URL required.", 400);
    }

    const payment = await getPaymentbyId(paymentId);
    if (
      !payment ||
      payment.tenantId !== req.user.userId ||
      payment.method !== PaymentMethod.MANUAL ||
      payment.status !== PaymentStatus.PENDING
    ) {
      throw new AppError("Invalid payment for proof update.", 400);
    }

    const updated = await updatePaymentProof(paymentId, proofUrl);

    res.status(200).json({
      success: true,
      message: "Payment proof updated successfully.",
      data: updated,
    });
  }
);

export const getPaymentByIdHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Payment ID required.", 400);
    const paymentId = parseInt(id);

    const payment = await getPaymentbyId(paymentId);
    if (!payment) throw new AppError("Payment not found.", 404);

    // Authorization check - tenant can only see their own payments
    if (
      req.user?.role === UserRole.TENANT &&
      payment.tenantId !== req.user.userId
    ) {
      throw new AppError("Unauthorized: Not your payment.", 403);
    }

    // Landlord check - can only see payments for their tenancies
    if (req.user?.role === UserRole.LANDLORD && payment.tenancyId) {
      const tenancy = await getTenancyById(payment.tenancyId);
      if (!tenancy || tenancy.landlordId !== req.user.userId) {
        throw new AppError("Unauthorized: Not your payment.", 403);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment fetched successfully.",
      data: payment,
    });
  }
);
