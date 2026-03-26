import { Queue } from "bullmq";
import { getRedisConnection } from "@/queue/connection";
import { usesRedisQueue } from "@/queue/config";
import { processScoringJob } from "@/queue/scoring-processor";

let scoringQueue: Queue<{ applicationId: string }> | null = null;

function getScoringQueue() {
  scoringQueue ??= new Queue<{ applicationId: string }>("application-scoring", {
    connection: getRedisConnection(),
  });

  return scoringQueue;
}

export async function enqueueScoring(applicationId: string) {
  if (!usesRedisQueue) {
    try {
      await processScoringJob(applicationId);
    } catch (error) {
      console.error("[Scoring Queue] Inline scoring failed", {
        applicationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  await getScoringQueue().add("score-application", { applicationId });
}
