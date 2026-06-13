import { TRPCError } from "@trpc/server";

import type { OrgRole, ProjectRole } from "../../../../generated/prisma";
import type { db as DbClient } from "easySLR/server/db";

type Db = typeof DbClient;

export async function getProjectMembership(
  db: Db,
  userId: string,
  projectId: string,
) {
  return db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

export async function requireProjectMember(
  db: Db,
  userId: string,
  projectId: string,
) {
  const membership = await getProjectMembership(db, userId, projectId);
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this project",
    });
  }
  return membership;
}

export async function requireProjectOwner(
  db: Db,
  userId: string,
  projectId: string,
) {
  const membership = await requireProjectMember(db, userId, projectId);
  if (membership.role !== ("OWNER" satisfies ProjectRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Project owner access required",
    });
  }
  return membership;
}

export async function getOrgMembership(
  db: Db,
  userId: string,
  organizationId: string,
) {
  return db.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  });
}

export async function requireOrgMember(
  db: Db,
  userId: string,
  organizationId: string,
) {
  const membership = await getOrgMembership(db, userId, organizationId);
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }
  return membership;
}

export async function requireOrgOwner(
  db: Db,
  userId: string,
  organizationId: string,
) {
  const membership = await requireOrgMember(db, userId, organizationId);
  if (membership.role !== ("OWNER" satisfies OrgRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization owner access required",
    });
  }
  return membership;
}
