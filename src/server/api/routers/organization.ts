import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { requireOrgMember } from "easySLR/server/api/middleware/project-access";
import {
  createTRPCRouter,
  orgOwnerProcedure,
  protectedProcedure,
} from "easySLR/server/api/trpc";

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.create({
        data: {
          name: input.name,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });
      return org;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.organizationMember.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        organization: {
          include: {
            _count: { select: { projects: true, members: true } },
          },
        },
      },
      orderBy: { organization: { name: "asc" } },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      projectCount: m.organization._count.projects,
      memberCount: m.organization._count.members,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOrgMember(
        ctx.db,
        ctx.session.user.id,
        input.organizationId,
      );

      const org = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { projects: true } },
        },
      });

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      const membership = org.members.find(
        (m) => m.userId === ctx.session.user.id,
      );

      return {
        ...org,
        currentUserRole: membership?.role ?? null,
      };
    }),

  inviteMember: orgOwnerProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
        role: z.enum(["OWNER", "MEMBER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User with this email not found",
        });
      }

      const existing = await ctx.db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: user.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this organization",
        });
      }

      return ctx.db.organizationMember.create({
        data: {
          organizationId: input.organizationId,
          userId: user.id,
          role: input.role,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    }),
});
