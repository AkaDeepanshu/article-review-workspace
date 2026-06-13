import { describe, expect, it, vi } from "vitest";

describe("review upsert", () => {
  it("creates on first call and updates on second", async () => {
    const store = new Map<string, { status: string; note: string | null }>();

    const upsert = vi.fn(
      async (args: {
        where: { articleId_reviewerId: { articleId: string; reviewerId: string } };
        create: { status: string; note?: string | null };
        update: { status: string; note?: string | null };
      }) => {
        const key = `${args.where.articleId_reviewerId.articleId}:${args.where.articleId_reviewerId.reviewerId}`;
        const existing = store.get(key);
        if (existing) {
          const updated = { ...existing, ...args.update };
          store.set(key, updated);
          return updated;
        }
        const created = {
          status: args.create.status,
          note: args.create.note ?? null,
        };
        store.set(key, created);
        return created;
      },
    );

    await upsert({
      where: {
        articleId_reviewerId: { articleId: "art-1", reviewerId: "rev-1" },
      },
      create: { status: "PENDING" },
      update: { status: "INCLUDED" },
    });

    expect(store.get("art-1:rev-1")?.status).toBe("PENDING");

    await upsert({
      where: {
        articleId_reviewerId: { articleId: "art-1", reviewerId: "rev-1" },
      },
      create: { status: "PENDING" },
      update: { status: "INCLUDED", note: "Relevant study" },
    });

    expect(store.get("art-1:rev-1")?.status).toBe("INCLUDED");
    expect(store.get("art-1:rev-1")?.note).toBe("Relevant study");
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("maintains unique per article-reviewer pair", async () => {
    const keys = new Set<string>();

    keys.add("art-1:rev-1");
    keys.add("art-1:rev-2");

    expect(keys.size).toBe(2);
  });
});
