import { OrgDashboardClient } from "./org-dashboard-client";

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgDashboardClient orgId={orgId} />;
}
