import { Router } from 'express';
import { authMiddleware, protectRoute, restrictTo } from '../../middleware/authMiddleware.ts';
import {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  getLandlordInvitations,
  cancelInvitation,
  resendInvitation
} from '../../controller/invitation.controller.ts';

const router = Router();

// Public routes (no auth needed - for tenant acceptance)
router.get('/:token', getInvitationByToken);
router.post('/:token/accept', acceptInvitation);

// Landlord-only routes (requires auth)
router.post('/', protectRoute, restrictTo('LANDLORD'), createInvitation);
router.get('/', protectRoute, restrictTo('LANDLORD'), getLandlordInvitations);
router.delete('/:id', protectRoute, restrictTo('LANDLORD'), cancelInvitation);
router.post('/:id/resend', protectRoute, restrictTo('LANDLORD'), resendInvitation);

export default router;
