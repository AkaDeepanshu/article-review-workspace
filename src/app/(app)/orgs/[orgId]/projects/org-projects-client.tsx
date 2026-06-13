"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";

import { EmptyState, ErrorState } from "easySLR/components/ui/empty-state";
import { CardGridSkeleton } from "easySLR/components/ui/page-skeletons";
import { Button } from "easySLR/components/ui/button";
import { Input } from "easySLR/components/ui/input";
import { Label } from "easySLR/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "easySLR/components/ui/card";
import { Badge } from "easySLR/components/ui/badge";
import { api } from "easySLR/trpc/react";

export function OrgProjectsClient({ orgId }: { orgId: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");

  const utils = api.useUtils();
  const { data: org } = api.organization.get.useQuery({ organizationId: orgId });
  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = api.project.listByOrg.useQuery({ organizationId: orgId });

  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      void utils.project.listByOrg.invalidate({ organizationId: orgId });
      setShowCreate(false);
      setProjectName("");
    },
  });

  const isOwner = org?.currentUserRole === "OWNER";

  if (isLoading) return <CardGridSkeleton count={2} />;
  if (error) {
    return <ErrorState message="Failed to load projects." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {org?.name} — projects you are a member of
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {showCreate && isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create project</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProject.mutate({
                  organizationId: orgId,
                  name: projectName,
                });
              }}
              className="flex flex-wrap gap-3"
            >
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Mindfulness SLR 2024"
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={createProject.isPending}>
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {projects?.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description={
            isOwner
              ? "Create a project to start importing and reviewing articles."
              : "You have not been added to any projects in this organization."
          }
          action={
            isOwner ? (
              <Button onClick={() => setShowCreate(true)}>Create Project</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <CardDescription>
                    {project.articleCount} articles · {project.memberCount} members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{project.currentUserRole}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
