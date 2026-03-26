import { Resend } from "resend";

export const emailFrom = process.env.EMAIL_FROM || "Launchpad <noreply@example.com>";

let resendClient: Resend | null = null;

export function getResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  resendClient ??= new Resend(resendApiKey);
  return resendClient;
}
