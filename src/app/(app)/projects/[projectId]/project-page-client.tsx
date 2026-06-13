"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ArticleTable } from "easySLR/components/articles/article-table";
import { ImportDialog } from "easySLR/components/import/import-dialog";
import { ProjectActionsProvider } from "easySLR/components/layout/project-actions-context";
import { CardGridSkeleton } from "easySLR/components/ui/page-skeletons";
import { api } from "easySLR/trpc/react";

export function ProjectPageClient({ projectId }: { projectId: string }) {
  const [importOpen, setImportOpen] = useState(false);

  const { data: project, isLoading } = api.project.get.useQuery({ projectId });

  const exportCsv = api.article.exportCsv.useQuery(
    { projectId },
    { enabled: false },
  );

  const isOwner = project?.currentUserRole === "OWNER";

  async function handleExport() {
    const result = await exportCsv.refetch();
    if (result.data) {
      const blob = new Blob([result.data.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    }
  }

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
    <ProjectActionsProvider
      value={{
        openImport: () => setImportOpen(true),
        exportCsv: () => void handleExport(),
        isOwner,
        isExporting: exportCsv.isFetching,
      }}
    >
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
          onImportClick={() => setImportOpen(true)}
        />

        <ImportDialog
          projectId={projectId}
          open={importOpen}
          onClose={() => setImportOpen(false)}
        />
      </div>
    </ProjectActionsProvider>
  );
}
