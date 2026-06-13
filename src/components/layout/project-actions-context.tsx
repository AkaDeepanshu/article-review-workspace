"use client";

import { createContext, useContext } from "react";

type ProjectActions = {
  openImport: () => void;
  exportCsv: () => void;
  isOwner: boolean;
  isExporting: boolean;
};

const ProjectActionsContext = createContext<ProjectActions | null>(null);

export function ProjectActionsProvider({
  value,
  children,
}: {
  value: ProjectActions;
  children: React.ReactNode;
}) {
  return (
    <ProjectActionsContext.Provider value={value}>
      {children}
    </ProjectActionsContext.Provider>
  );
}

export function useProjectActions() {
  return useContext(ProjectActionsContext);
}
