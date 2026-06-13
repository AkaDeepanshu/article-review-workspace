"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  ClipboardList,
  Download,
  FileText,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Settings,
  Upload,
  Users,
} from "lucide-react";

import { useProjectActions } from "easySLR/components/layout/project-actions-context";
import { Avatar, AvatarFallback } from "easySLR/components/ui/avatar";
import { Button } from "easySLR/components/ui/button";
import { Separator } from "easySLR/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "easySLR/components/ui/sheet";
import { cn } from "easySLR/lib/utils";
import { api } from "easySLR/trpc/react";

type SidebarContentProps = {
  orgId?: string;
  projectId?: string;
  onNavigate?: () => void;
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </button>
    );
  }

  return (
    <Link href={href!} onClick={onClick} className={className}>
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function SidebarContent({
  orgId,
  projectId,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const projectActions = useProjectActions();

  const { data: project } = api.project.get.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId },
  );

  const userName = session?.user?.name ?? session?.user?.email ?? "User";
  const initials = userName.slice(0, 2).toUpperCase();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
        <ClipboardList className="h-5 w-5 text-primary" />
        <div>
          <Link
            href="/orgs"
            onClick={onNavigate}
            className="text-base font-semibold text-sidebar-foreground"
          >
            ArticleDesk
          </Link>
          <p className="text-xs text-muted-foreground">
            Systematic literature review, simplified.
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {orgId && (
          <>
            <SectionLabel>Workspace</SectionLabel>
            <div className="space-y-0.5">
              <NavLink
                href={`/orgs/${orgId}`}
                label="Dashboard"
                icon={Home}
                active={pathname === `/orgs/${orgId}`}
                onClick={onNavigate}
              />
              <NavLink
                href={`/orgs/${orgId}/projects`}
                label="Projects"
                icon={FolderOpen}
                active={isActive(`/orgs/${orgId}/projects`)}
                onClick={onNavigate}
              />
              <NavLink
                href={`/orgs/${orgId}/members`}
                label="Members"
                icon={Users}
                active={isActive(`/orgs/${orgId}/members`)}
                onClick={onNavigate}
              />
            </div>
          </>
        )}

        {projectId && project && (
          <>
            <Separator className="my-4" />
            <SectionLabel>Current Project</SectionLabel>
            <p className="truncate px-3 pb-2 text-sm font-medium text-sidebar-foreground">
              {project.name}
            </p>
            <div className="space-y-0.5">
              <NavLink
                href={`/projects/${projectId}`}
                label="Articles"
                icon={FileText}
                active={pathname === `/projects/${projectId}`}
                onClick={onNavigate}
              />
              {projectActions?.isOwner && (
                <NavLink
                  label="Import"
                  icon={Upload}
                  onClick={() => {
                    projectActions.openImport();
                    onNavigate?.();
                  }}
                />
              )}
              <NavLink
                label="Export"
                icon={Download}
                onClick={() => {
                  void projectActions?.exportCsv();
                  onNavigate?.();
                }}
              />
              <NavLink
                href={`/projects/${projectId}/settings`}
                label="Settings"
                icon={Settings}
                active={isActive(`/projects/${projectId}/settings`)}
                onClick={onNavigate}
              />
            </div>
          </>
        )}

        {!orgId && !projectId && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Select an organization to get started.
          </div>
        )}
      </nav>

      <div className="sticky bottom-0 border-t border-sidebar-border bg-sidebar p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function parseRoute(pathname: string) {
  const orgMatch = /^\/orgs\/([^/]+)/.exec(pathname);
  const projectMatch = /^\/projects\/([^/]+)/.exec(pathname);
  return {
    orgId: orgMatch?.[1],
    projectId: projectMatch?.[1],
  };
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { orgId: pathOrgId, projectId } = parseRoute(pathname);

  const { data: project } = api.project.get.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId },
  );

  const orgId = pathOrgId ?? project?.organizationId;

  return (
    <>
      <aside className="hidden h-screen w-60 shrink-0 border-r border-sidebar-border md:block">
        <SidebarContent orgId={orgId} projectId={projectId} />
      </aside>

      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-3 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <SidebarContent
              orgId={orgId}
              projectId={projectId}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">ArticleDesk</span>
      </div>
    </>
  );
}
