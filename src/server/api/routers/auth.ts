import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "easySLR/server/api/trpc";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email(),
        password: z.string().min(8).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await ctx.db.user.create({
        data: {
          name: input.name ?? null,
          email: input.email,
          passwordHash,
        },
      });
      return { id: user.id, email: user.email };
    }),
});
