import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { shurtles } from "~/db/schema";
import { limitOrThrow, rateLimits } from "~/utils/ratelimiter";
import { protectedProcedure } from "../../trpc";

export const createShurtleRouter = protectedProcedure
  .input(
    z.object({
      url: z.string().url({ message: "Must be a valid URL!" }),
      slug: z
        .string({ required_error: "Cannot be empty!" })
        .regex(/^[a-z0-9](-?[a-z0-9])*$/, {
          message: "Invalid slug!",
        }),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.auth.userId;

    await limitOrThrow(rateLimits.create, userId);

    try {
      await ctx.db.insert(shurtles).values({
        slug: input.slug,
        url: input.url,
        creatorId: ctx.auth.userId,
      });
    } catch {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Shurtle for slug ${input.slug} already exists.`,
      });
    }

    const shurtle = await ctx.db.query.shurtles.findFirst({
      where: (shurtles, { eq }) => eq(shurtles.slug, input.slug),
    });

    return shurtle;
  });
