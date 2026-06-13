import { OrgProjectsClient } from "./org-projects-client";

export default async function OrgProjectsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgProjectsClient orgId={orgId} />;
}
