import { articleRouter } from "easySLR/server/api/routers/article";
import { authRouter } from "easySLR/server/api/routers/auth";
import { importRouter } from "easySLR/server/api/routers/import";
import { organizationRouter } from "easySLR/server/api/routers/organization";
import { projectRouter } from "easySLR/server/api/routers/project";
import { reviewRouter } from "easySLR/server/api/routers/review";
import { createCallerFactory, createTRPCRouter } from "easySLR/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  organization: organizationRouter,
  project: projectRouter,
  article: articleRouter,
  review: reviewRouter,
  import: importRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
