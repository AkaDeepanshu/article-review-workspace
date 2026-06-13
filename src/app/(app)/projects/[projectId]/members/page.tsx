import { redirect } from "next/navigation";

export default async function ProjectMembersRedirect({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/settings`);
}
