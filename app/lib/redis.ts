import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

export async function getRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }

  return redis;
}
