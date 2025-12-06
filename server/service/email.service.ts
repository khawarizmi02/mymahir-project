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
