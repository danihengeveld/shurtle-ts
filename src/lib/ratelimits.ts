import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const rateLimits = {
  openShurtle: {
    // Per IP. Generous enough for shared IPs (offices, campuses, mobile carriers) while still
    // stopping slug enumeration and scraping.
    limiter: new Ratelimit({
      redis,
      prefix: "ratelimit:openShurtle",
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      enableProtection: true,
      analytics: true,
    }),
  },
  createShurtle: {
    // Per user.
    limiter: new Ratelimit({
      redis,
      prefix: "ratelimit:createShurtle",
      limiter: Ratelimit.slidingWindow(10, "5 m"),
      enableProtection: true,
      analytics: true,
    }),
    limitMessage:
      "You're creating links a little too quickly. Please wait a few minutes and try again.",
  },
};
