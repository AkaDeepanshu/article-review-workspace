"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";

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

export function OrgsPageClient() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  const utils = api.useUtils();
  const { data: orgs, isLoading, error, refetch } = api.organization.list.useQuery();
  const createOrg = api.organization.create.useMutation({
    onSuccess: () => {
      void utils.organization.list.invalidate();
      setShowCreate(false);
      setName("");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <CardGridSkeleton />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load organizations." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Select an organization to manage projects and reviews
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Organization
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrg.mutate({ name });
              }}
              className="flex flex-wrap gap-3"
            >
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Research Lab"
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={createOrg.isPending}>
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

      {orgs?.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create an organization to start managing systematic literature reviews."
          action={<Button onClick={() => setShowCreate(true)}>Create Organization</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs?.map((org) => (
            <Link key={org.id} href={`/orgs/${org.id}`}>
              <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <CardDescription>
                    {org.projectCount} projects · {org.memberCount} members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{org.role}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
