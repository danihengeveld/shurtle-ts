import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const sortOrder = z.enum(["asc", "desc"]).optional();

export const shurtleRouter = createTRPCRouter({
  getAllForUser: protectedProcedure
    .input(
      z
        .object({
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
      return await ctx.prisma.shurtle.findMany({
        where: {
          creatorId: ctx.auth.userId,
        },
        orderBy: input?.orderBy,
      });
    }),
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const shurtle = await ctx.prisma.shurtle.findUnique({
        where: {
          slug: input.slug,
        },
      });

      if (!shurtle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Shurtle for slug ${input.slug} does not exist.`,
        });
      }

      return shurtle;
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
});
