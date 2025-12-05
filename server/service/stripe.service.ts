import Stripe from "stripe";
import { AppError } from "../utils/appError";
import { logger } from "../middleware/loggers";

// TODO: Create Stripe payment integration
// async createPaymentIntent(amount: number, currency: string, metadata?: object): Promise<{ clientSecret: string }>
// async verifyWebhookSignature(body: string, signature: string): Promise<object>

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // apiVersion: "2024-06-20",
  typescript: true,
});

export const createPaymentIntent = async (
  amount: number,
  currency: string,
  metadata?: Record<string, string>
): Promise<{ clientSecret: string; id: string }> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      ...(metadata && { metadata }),
    });

    if (!paymentIntent.client_secret) {
      throw new AppError("Failed to create payment intent.", 500);
    }

    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
  } catch (error) {
    logger.error("createPaymentIntent error:", error);
    throw new AppError("Stripe payment intent creation failed.", 500);
  }
};

export const verifyWebhookSignature = async (
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    return event;
  } catch (error) {
    logger.error("verifyWebhookSignature error:", error);
    throw new AppError("Webhook signature verification failed.", 400);
  }
};
