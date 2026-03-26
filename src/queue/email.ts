import { Queue } from "bullmq";
import { getRedisConnection } from "@/queue/connection";
import { usesRedisQueue } from "@/queue/config";
import { processEmailJob } from "@/queue/email-processor";
import type { EmailJobData } from "@/queue/types";

let emailQueue: Queue<EmailJobData> | null = null;

function getEmailQueue() {
  emailQueue ??= new Queue<EmailJobData>("email-notifications", {
    connection: getRedisConnection(),
  });

  return emailQueue;
}

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

  if (!usesRedisQueue) {
    await processEmailJob(data);
    return;
  }

  const job = await getEmailQueue().add("send-email", data);
  console.log(`[Email Queue] Email job enqueued with ID: ${job.id}`);
  return job;
}
