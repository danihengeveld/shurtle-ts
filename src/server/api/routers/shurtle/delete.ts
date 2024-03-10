import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { shurtles } from "~/db/schema";
import { limitOrThrow, rateLimits } from "~/utils/ratelimiter";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const deleteShurtleRouter = createTRPCRouter({
  bySlug: protectedProcedure
    .input(
      z.object({
        slug: z
          .string({ required_error: "Cannot be empty!" })
          .regex(/^[a-z0-9](-?[a-z0-9])*$/, {
            message: "Invalid slug!",
          }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;

      await limitOrThrow(rateLimits.private, userId);

      const deletedShurtles = await ctx.db
        .delete(shurtles)
        .where(
          and(
            eq(shurtles.slug, input.slug), 
            eq(shurtles.creatorId, userId)
            )
        )
        .returning({ deletedId: shurtles.slug});

      if (deletedShurtles.length < 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Shurtle for slug ${input.slug} and creator id ${userId} does not exist.`,
        });
      }
    }),
});
