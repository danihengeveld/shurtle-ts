import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shurtleRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.shurtle.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().nonempty(),
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
        url: z.string().url(),
        slug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.shurtle.findUnique({
        where: {
          slug: input.slug.toLowerCase(),
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
          slug: input.slug.toLowerCase(),
          url: input.url,
        },
      });

      return result;
    }),
});