import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

import {
  requireProjectMember,
  requireProjectOwner,
} from "easySLR/server/api/middleware/project-access";

function createMockDb(membership: { role: string } | null) {
  return {
    projectMember: {
      findUnique: vi.fn().mockResolvedValue(membership),
    },
  } as unknown as Parameters<typeof requireProjectMember>[0];
}

describe("project access middleware", () => {
  it("allows project members", async () => {
    const db = createMockDb({ role: "REVIEWER" });
    const result = await requireProjectMember(db, "user-1", "project-1");
    expect(result.role).toBe("REVIEWER");
  });

  it("forbids non-members", async () => {
    const db = createMockDb(null);
    await expect(
      requireProjectMember(db, "user-1", "project-1"),
    ).rejects.toThrow(TRPCError);
  });

  it("forbids reviewers from owner actions", async () => {
    const db = createMockDb({ role: "REVIEWER" });
    await expect(
      requireProjectOwner(db, "user-1", "project-1"),
    ).rejects.toThrow(TRPCError);
  });

  it("allows project owners", async () => {
    const db = createMockDb({ role: "OWNER" });
    const result = await requireProjectOwner(db, "user-1", "project-1");
    expect(result.role).toBe("OWNER");
  });
});
