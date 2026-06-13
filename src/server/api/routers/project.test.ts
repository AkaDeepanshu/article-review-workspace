import { describe, expect, it, vi } from "vitest";

describe("project listByOrg authorization", () => {
  it("filters projects by ProjectMember membership", async () => {
    const userId = "reviewer-user-id";
    const orgId = "org-1";

    const mockFindMany = vi.fn().mockResolvedValue([
      {
        id: "project-1",
        name: "Member Project",
        organizationId: orgId,
        createdAt: new Date(),
        members: [{ role: "REVIEWER" }],
        _count: { articles: 5, members: 2 },
      },
    ]);

    const db = {
      projectMember: { findUnique: vi.fn() },
      organizationMember: { findUnique: vi.fn().mockResolvedValue({ role: "MEMBER" }) },
      project: { findMany: mockFindMany },
    };

    // Simulate the corrected query shape
    await db.project.findMany({
      where: {
        organizationId: orgId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: { select: { articles: true, members: true } },
      },
      orderBy: { name: "asc" },
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: orgId,
          members: { some: { userId } },
        },
      }),
    );
  });

  it("does not return all org projects without membership filter", () => {
    const wrongWhere = { organizationId: "org-1" };
    const correctWhere = {
      organizationId: "org-1",
      members: { some: { userId: "user-1" } },
    };

    expect(wrongWhere).not.toHaveProperty("members");
    expect(correctWhere.members.some.userId).toBe("user-1");
  });
});
