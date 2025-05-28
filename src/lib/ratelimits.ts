import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

export const rateLimits = {
  openShurtle: {
    limiter: new Ratelimit({
      redis,
      prefix: "ratelimit:openShurtle",
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
      enableProtection: true,
      analytics: true
    }),
    limitMessage: "You are opening too many Shurtles. Please wait a minute before trying again."
  },
  createShurtle: {
    limiter: new Ratelimit({
      redis,
      prefix: "ratelimit:createShurtle",
      limiter: Ratelimit.slidingWindow(5, "5 m"), // 5 requests per 5 minutes
      enableProtection: true,
      analytics: true
    }),
    limitMessage: "You are creating too many Shurtles. Please wait 5 minutes before trying again."
  }
}