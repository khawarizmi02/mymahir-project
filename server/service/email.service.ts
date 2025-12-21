// server/service/email.service.ts
import { Resend } from "resend";
import { type User } from "../generated/prisma/browser.ts";
import { logger } from "../middleware/loggers.ts";

const resend = new Resend(process.env.RESEND_API_KEY!);

const APP_NAME = "MySewa";

const FROM_EMAIL = process.env.RESEND_FROM || "no-reply@mysewa.site";

export async function sendPinEmail(user: User, pin: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background:#fafafa;">
      <h2 style="color:#1a73e8; text-align:center;">${APP_NAME} – Your Login PIN</h2>
      <p style="font-size:16px;">Hello ${user.name || "there"},</p>
      <p style="font-size:16px;">You requested to sign in to <strong>${APP_NAME}</strong>.</p>
      
      <div style="text-align: center; margin: 50px 0;">
        <span style="font-size: 44px; font-weight: bold; letter-spacing: 12px; color:#1a73e8; background:#e3f2fd; padding: 20px 50px; border-radius: 16px;">
          ${pin}
        </span>
      </div>

      <p style="font-size:16px;">This PIN expires in <strong>10 minutes</strong>.</p>
      <p style="font-size:14px; color:#666;">Not you? Just ignore this email.</p>
      
      <hr style="border: 1px dashed #ccc; margin: 40px 0;" />
      <small style="color:#888; text-align:center; display:block;">
        © 2025 ${APP_NAME} • <a href="https://mysewa.site">mysewa.site</a>
      </small>
    </div>
  `;

  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`, // ← now uses your real domain
    to: user.email,
    subject: `Your Login PIN: ${pin}`,
    html,
  });

  logger.info(`PIN email sent → ${user.email}`);
}

export async function sendInvitationEmail(
  invitationLink: string,
  landlordName: string,
  landlordEmail: string,
  tenantEmail: string,
  propertyTitle: string,
  leaseStartDate: string,
  leaseEndDate: string,
  monthlyRent: number
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background:#fafafa;">
      <h2 style="color:#1a73e8; text-align:center;">${APP_NAME} – Rental Lease Invitation</h2>
      
      <p style="font-size:16px;">Hello,</p>
      <p style="font-size:16px;"><strong>${landlordName}</strong> (${landlordEmail}) has invited you to rent a property on <strong>${APP_NAME}</strong>.</p>
      
      <!-- Property Details -->
      <div style="background: #f0f7ff; padding: 20px; border-left: 4px solid #1a73e8; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #1a73e8;">Property Details</h3>
        <p style="margin: 8px 0;"><strong>Property:</strong> ${propertyTitle}</p>
        <p style="margin: 8px 0;"><strong>Monthly Rent:</strong> RM ${monthlyRent.toLocaleString()}</p>
        <p style="margin: 8px 0;"><strong>Lease Start:</strong> ${leaseStartDate}</p>
        <p style="margin: 8px 0;"><strong>Lease End:</strong> ${leaseEndDate}</p>
      </div>

      <p style="font-size:16px;">Click the button below to accept the invitation and set up your account:</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${invitationLink}" style="display: inline-block; background-color: #1a73e8; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Accept Invitation
        </a>
      </div>

      <p style="font-size:14px; color:#666;">
        Or copy and paste this link in your browser:<br/>
        <code style="background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; word-break: break-all;">
          ${invitationLink}
        </code>
      </p>

      <p style="font-size:14px; color:#666;">
        <strong>This invitation link expires in 7 days.</strong>
      </p>

      <p style="font-size:14px; color:#666;">
        If you believe you received this email by mistake, you can safely ignore it.
      </p>
      
      <hr style="border: 1px dashed #ccc; margin: 40px 0;" />
      <small style="color:#888; text-align:center; display:block;">
        © 2025 ${APP_NAME} • <a href="https://mysewa.site">mysewa.site</a><br/>
        Questions? Contact support at support@mysewa.site
      </small>
    </div>
  `;

  await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: tenantEmail,
    subject: `Rental Invitation from ${landlordName} - ${propertyTitle}`,
    html,
  });

  logger.info(`Invitation email sent → ${tenantEmail} from ${landlordEmail}`);
}
