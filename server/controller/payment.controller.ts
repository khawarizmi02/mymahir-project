import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";
import type { AuthRequest } from "./auth.controller.ts";
import {
  createPayment,
  getPaymentbyId,
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

export const createPaymentHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.TENANT) {
      throw new AppError("Unauthorized: Tenant access only.", 403);
    }

    const { tenancyId, amount, currency, method } = req.body;
    const tenantId = req.user.userId;

    // Validate tenancy belongs to tenant
    const tenancy = await getTenancyById(tenancyId);
    // const tenancy = await prisma.tenancy.findUnique({
    //   where: { id: tenancyId },
    // });
    if (!tenancy || tenancy.tenantId !== tenantId) {
      throw new AppError("Invalid tenancy.", 400);
    }

    const paymentData = { tenancyId, tenantId, amount, currency, method };
    const result = await createPayment(paymentData);

    res.status(201).json({
      success: true,
      message: "Payment initiated successfully.",
      data: result,
    });
  }
);

export const getPaymentsHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { tenancyId, tenantId: queryTenantId } = req.query;
    let payments: Payment[];

    if (req.user?.role === UserRole.LANDLORD) {
      if (!tenancyId)
        throw new AppError("Tenancy ID required for landlords.", 400);
      const tId = parseInt(tenancyId as string);
      const tenancy = await getTenancyById(tId);
      // const tenancy = await prisma.tenancy.findUnique({ where: { id: tId } });
      if (!tenancy || tenancy.landlordId !== req.user.userId) {
        throw new AppError("Unauthorized: Not your tenancy.", 403);
      }
      payments = await getPaymentsByTenancy(tId);
    } else if (req.user?.role === UserRole.TENANT) {
      const tId = queryTenantId
        ? parseInt(queryTenantId as string)
        : req.user.userId;
      if (tId !== req.user.userId) {
        throw new AppError(
          "Unauthorized: Cannot view other tenant's payments.",
          403
        );
      }
      payments = await getPaymentsByTenant(tId);
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

    const payment = await getPaymentbyId(paymentId);
    // const payment = await prisma.payment.findUnique({
    //   where: { id: paymentId },
    // });
    if (!payment) throw new AppError("Payment not found.", 404);
    if (!payment.tenancyId)
      throw new AppError("Payment's tenancy ID not found.", 404);

    const tenancy = await getTenancyById(payment.tenancyId as number);
    // const tenancy = await prisma.tenancy.findUnique({
    //   where: { id: payment.tenancyId as number },
    // });
    if (!tenancy || tenancy.landlordId !== req.user.userId) {
      throw new AppError("Unauthorized: Not your payment.", 403);
    }

    if (
      payment.method !== PaymentMethod.MANUAL ||
      status !== PaymentStatus.COMPLETED
    ) {
      throw new AppError("Can only approve manual payments.", 400);
    }

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
