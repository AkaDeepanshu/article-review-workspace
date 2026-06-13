import { TRPCError } from "@trpc/server";
import type { Prisma, ReviewStatus } from "../../../../generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  projectMemberProcedure,
  projectOwnerProcedure,
} from "easySLR/server/api/trpc";
import { articlesToCsv } from "easySLR/server/services/csv-export";

const listInput = z.object({
  projectId: z.string(),
  search: z.string().optional(),
  status: z.enum(["PENDING", "INCLUDED", "EXCLUDED", "MAYBE"]).optional(),
  sortBy: z.enum(["year", "title", "status"]).default("title"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const articleRouter = createTRPCRouter({
  list: projectMemberProcedure.input(listInput).query(async ({ ctx, input }) => {
    const reviewerId = ctx.session.user.id;

    const where: Prisma.ArticleWhereInput = {
      projectId: input.projectId,
    };

    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: "insensitive" } },
        { authors: { contains: input.search, mode: "insensitive" } },
      ];
    }

    if (input.status) {
      where.reviews = {
        some: {
          reviewerId,
          status: input.status,
        },
      };
    }

    let orderBy: Prisma.ArticleOrderByWithRelationInput;
    if (input.sortBy === "year") {
      orderBy = { year: input.sortDir };
    } else if (input.sortBy === "title") {
      orderBy = { title: input.sortDir };
    } else {
      orderBy = { title: "asc" };
    }

    const articles = await ctx.db.article.findMany({
      where,
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      orderBy,
      include: {
        reviews: {
          where: { reviewerId },
          take: 1,
        },
      },
    });

    let nextCursor: string | undefined;
    if (articles.length > input.limit) {
      const next = articles.pop();
      nextCursor = next?.id;
    }

    if (input.sortBy === "status") {
      const statusOrder: Record<ReviewStatus, number> = {
        PENDING: 0,
        MAYBE: 1,
        INCLUDED: 2,
        EXCLUDED: 3,
      };
      articles.sort((a, b) => {
        const aStatus = a.reviews[0]?.status ?? "PENDING";
        const bStatus = b.reviews[0]?.status ?? "PENDING";
        const aOrder = statusOrder[aStatus] ?? 0;
        const bOrder = statusOrder[bStatus] ?? 0;
        const diff = aOrder - bOrder;
        return input.sortDir === "asc" ? diff : -diff;
      });
    }

    return {
      items: articles.map((article) => ({
        id: article.id,
        pmid: article.pmid,
        title: article.title,
        authors: article.authors,
        firstAuthor: article.firstAuthor,
        journal: article.journal,
        year: article.year,
        doi: article.doi,
        review: article.reviews[0] ?? {
          status: "PENDING" as const,
          note: null,
          confidence: null,
        },
      })),
      nextCursor,
    };
  }),

  getById: projectMemberProcedure
    .input(z.object({ projectId: z.string(), articleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.article.findFirst({
        where: { id: input.articleId, projectId: input.projectId },
        include: {
          reviews: {
            where: { reviewerId: ctx.session.user.id },
            take: 1,
          },
        },
      });

      if (!article) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      return article;
    }),

  delete: projectOwnerProcedure
    .input(z.object({ projectId: z.string(), articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findFirst({
        where: { id: input.articleId, projectId: input.projectId },
      });

      if (!article) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      await ctx.db.article.delete({ where: { id: article.id } });
      return { success: true };
    }),

  exportCsv: projectMemberProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const articles = await ctx.db.article.findMany({
        where: { projectId: input.projectId },
        include: {
          reviews: {
            where: { reviewerId: ctx.session.user.id },
            take: 1,
          },
        },
        orderBy: { title: "asc" },
      });

      return {
        filename: `articles-export-${input.projectId}.csv`,
        content: articlesToCsv(articles),
      };
    }),
});
