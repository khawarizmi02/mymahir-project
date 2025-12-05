import {
  Prisma,
  type Payment,
  PaymentMethod,
  PaymentStatus,
} from "../generated/prisma/client";
import prisma from "../PrismaClient";
import { AppError } from "../utils/appError";
import { logger } from "../middleware/loggers";
import { createPaymentIntent } from "./stripe.service";
import type { PaymentCreateInput } from "../generated/prisma/models";

export const createPayment = async (
  data: PaymentCreateInput
): Promise<Payment & { clientSecret?: string }> => {
  try {
    let clientSecret: string | undefined;
    let paymentIntentId: string | undefined;

    if (!data.currency) throw new AppError("Currency type is missing", 404);

    if (data.method === PaymentMethod.STRIPE) {
      const intent = await createPaymentIntent(data.amount, data.currency, {
        tenancyId: data.tenantId.toString(),
        tenantId: data.tenantId.toString(),
      });
      clientSecret = intent.clientSecret;
      paymentIntentId = intent.id;
    }

    const payment = await prisma.payment.create({
      data: {
        tenancyId: data.tenantId,
        tenantId: data.tenantId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: PaymentStatus.PENDING,
        stripePaymentId: paymentIntentId || null,
      },
    });

    return clientSecret ? { ...payment, clientSecret } : payment;
  } catch (error) {
    logger.error("createPayment error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create payment.", 500);
  }
};

export const getPaymentbyId = async (id: number): Promise<Payment> => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment)
      throw new AppError(`Payment witt ID:${id} cannot be found.`, 404);

    return payment;
  } catch (error) {
    logger.error("getPaymentsByTenancy error:", error);
    throw new AppError("Failed to fetch payments.", 500);
  }
};

export const getPaymentsByTenancy = async (
  tenancyId: number
): Promise<Payment[]> => {
  try {
    return await prisma.payment.findMany({
      where: { tenancyId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error("getPaymentsByTenancy error:", error);
    throw new AppError("Failed to fetch payments.", 500);
  }
};

export const getPaymentsByTenant = async (
  tenantId: number
): Promise<Payment[]> => {
  try {
    return await prisma.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error("getPaymentsByTenant error:", error);
    throw new AppError("Failed to fetch payments.", 500);
  }
};

export const updatePaymentStatus = async (
  id: number,
  status: PaymentStatus
): Promise<Payment> => {
  try {
    return await prisma.payment.update({
      where: { id },
      data: { status },
    });
  } catch (error) {
    logger.error("updatePaymentStatus error:", error);
    throw new AppError("Failed to update payment status.", 500);
  }
};

export const updatePaymentProof = async (
  id: number,
  proofUrl: string
): Promise<Payment> => {
  try {
    return await prisma.payment.update({
      where: { id },
      data: { proofUrl },
    });
  } catch (error) {
    logger.error("updatePaymentProof error:", error);
    throw new AppError("Failed to update payment proof.", 500);
  }
};

export const updatePaymentByStripeId = async (
  stripePaymentId: string,
  status: PaymentStatus,
  paidAt?: Date
): Promise<Payment | null> => {
  try {
    return await prisma.payment.update({
      where: { stripePaymentId },
      data: {
        status,
        ...(paidAt && { paidAt }),
      },
    });
  } catch (error) {
    logger.error("updatePaymentByStripeId error:", error);
    return null; // Silent fail or throw?
  }
};
