import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";

import {
  requireOrgOwner,
  requireProjectMember,
  requireProjectOwner,
} from "easySLR/server/api/middleware/project-access";
import { auth } from "easySLR/server/auth";
import { db } from "easySLR/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

const projectIdInput = z.object({ projectId: z.string() });
const orgIdInput = z.object({ organizationId: z.string() });

export const projectMemberProcedure = protectedProcedure
  .input(projectIdInput.passthrough())
  .use(async ({ ctx, input, next }) => {
    const membership = await requireProjectMember(
      ctx.db,
      ctx.session.user.id,
      input.projectId,
    );
    return next({
      ctx: { projectMembership: membership },
    });
  });

export const projectOwnerProcedure = protectedProcedure
  .input(projectIdInput.passthrough())
  .use(async ({ ctx, input, next }) => {
    const membership = await requireProjectOwner(
      ctx.db,
      ctx.session.user.id,
      input.projectId,
    );
    return next({
      ctx: { projectMembership: membership },
    });
  });

export const orgOwnerProcedure = protectedProcedure
  .input(orgIdInput.passthrough())
  .use(async ({ ctx, input, next }) => {
    const membership = await requireOrgOwner(
      ctx.db,
      ctx.session.user.id,
      input.organizationId,
    );
    return next({
      ctx: { orgMembership: membership },
    });
  });
