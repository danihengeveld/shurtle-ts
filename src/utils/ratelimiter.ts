import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface Ratelimiter {
    limiter: Ratelimit,
    message: string
}

export const rateLimits = {
  private: {
    limiter: new Ratelimit({
      redis: Redis.fromEnv(),
      prefix: "private",
      limiter: Ratelimit.slidingWindow(6, "1 m"),
      analytics: true,
    }),
    message:
      "A maximum of 6 requests per minute is allowed for private routes.",
  },
  create: {
    limiter: new Ratelimit({
      redis: Redis.fromEnv(),
      prefix: "create",
      limiter: Ratelimit.slidingWindow(3, "5 m"),
      analytics: true,
    }),
    message:
      "A maximum of 3 requests per 5 minutes is allowed for creating Shurtles.",
  },
};

export const limitOrThrow = async (rate: Ratelimiter, identifier: string) => {
  const { success } = await rate.limiter.limit(identifier);
  if (!success)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: rate.message,
    });
};
