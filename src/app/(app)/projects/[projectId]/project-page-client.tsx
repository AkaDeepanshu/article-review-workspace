"use client";

import { ArticleTable } from "easySLR/components/articles/article-table";
import { useProjectActions } from "easySLR/components/layout/project-actions-context";
import { CardGridSkeleton } from "easySLR/components/ui/page-skeletons";
import { api } from "easySLR/trpc/react";

export function ProjectPageClient({ projectId }: { projectId: string }) {
  const projectActions = useProjectActions();
  const { data: project, isLoading } = api.project.get.useQuery({ projectId });

  const isOwner = project?.currentUserRole === "OWNER";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <CardGridSkeleton count={1} />
      </div>
    );
  }

  if (!project) {
    return (
      <p className="text-destructive">Project not found or access denied.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          {project.articleCount} articles · Role: {project.currentUserRole}
        </p>
      </div>

      <ArticleTable
        projectId={projectId}
        isOwner={isOwner}
        onImportClick={() => projectActions?.openImport()}
      />
    </div>
  );
}
