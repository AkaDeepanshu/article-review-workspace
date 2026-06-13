"use client";

import { ProjectActionsShell } from "easySLR/components/layout/project-actions-shell";
import { AppSidebar } from "easySLR/components/layout/sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <ProjectActionsShell>
      <div className="flex h-screen overflow-hidden flex-col bg-background md:flex-row">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </ProjectActionsShell>
  );
}
