import nodemailer from "nodemailer";
import { type User } from "../generated/prisma/browser.ts";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!, // e.g., smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 587 or 465
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS, // app password (not login password!)
  },
});

// Optional: Use SendGrid, Resend, etc. later — just change this transporter

export async function sendPinEmail(user: User, pin: string): Promise<void> {
  const appName = "Mail";
  const supportEmail = process.env.EMAIL_FROM || "no-reply@rentalhub.com";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #1a73e8;">Your Login PIN</h2>
      <p>Hello ${user.name || "there"},</p>
      <p>You requested to sign in to <strong>${appName}</strong>.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a73e8;">
          ${pin}
        </span>
      </div>

      <p>This PIN will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
      
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
      <small style="color: #666;">
        Sent from <strong>${appName}</strong><br>
        Need help? Contact: <a href="mailto:${supportEmail}">${supportEmail}</a>
      </small>
    </div>
  `;

  await transporter.sendMail({
    from: `"${appName}" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: `Your ${appName} Login PIN: ${pin}`,
    text: `Your login PIN is ${pin}. It expires in 10 minutes.`,
    html,
  });
}
