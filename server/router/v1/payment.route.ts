import { Router } from "express";

import { authMiddleware } from "../../middleware/authMiddleware.ts";
import { upload } from "../../middleware/upload.ts";
import { PaymentManual } from "../../controller/payment.controller.ts";

const PaymentRoute = Router();

PaymentRoute.post(
  "/manual/proof",
  authMiddleware("LANDLORD"),
  upload.single("proof"), // "proof" = field name from frontend FormData
  PaymentManual
);

export default PaymentRoute;
