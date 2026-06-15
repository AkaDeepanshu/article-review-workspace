import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  projectMemberProcedure,
} from "easySLR/server/api/trpc";

export const reviewRouter = createTRPCRouter({
  upsert: projectMemberProcedure
    .input(
      z.object({
        projectId: z.string(),
        articleId: z.string(),
        status: z.enum(["PENDING", "INCLUDED", "EXCLUDED", "MAYBE"]),
        note: z.string().max(5000).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findFirst({
        where: { id: input.articleId, projectId: input.projectId },
      });

      if (!article) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      return ctx.db.articleReview.upsert({
        where: {
          articleId_reviewerId: {
            articleId: input.articleId,
            reviewerId: ctx.session.user.id,
          },
        },
        create: {
          articleId: input.articleId,
          reviewerId: ctx.session.user.id,
          status: input.status,
          note: input.note ?? null,
        },
        update: {
          status: input.status,
          note: input.note ?? null,
        },
      });
    }),

  bulkUpdate: projectMemberProcedure
    .input(
      z.object({
        projectId: z.string(),
        articleIds: z.array(z.string()).min(1).max(100),
        status: z.enum(["PENDING", "INCLUDED", "EXCLUDED", "MAYBE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const articles = await ctx.db.article.findMany({
        where: {
          id: { in: input.articleIds },
          projectId: input.projectId,
        },
        select: { id: true },
      });

      const reviewerId = ctx.session.user.id;

      await ctx.db.$transaction(
        articles.map((article) =>
          ctx.db.articleReview.upsert({
            where: {
              articleId_reviewerId: {
                articleId: article.id,
                reviewerId,
              },
            },
            create: {
              articleId: article.id,
              reviewerId,
              status: input.status,
            },
            update: { status: input.status },
          }),
        ),
      );

      return { updated: articles.length };
    }),
});
