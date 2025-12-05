import { Resend } from "resend";
import { type User } from "../generated/prisma/browser.ts";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPinEmail(user: User, pin: string): Promise<void> {
  const appName = "Mail";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #1a73e8;">Your Login PIN</h2>
      <p>Hello ${user.name || "there"},</p>
      <p>You requested to sign in to sign in to <strong>${appName}</strong>.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a73e8; background: #f0f7ff; padding: 15px 30px; border-radius: 10px;">
          ${pin}
        </span>
      </div>

      <p>This PIN expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, just ignore it.</p>
      
      <hr style="margin: 30px 0;" />
      <small style="color: #666;">Sent from <strong>${appName}</strong></small>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Rental App <onboarding@resend.dev>", // this address is pre-verified
      to: user.email,
      subject: `Your ${appName} Login PIN: ${pin}`,
      html,
    });
    console.log(`PIN email sent to ${user.email} via Resend`);
  } catch (error: any) {
    console.error("Resend failed:", error);
    throw new Error("Failed to send PIN email");
  }
}
