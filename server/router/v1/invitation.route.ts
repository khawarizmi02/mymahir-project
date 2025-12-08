import { Router } from "express";
import {
  authMiddleware,
  protectRoute,
  restrictTo,
} from "../../middleware/authMiddleware.ts";
import {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  getLandlordInvitations,
  cancelInvitation,
  resendInvitation,
} from "../../controller/invitation.controller.ts";

const InvRouter = Router();

// Public routes (no auth needed - for tenant acceptance)
InvRouter.get("/:token", getInvitationByToken);
InvRouter.post("/:token/accept", acceptInvitation);

// Landlord-only routes (requires auth)
InvRouter.post("/", protectRoute, restrictTo("LANDLORD"), createInvitation);
InvRouter.get(
  "/",
  protectRoute,
  restrictTo("LANDLORD"),
  getLandlordInvitations
);
InvRouter.delete(
  "/:id",
  protectRoute,
  restrictTo("LANDLORD"),
  cancelInvitation
);
InvRouter.post(
  "/:id/resend",
  protectRoute,
  restrictTo("LANDLORD"),
  resendInvitation
);

export default InvRouter;
