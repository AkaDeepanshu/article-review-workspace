import { OrgMembersClient } from "./org-members-client";

export default async function OrgMembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgMembersClient orgId={orgId} />;
}
