import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { limitOrThrow, rateLimits } from "../../../utils/ratelimiter";

const sortOrder = z.enum(["asc", "desc"]).optional();

export const shurtleRouter = createTRPCRouter({
  getAllForUser: protectedProcedure
    .input(
      z.object({
          orderBy: z
            .object({
              hits: sortOrder,
              createdAt: sortOrder,
              lastHitAt: sortOrder,
            })
            .optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;

      await limitOrThrow(rateLimits.private, userId);

      return await ctx.prisma.shurtle.findMany({
        where: {
          creatorId: ctx.auth.userId,
        },
        orderBy: input?.orderBy,
      });
    }),

  create: protectedProcedure
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

      const existing = await ctx.prisma.shurtle.findUnique({
        where: {
          slug: input.slug,
        },
        select: {
          slug: true,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Shurtle for slug ${input.slug} already exists.`,
        });
      }

      const result = await ctx.prisma.shurtle.create({
        data: {
          slug: input.slug,
          url: input.url,
          creatorId: ctx.auth.userId,
        },
      });

      return result;
    }),

  deleteBySlug: protectedProcedure
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

      const shurtle = await ctx.prisma.shurtle.findFirst({
        where: {
          AND: [
            {
              slug: input.slug,
            },
            {
              creatorId: userId,
            },
          ],
        },
        select: {
          slug: true,
        },
      });

      if (!shurtle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Shurtle for slug ${input.slug} and creator id ${userId} does not exist.`,
        });
      }

      await ctx.prisma.shurtle.delete({
        where: {
          slug: shurtle.slug,
        },
      });
    }),
});
