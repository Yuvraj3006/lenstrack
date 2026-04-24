import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

/**
 * On Vercel (`VERCEL=1`) never fall back to localhost — that hides misconfiguration.
 * Local dev without `REDIS_URL` still uses Docker/default Redis on 127.0.0.1:6379.
 */
function getRedisConnectionUrl(): string {
  const fromEnv = process.env.REDIS_URL?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL === "1") {
    throw new Error(
      "REDIS_URL is not set. In Vercel: Settings → Environment Variables → add REDIS_URL (e.g. Upstash rediss://…)."
    );
  }
  return "redis://127.0.0.1:6379";
}

function createRedis(): IORedis {
  const url = getRedisConnectionUrl();
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    /** Avoid TCP during `next build` / import; connect on first command only. */
    lazyConnect: true,
    connectTimeout: 15_000,
  });
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;
