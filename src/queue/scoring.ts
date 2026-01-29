import { Queue } from "bullmq";
import { redisConnection } from "@/queue/connection";

export const scoringQueue = new Queue("application-scoring", {
  connection: redisConnection,
});

export async function enqueueScoring(applicationId: string) {
  await scoringQueue.add("score-application", { applicationId });
}
