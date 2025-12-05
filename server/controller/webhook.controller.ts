// server/src/controller/webhook.controller.ts

import type { Request, Response } from "express";
import type Stripe from "stripe";

import { PaymentStatus } from "../generated/prisma/client";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";
import { verifyWebhookSignature } from "../service/stripe.service.ts";
import { updatePaymentByStripeId } from "../service/payment.service.ts";

export const handleStripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) throw new AppError("Missing Stripe signature.", 400);

    const event = await verifyWebhookSignature(req.body, sig);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await updatePaymentByStripeId(
        paymentIntent.id,
        PaymentStatus.COMPLETED,
        new Date()
      );
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await updatePaymentByStripeId(paymentIntent.id, PaymentStatus.FAILED);
    }

    // Handle other events if needed

    res.status(200).json({ received: true });
  }
);
