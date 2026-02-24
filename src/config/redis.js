import { Redis } from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

redis.on("connect", () => {
  console.log("Redis connected successfully,");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redis;