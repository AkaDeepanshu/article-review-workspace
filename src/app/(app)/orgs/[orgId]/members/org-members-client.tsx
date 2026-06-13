"use client";

import { api } from "easySLR/trpc/react";
import { CardGridSkeleton } from "easySLR/components/ui/page-skeletons";
import { ErrorState } from "easySLR/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "easySLR/components/ui/card";
import { Badge } from "easySLR/components/ui/badge";

export function OrgMembersClient({ orgId }: { orgId: string }) {
  const { data: org, isLoading, error, refetch } = api.organization.get.useQuery({
    organizationId: orgId,
  });

  if (isLoading) return <CardGridSkeleton count={1} />;
  if (error || !org) {
    return (
      <ErrorState
        message="Failed to load members or access denied."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-sm text-muted-foreground">{org.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization members</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {org.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-medium">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
              <Badge variant="secondary">{member.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
