import { asc, desc, type SQL } from "drizzle-orm";
import { z } from "zod";
import { shurtles } from "~/db/schema";
import { limitOrThrow, rateLimits } from "~/utils/ratelimiter";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

const sortOrder = z.enum(["asc", "desc"]).optional();
const orderBySchema = z
  .object({ hits: sortOrder, createdAt: sortOrder, lastHitAt: sortOrder })
  .optional();

export const getShurtleRouter = createTRPCRouter({
  allForUser: protectedProcedure
    .input(
      z
        .object({
          orderBy: orderBySchema,
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;

      await limitOrThrow(rateLimits.private, userId);

      return await ctx.db.query.shurtles.findMany({
        where: (shurtles, { eq }) => eq(shurtles.creatorId, ctx.auth.userId),
        orderBy: mapToDrizzleOrderBy(input?.orderBy),
      });
    }),
});

const mapToDrizzleOrderBy = (
  orderBy: z.infer<typeof orderBySchema>
): SQL<unknown>[] | undefined => {
  if (!orderBy) {
    return undefined;
  }

  let createdAt: SQL<unknown> | undefined;

  if (orderBy.createdAt === "asc") {
    createdAt = asc(shurtles.createdAt);
  } else if (orderBy.createdAt === "desc") {
    createdAt = desc(shurtles.createdAt);
  }

  let hits: SQL<unknown> | undefined;

  if (orderBy.hits === "asc") {
    hits = asc(shurtles.hits);
  } else if (orderBy.hits === "desc") {
    hits = desc(shurtles.hits);
  }

  let lastHitAt: SQL<unknown> | undefined;

  if (orderBy.lastHitAt === "asc") {
    lastHitAt = asc(shurtles.lastHitAt);
  } else if (orderBy.lastHitAt === "desc") {
    lastHitAt = desc(shurtles.lastHitAt);
  }

  return [createdAt, hits, lastHitAt].filter(
    (i) => i !== undefined
  ) as SQL<unknown>[];
};
