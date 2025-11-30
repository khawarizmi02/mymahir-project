import { Request, Response } from 'express';
import { InvitationService } from '../service/invitation.service.ts';

const invitationService = new InvitationService();

// Create a new tenant invitation (Landlord only)
export const createInvitation = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).user.userId;
    const { propertyId, tenantEmail, tenantName, leaseStart, leaseEnd, monthlyRent, depositAmount } = req.body;

    // Validate required fields
    if (!propertyId || !tenantEmail || !leaseStart || !leaseEnd || !monthlyRent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: propertyId, tenantEmail, leaseStart, leaseEnd, monthlyRent'
      });
    }

    const result = await invitationService.createInvitation(landlordId, {
      propertyId: Number(propertyId),
      tenantEmail,
      tenantName,
      leaseStart: new Date(leaseStart),
      leaseEnd: new Date(leaseEnd),
      monthlyRent: Number(monthlyRent),
      depositAmount: depositAmount ? Number(depositAmount) : undefined
    });

    // Generate invitation URL (frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4300';
    const invitationUrl = frontendUrl + '/invite/' + result.invitation.token;

    res.status(201).json({
      success: true,
      message: result.existingUser
        ? 'Invitation created. Tenant already has an account and can accept directly.'
        : 'Invitation created. Tenant will need to create an account.',
      data: {
        invitation: result.invitation,
        invitationUrl,
        existingUser: result.existingUser
      }
    });
  } catch (error: any) {
    console.error('Create invitation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create invitation'
    });
  }
};

// Get invitation details by token (Public - for tenant acceptance page)
export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const invitation = await invitationService.getInvitationByToken(token);

    res.json({
      success: true,
      data: invitation
    });
  } catch (error: any) {
    console.error('Get invitation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get invitation'
    });
  }
};

// Accept invitation (Public - for tenant)
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const result = await invitationService.acceptInvitation(token, password);

    res.json({
      success: true,
      message: 'Invitation accepted successfully. You can now login.',
      data: {
        userId: result.user.id,
        email: result.user.email,
        tenancyId: result.tenancy.id
      }
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept invitation'
    });
  }
};

// Get all invitations for landlord
export const getLandlordInvitations = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).user.userId;
    const invitations = await invitationService.getLandlordInvitations(landlordId);

    res.json({
      success: true,
      data: invitations
    });
  } catch (error: any) {
    console.error('Get landlord invitations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get invitations'
    });
  }
};

// Cancel invitation
export const cancelInvitation = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).user.userId;
    const { id } = req.params;

    const invitation = await invitationService.cancelInvitation(landlordId, Number(id));

    res.json({
      success: true,
      message: 'Invitation cancelled',
      data: invitation
    });
  } catch (error: any) {
    console.error('Cancel invitation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel invitation'
    });
  }
};

// Resend invitation
export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).user.userId;
    const { id } = req.params;

    const invitation = await invitationService.resendInvitation(landlordId, Number(id));

    // Generate new invitation URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4300';
    const invitationUrl = frontendUrl + '/invite/' + invitation.token;

    res.json({
      success: true,
      message: 'Invitation resent with new token',
      data: {
        invitation,
        invitationUrl
      }
    });
  } catch (error: any) {
    console.error('Resend invitation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resend invitation'
    });
  }
};
