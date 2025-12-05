import { Router } from "express";

import { authMiddleware } from "../../middleware/authMiddleware.ts";
import {
  createPaymentHandler,
  getPaymentProofPresignedUrl,
  getPaymentsHandler,
  updatePaymentStatusHandler,
  uploadPaymentProofHandler,
} from "../../controller/payment.controller.ts";

const PaymentRoute = Router();

PaymentRoute.post("/", authMiddleware("TENANT"), createPaymentHandler);
PaymentRoute.get("/", authMiddleware("LANDLORD", "TENANT"), getPaymentsHandler);
PaymentRoute.put(
  "/:id/status",
  authMiddleware("LANDLORD"),
  updatePaymentStatusHandler
);
PaymentRoute.put(
  "/:id/proof",
  authMiddleware("TENANT"),
  uploadPaymentProofHandler
);
PaymentRoute.post(
  "/:id/proof/presigned",
  authMiddleware("TENANT"),
  getPaymentProofPresignedUrl
);

export default PaymentRoute;
