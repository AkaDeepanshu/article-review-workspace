"use client";

import { useState } from "react";

import { api } from "easySLR/trpc/react";
import { CardGridSkeleton } from "easySLR/components/ui/page-skeletons";
import { ErrorState } from "easySLR/components/ui/empty-state";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "easySLR/components/ui/select";

export function OrgMembersClient({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "MEMBER">("MEMBER");

  const utils = api.useUtils();
  const { data: org, isLoading, error, refetch } = api.organization.get.useQuery({
    organizationId: orgId,
  });

  const invite = api.organization.inviteMember.useMutation({
    onSuccess: () => {
      void utils.organization.get.invalidate({ organizationId: orgId });
      setEmail("");
    },
  });

  const isOwner = org?.currentUserRole === "OWNER";

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

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite member</CardTitle>
            <CardDescription>
              Invite a registered user to this organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                invite.mutate({ organizationId: orgId, email, role });
              }}
              className="flex flex-wrap gap-3"
            >
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="org-invite-email">Email</Label>
                <Input
                  id="org-invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reviewer@articledesk.dev"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => {
                    if (v === "OWNER" || v === "MEMBER") setRole(v);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={invite.isPending}>
                  Invite
                </Button>
              </div>
            </form>
            {invite.error && (
              <p className="mt-2 text-sm text-destructive">
                {invite.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
