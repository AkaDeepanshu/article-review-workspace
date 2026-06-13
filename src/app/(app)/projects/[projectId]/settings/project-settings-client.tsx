"use client";

import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "easySLR/components/ui/select";
import { api } from "easySLR/trpc/react";

export function ProjectSettingsClient({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "REVIEWER">("REVIEWER");

  const utils = api.useUtils();
  const { data: project, isLoading: projectLoading } = api.project.get.useQuery({
    projectId,
  });
  const { data: members, isLoading: membersLoading } =
    api.project.listMembers.useQuery({ projectId });

  const invite = api.project.inviteMember.useMutation({
    onSuccess: () => {
      void utils.project.listMembers.invalidate({ projectId });
      setEmail("");
    },
  });

  const isOwner = project?.currentUserRole === "OWNER";
  const isLoading = projectLoading || membersLoading;

  if (isLoading) return <CardGridSkeleton count={1} />;

  if (!project) {
    return (
      <p className="text-destructive">Project not found or access denied.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Project Settings</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite member</CardTitle>
            <CardDescription>
              User must already be a member of the organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                invite.mutate({ projectId, email, role });
              }}
              className="flex flex-wrap gap-3"
            >
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
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
                    if (v === "OWNER" || v === "REVIEWER") setRole(v);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVIEWER">Reviewer</SelectItem>
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
          <CardTitle className="text-base">Project members</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {members?.map((member) => (
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
