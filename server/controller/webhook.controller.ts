import type { Request, Response } from "express";
import type Stripe from "stripe";

import { PaymentStatus } from "../generated/prisma/client";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";
import { verifyWebhookSignature } from "../service/stripe.service.ts";
import { updatePaymentByStripeId } from "../service/payment.service.ts";
import { logger } from "../middleware/loggers.ts";

export const handleStripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) throw new AppError("Missing Stripe signature.", 400);

    const event = await verifyWebhookSignature(req.body, sig);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.info(
        `Processing payment_intent.succeeded for ${paymentIntent.id}`
      );
      try {
        await updatePaymentByStripeId(
          paymentIntent.id,
          PaymentStatus.COMPLETED,
          new Date()
        );
        logger.info(
          `Successfully updated payment ${paymentIntent.id} to COMPLETED`
        );
      } catch (error: any) {
        logger.error(
          `Failed to update payment ${paymentIntent.id}:`,
          error.message
        );
        // Don't throw - webhook handler should always return 200
        // Stripe will retry on 5xx errors
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.info(
        `Processing payment_intent.payment_failed for ${paymentIntent.id}`
      );
      try {
        await updatePaymentByStripeId(paymentIntent.id, PaymentStatus.FAILED);
        logger.info(
          `Successfully updated payment ${paymentIntent.id} to FAILED`
        );
      } catch (error: any) {
        logger.error(
          `Failed to update payment ${paymentIntent.id}:`,
          error.message
        );
      }
    } else if (event.type === "payment_intent.created") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.info(`Payment intent created: ${paymentIntent.id}`);
      // Payment already created on client side before webhook, so we don't need to do anything
    }

    // Always return 200 OK - Stripe will retry non-2xx responses
    res.status(200).json({ received: true });
  }
);
