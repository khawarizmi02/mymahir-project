import prisma from "../PrismaClient.ts";
import { InvitationStatus } from "../generated/prisma/enums.ts";
import crypto from "crypto";
// const bcrypt = require('bcrypt');
import bcrypt from "bcryptjs";
import { sendInvitationEmail } from "./email.service.ts";
import { logger } from "../middleware/loggers.ts";

interface CreateInvitationDto {
  propertyId: number;
  tenantEmail: string;
  tenantName?: string;
  leaseStart: Date;
  leaseEnd: Date;
  monthlyRent: number;
  depositAmount?: number;
}

export class InvitationService {
  // Generate a secure random token
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // Create a new tenant invitation
  async createInvitation(landlordId: number, data: CreateInvitationDto) {
    // Verify the property belongs to this landlord
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, landlordId },
    });

    if (!property) {
      throw new Error("Property not found or does not belong to you");
    }

    // Check if there's already a pending invitation for this email and property
    const existingInvitation = await prisma.tenantInvitation.findFirst({
      where: {
        propertyId: data.propertyId,
        tenantEmail: data.tenantEmail.toLowerCase(),
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      throw new Error(
        "An invitation is already pending for this tenant and property"
      );
    }

    // Check if tenant already has an account
    const existingUser = await prisma.user.findUnique({
      where: { email: data.tenantEmail.toLowerCase() },
    });

    // Get landlord info for email
    const landlord = await prisma.user.findUnique({
      where: { id: landlordId },
    });

    if (!landlord) {
      throw new Error("Landlord not found");
    }

    // Create the invitation
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = await prisma.tenantInvitation.create({
      data: {
        propertyId: data.propertyId,
        landlordId,
        tenantEmail: data.tenantEmail.toLowerCase(),
        tenantName: data.tenantName || null,
        leaseStart: new Date(data.leaseStart),
        leaseEnd: new Date(data.leaseEnd),
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount || null,
        token,
        expiresAt,
        status: "PENDING",
      },
      include: {
        property: true,
        landlord: { select: { id: true, name: true, email: true } },
      },
    });

    // Generate invitation URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4300";
    const invitationUrl = frontendUrl + "/invite/" + token;

    // Format dates for email
    const leaseStartFormatted = invitation.leaseStart.toLocaleDateString(
      "en-MY",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    const leaseEndFormatted = invitation.leaseEnd.toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send invitation email
    try {
      await sendInvitationEmail(
        invitationUrl,
        landlord.name || landlord.email,
        landlord.email,
        data.tenantEmail.toLowerCase(),
        property.title,
        leaseStartFormatted,
        leaseEndFormatted,
        data.monthlyRent
      );
      logger.info(`Invitation email sent successfully to ${data.tenantEmail}`);
    } catch (emailError) {
      logger.error(
        `Failed to send invitation email to ${data.tenantEmail}:`,
        emailError
      );
      // Don't throw - invitation created but email failed
      // Return with email error indicator
      return {
        invitation,
        existingUser: !!existingUser,
        emailSent: false,
        emailError:
          emailError instanceof Error ? emailError.message : "Unknown error",
      };
    }

    return {
      invitation,
      existingUser: !!existingUser,
      emailSent: true,
    };
  }

  // Get invitation by token (for tenant acceptance page)
  async getInvitationByToken(token: string) {
    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token },
      include: {
        property: true,
        landlord: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      throw new Error(
        `Invitation has already been ${invitation.status.toLowerCase()}`
      );
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("Invitation has expired");
    }

    // Check if user already exists and has a password
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.tenantEmail },
      select: { id: true, hashedPassword: true },
    });

    return {
      ...invitation,
      existingUser: !!existingUser,
      existingUserHasPassword: !!existingUser?.hashedPassword,
    };
  }

  // Accept invitation and create/link tenant account
  async acceptInvitation(token: string, password?: string) {
    const invitation = await this.getInvitationByToken(token);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.tenantEmail },
    });

    if (!user) {
      // Create new tenant user - password required
      if (!password) {
        throw new Error("Password is required for new users");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email: invitation.tenantEmail,
          name: invitation.tenantName,
          role: "TENANT",
          hashedPassword,
          isEmailVerified: true, // Verified through invitation link
        },
      });
    } else {
      // User exists
      if (user.hashedPassword) {
        // Existing user WITH password - verify the password
        if (!password) {
          throw new Error("Password is required to verify your identity");
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.hashedPassword
        );
        if (!isPasswordValid) {
          throw new Error(
            "Invalid password. Please enter your current password."
          );
        }

        // Password verified - update name if provided in invitation
        if (invitation.tenantName && invitation.tenantName !== user.name) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name: invitation.tenantName },
          });
        }
      } else {
        // Existing user WITHOUT password - require them to set one
        if (!password) {
          throw new Error("Password is required to set up your account");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            hashedPassword,
            isEmailVerified: true,
            name: invitation.tenantName || user.name,
          },
        });
      }
    }

    // Create the tenancy record
    const tenancy = await prisma.tenancy.create({
      data: {
        propertyId: invitation.propertyId,
        tenantId: user.id,
        landlordId: invitation.landlordId,
        leaseStart: invitation.leaseStart,
        leaseEnd: invitation.leaseEnd,
        monthlyRent: invitation.monthlyRent,
      },
    });

    // Update property status to OCCUPIED
    await prisma.property.update({
      where: { id: invitation.propertyId },
      data: { status: "OCCUPIED" },
    });

    // Mark invitation as accepted
    await prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    return { user, tenancy };
  }

  // Get all invitations for a landlord
  async getLandlordInvitations(landlordId: number) {
    return prisma.tenantInvitation.findMany({
      where: { landlordId },
      include: {
        property: { select: { id: true, title: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Cancel an invitation
  async cancelInvitation(landlordId: number, invitationId: number) {
    const invitation = await prisma.tenantInvitation.findFirst({
      where: { id: invitationId, landlordId, status: "PENDING" },
    });

    if (!invitation) {
      throw new Error("Invitation not found or cannot be cancelled");
    }

    return prisma.tenantInvitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    });
  }

  // Resend invitation (generate new token and extend expiry)
  async resendInvitation(landlordId: number, invitationId: number) {
    const invitation = await prisma.tenantInvitation.findFirst({
      where: { id: invitationId, landlordId },
      include: {
        property: true,
        landlord: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status === "ACCEPTED") {
      throw new Error("Cannot resend an accepted invitation");
    }

    const newToken = this.generateToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const updatedInvitation = await prisma.tenantInvitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: "PENDING",
      },
      include: {
        property: true,
        landlord: { select: { id: true, name: true, email: true } },
      },
    });

    // Generate new invitation URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4300";
    const invitationUrl = frontendUrl + "/invite/" + newToken;

    // Format dates for email
    const leaseStartFormatted = updatedInvitation.leaseStart.toLocaleDateString(
      "en-MY",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    const leaseEndFormatted = updatedInvitation.leaseEnd.toLocaleDateString(
      "en-MY",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    // Send resend invitation email
    try {
      await sendInvitationEmail(
        invitationUrl,
        updatedInvitation.landlord.name || updatedInvitation.landlord.email,
        updatedInvitation.landlord.email,
        updatedInvitation.tenantEmail,
        updatedInvitation.property.title,
        leaseStartFormatted,
        leaseEndFormatted,
        updatedInvitation.monthlyRent
      );
      logger.info(
        `Resend invitation email sent successfully to ${updatedInvitation.tenantEmail}`
      );
    } catch (emailError) {
      logger.error(
        `Failed to resend invitation email to ${updatedInvitation.tenantEmail}:`,
        emailError
      );
      // Don't throw - invitation updated but email failed
      return {
        invitation: updatedInvitation,
        emailSent: false,
        emailError:
          emailError instanceof Error ? emailError.message : "Unknown error",
      };
    }

    return {
      invitation: updatedInvitation,
      emailSent: true,
    };
  }
}
