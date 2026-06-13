import { z } from "zod";

import {
  createTRPCRouter,
  projectOwnerProcedure,
} from "easySLR/server/api/trpc";
import { computeDedupHash } from "easySLR/server/services/dedup";
import { parseExcelBuffer } from "easySLR/server/services/import-parser";

const importRowSchema = z.object({
  rowNumber: z.number(),
  pmid: z.string().nullable(),
  title: z.string().nullable(),
  authors: z.string().nullable(),
  citation: z.string().nullable(),
  firstAuthor: z.string().nullable(),
  journal: z.string().nullable(),
  year: z.number().nullable(),
  createDate: z.string().nullable(),
  pmcid: z.string().nullable(),
  nihmsId: z.string().nullable(),
  doi: z.string().nullable(),
  dedupHash: z.string(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
});

export const importRouter = createTRPCRouter({
  parsePreview: projectOwnerProcedure
    .input(
      z.object({
        projectId: z.string(),
        fileBase64: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");

      const existing = await ctx.db.article.findMany({
        where: { projectId: input.projectId },
        select: { dedupHash: true },
      });
      const existingHashes = new Set(existing.map((a) => a.dedupHash));

      return parseExcelBuffer(buffer, computeDedupHash, existingHashes);
    }),

  confirmImport: projectOwnerProcedure
    .input(
      z.object({
        projectId: z.string(),
        rows: z.array(importRowSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const members = await ctx.db.projectMember.findMany({
        where: { projectId: input.projectId },
        select: { userId: true },
      });

      let imported = 0;
      let skippedDuplicates = 0;

      for (const row of input.rows) {
        if (!row.title && !row.pmid) continue;

        try {
          const article = await ctx.db.article.create({
            data: {
              projectId: input.projectId,
              pmid: row.pmid,
              title: row.title ?? "Untitled",
              authors: row.authors,
              citation: row.citation,
              firstAuthor: row.firstAuthor,
              journal: row.journal,
              year: row.year,
              createDate: row.createDate,
              pmcid: row.pmcid,
              nihmsId: row.nihmsId,
              doi: row.doi,
              dedupHash: row.dedupHash,
              importWarnings:
                row.warnings.length > 0 ? row.warnings : undefined,
            },
          });

          await ctx.db.articleReview.createMany({
            data: members.map((m) => ({
              articleId: article.id,
              reviewerId: m.userId,
              status: "PENDING" as const,
            })),
            skipDuplicates: true,
          });

          imported++;
        } catch {
          skippedDuplicates++;
        }
      }

      return {
        imported,
        skippedDuplicates,
        total: input.rows.length,
      };
    }),
});
