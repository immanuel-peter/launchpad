const queueModes = ["inline", "redis"] as const;

export type BackgroundJobsMode = (typeof queueModes)[number];

const configuredMode = process.env.BACKGROUND_JOBS_MODE;

if (configuredMode && !queueModes.includes(configuredMode as BackgroundJobsMode)) {
  throw new Error("BACKGROUND_JOBS_MODE must be either 'inline' or 'redis'");
}

export const backgroundJobsMode: BackgroundJobsMode = configuredMode
  ? (configuredMode as BackgroundJobsMode)
  : process.env.REDIS_URL
    ? "redis"
    : "inline";

export const usesRedisQueue = backgroundJobsMode === "redis";
