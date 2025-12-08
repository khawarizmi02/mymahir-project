import { Router } from "express";
import express from "express";

import { handleStripeWebhook } from "../../controller/webhook.controller";

const WHRouter = Router();

WHRouter.post(
  "/stripe",
  express.raw({
    type: "application/json",
  }),
  handleStripeWebhook
);

export default WHRouter;
