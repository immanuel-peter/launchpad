import { emailFrom, getResendClient } from "@/lib/email/resend";
import {
  getDecisionEmail,
  getNewApplicationEmail,
  getWelcomeEmail,
} from "@/lib/email/templates";
import type { EmailJobData } from "@/queue/types";

export async function processEmailJob(data: EmailJobData) {
  console.log(`[Email Worker] Processing ${data.type} email`, data);

  let recipient = "";
  let template;

  if (data.type === "welcome") {
    recipient = data.email;
    template = getWelcomeEmail(data.fullName, data.role);
  } else if (data.type === "new-application") {
    recipient = data.companyEmail;
    template = getNewApplicationEmail({
      companyName: data.companyName,
      applicantName: data.applicantName,
      jobTitle: data.jobTitle,
      score: data.score,
    });
  } else {
    recipient = data.studentEmail;
    template = getDecisionEmail({
      studentName: data.studentName,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      status: data.status,
      emailBody: data.emailBody,
    });
  }

  if (!recipient) {
    throw new Error("Email recipient is missing");
  }

  console.log(`[Email Worker] Sending email via Resend`, {
    from: emailFrom,
    to: recipient,
    subject: template.subject,
  });

  const resend = getResendClient();

  try {
    const { data: response, error } = await resend.emails.send({
      from: emailFrom,
      to: recipient,
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error(`[Email Worker] Resend API error`, {
        error: error.message || String(error),
        recipient,
        subject: template.subject,
        from: emailFrom,
      });
      throw error;
    }

    console.log(`[Email Worker] Resend API response`, {
      success: true,
      emailId: response?.id,
      recipient,
      subject: template.subject,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error(`[Email Worker] Resend API error`, {
      error: errorMessage,
      details: errorDetails,
      recipient,
      subject: template.subject,
      from: emailFrom,
    });
    throw error;
  }
}
