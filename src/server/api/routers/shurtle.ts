import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const exampleRouter = createTRPCRouter({
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
});
