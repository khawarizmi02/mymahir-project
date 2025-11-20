import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler.ts";

const PaymentManual = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const proofUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

  // Save proofUrl to Payment record
  // await prisma.payment.update({ where: { id }, data: { proofUrl, status: 'PENDING_REVIEW' }});

  res.json({ proofUrl });
});

export { PaymentManual };
