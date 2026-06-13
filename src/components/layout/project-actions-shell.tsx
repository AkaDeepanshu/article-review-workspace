"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { ImportDialog } from "easySLR/components/import/import-dialog";
import { ProjectActionsProvider } from "easySLR/components/layout/project-actions-context";
import { api } from "easySLR/trpc/react";

function parseProjectId(pathname: string) {
  return /^\/projects\/([^/]+)/.exec(pathname)?.[1];
}

export function ProjectActionsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const projectId = parseProjectId(pathname);
  const [importOpen, setImportOpen] = useState(false);

  const { data: project } = api.project.get.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId },
  );

  const exportCsvMutation = api.article.exportCsv.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    },
    onError: (err) => toast.error(`Export failed: ${err.message}`),
  });

  const openImport = useCallback(() => setImportOpen(true), []);
  const exportCsv = useCallback(() => {
    if (projectId) {
      exportCsvMutation.mutate({ projectId });
    }
  }, [exportCsvMutation, projectId]);

  const value = useMemo(
    () => ({
      openImport,
      exportCsv,
      isOwner: project?.currentUserRole === "OWNER",
      isExporting: exportCsvMutation.isPending,
    }),
    [openImport, exportCsv, project?.currentUserRole, exportCsvMutation.isPending],
  );

  return (
    <ProjectActionsProvider value={value}>
      {children}
      {projectId && (
        <ImportDialog
          projectId={projectId}
          open={importOpen}
          onClose={() => setImportOpen(false)}
        />
      )}
    </ProjectActionsProvider>
  );
}
