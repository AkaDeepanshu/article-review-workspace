"use client";

import { createContext, useContext } from "react";

export type ActiveFilters = {
  search?: string;
  status?: "PENDING" | "INCLUDED" | "EXCLUDED" | "MAYBE";
  sortBy: "year" | "title" | "status";
  sortDir: "asc" | "desc";
};

type ProjectActions = {
  openImport: () => void;
  exportCsv: () => void;
  isOwner: boolean;
  isExporting: boolean;
  setActiveFilters: (filters: ActiveFilters) => void;
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
