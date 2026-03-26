import { Worker } from "bullmq";
import { getRedisConnection } from "@/queue/connection";
import { backgroundJobsMode, usesRedisQueue } from "@/queue/config";
import { processEmailJob } from "@/queue/email-processor";
import { processScoringJob } from "@/queue/scoring-processor";
import type { EmailJobData } from "@/queue/types";

if (!usesRedisQueue) {
  console.log(
    `[Worker] BACKGROUND_JOBS_MODE=${backgroundJobsMode}. Redis worker is disabled; no worker process is required.`
  );
  process.exit(0);
}

const redisConnection = getRedisConnection();

const scoringWorker = new Worker(
  "application-scoring",
  async (job) => {
    await processScoringJob((job.data as { applicationId: string }).applicationId);
  },
  { connection: redisConnection, concurrency: 2 }
);

const emailWorker = new Worker(
  "email-notifications",
  async (job) => {
    await processEmailJob(job.data as EmailJobData);
  },
  { connection: redisConnection, concurrency: 5 }
);

scoringWorker.on("failed", (job, error) => {
  console.error("Scoring job failed", job?.id, error);
});

scoringWorker.on("completed", (job) => {
  console.log("Scoring job completed", job.id);
});

emailWorker.on("failed", (job, error) => {
  console.error("[Email Worker] Job failed:", {
    jobId: job?.id,
    jobData: job?.data,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
});

emailWorker.on("completed", (job) => {
  console.log("[Email Worker] Job completed successfully:", {
    jobId: job.id,
    jobType: (job.data as EmailJobData).type,
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await Promise.all([scoringWorker.close(), emailWorker.close()]);
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await Promise.all([scoringWorker.close(), emailWorker.close()]);
  process.exit(0);
});

console.log("Workers started, listening for scoring and email jobs");
console.log(`[Email Worker] RESEND_API_KEY is ${process.env.RESEND_API_KEY ? "SET" : "NOT SET"}`);
