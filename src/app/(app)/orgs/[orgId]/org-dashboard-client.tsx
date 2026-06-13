"use client";

import Link from "next/link";
import { FolderOpen, Plus, Users } from "lucide-react";

import { EmptyState } from "easySLR/components/ui/empty-state";
import { CardGridSkeleton } from "easySLR/components/ui/page-skeletons";
import { Button } from "easySLR/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "easySLR/components/ui/card";
import { Badge } from "easySLR/components/ui/badge";
import { api } from "easySLR/trpc/react";

export function OrgDashboardClient({ orgId }: { orgId: string }) {
  const { data: org, isLoading: orgLoading } = api.organization.get.useQuery({
    organizationId: orgId,
  });
  const { data: projects, isLoading: projectsLoading } =
    api.project.listByOrg.useQuery({ organizationId: orgId });

  const isLoading = orgLoading || projectsLoading;
  const isOwner = org?.currentUserRole === "OWNER";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <CardGridSkeleton count={2} />
      </div>
    );
  }

  if (!org) {
    return (
      <p className="text-destructive">Organization not found or access denied.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{org.name}</h1>
        <p className="text-sm text-muted-foreground">
          {org._count.projects} projects · Your role: {org.currentUserRole}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={`/orgs/${orgId}/projects`}>
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-5 w-5" />
                Projects
              </CardTitle>
              <CardDescription>
                View and manage your literature review projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{org._count.projects}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/orgs/${orgId}/members`}>
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>
                Manage organization members and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{org.members.length}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {projects && projects.length > 0 && (
        <div>
          <h2 className="mb-3 font-medium">Recent projects</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.slice(0, 4).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {project.name}
                    </CardTitle>
                    <CardDescription>
                      {project.articleCount} articles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">{project.currentUserRole}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isOwner && projects?.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create a project to start importing and reviewing articles."
          action={
            <Link href={`/orgs/${orgId}/projects`}>
              <Button>
                <Plus className="h-4 w-4" />
                Go to Projects
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
