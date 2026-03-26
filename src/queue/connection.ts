import Redis from "ioredis";
import { usesRedisQueue } from "@/queue/config";

let redisConnection: Redis | null = null;

export function getRedisConnection() {
  if (!usesRedisQueue) {
    throw new Error("Redis connection requested while BACKGROUND_JOBS_MODE is not 'redis'");
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not set");
  }

  redisConnection ??= new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  return redisConnection;
}
