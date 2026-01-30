import { Queue } from "bullmq";
import { redisConnection } from "@/queue/connection";

export type EmailJobData =
  | { type: "welcome"; email: string; fullName: string | null; role: "student" | "startup" }
  | {
      type: "new-application";
      companyEmail: string;
      companyName: string;
      applicantName: string;
      jobTitle: string;
      score: number;
    }
  | {
      type: "decision";
      studentEmail: string;
      studentName: string;
      jobTitle: string;
      companyName: string;
      status: "accepted" | "rejected";
      emailBody: string | null;
    };

export const emailQueue = new Queue("email-notifications", {
  connection: redisConnection,
});

export async function enqueueEmail(data: EmailJobData) {
  console.log(`[Email Queue] Enqueuing ${data.type} email:`, {
    type: data.type,
    recipient:
      data.type === "welcome"
        ? data.email
        : data.type === "new-application"
          ? data.companyEmail
          : data.studentEmail,
    ...(data.type === "welcome" && { role: data.role }),
    ...(data.type === "new-application" && { jobTitle: data.jobTitle, score: data.score }),
    ...(data.type === "decision" && { jobTitle: data.jobTitle, status: data.status }),
  });
  const job = await emailQueue.add("send-email", data);
  console.log(`[Email Queue] Email job enqueued with ID: ${job.id}`);
  return job;
}
