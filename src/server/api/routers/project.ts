import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { requireOrgMember } from "easySLR/server/api/middleware/project-access";
import {
  createTRPCRouter,
  orgOwnerProcedure,
  projectMemberProcedure,
  protectedProcedure,
} from "easySLR/server/api/trpc";

export const projectRouter = createTRPCRouter({
  create: orgOwnerProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          organizationId: input.organizationId,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });
      return project;
    }),

  listByOrg: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOrgMember(
        ctx.db,
        ctx.session.user.id,
        input.organizationId,
      );

      const projects = await ctx.db.project.findMany({
        where: {
          organizationId: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          members: {
            where: { userId: ctx.session.user.id },
            select: { role: true },
          },
          _count: { select: { articles: true, members: true } },
        },
        orderBy: { name: "asc" },
      });

      return projects.map((p) => ({
        id: p.id,
        name: p.name,
        organizationId: p.organizationId,
        createdAt: p.createdAt,
        articleCount: p._count.articles,
        memberCount: p._count.members,
        currentUserRole: p.members[0]?.role ?? null,
      }));
    }),

  get: projectMemberProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { articles: true, members: true } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return {
        ...project,
        articleCount: project._count.articles,
        memberCount: project._count.members,
        currentUserRole: ctx.projectMembership.role,
      };
    }),

  listMembers: projectMemberProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.projectMember.findMany({
        where: { projectId: input.projectId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  inviteMember: projectMemberProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        role: z.enum(["OWNER", "REVIEWER"]).default("REVIEWER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.projectMembership.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project owner access required",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User with this email not found",
        });
      }

      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { organizationId: true },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const orgMember = await ctx.db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: project.organizationId,
            userId: user.id,
          },
        },
      });

      if (!orgMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must be an organization member first",
        });
      }

      const existing = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: user.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this project",
        });
      }

      return ctx.db.projectMember.create({
        data: {
          projectId: input.projectId,
          userId: user.id,
          role: input.role,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    }),
});
