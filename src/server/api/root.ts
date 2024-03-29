import { createTRPCRouter } from "~/server/api/trpc";
import { shurtleRouter } from "./routers/shurtle";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  shurtle: shurtleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
