import { ProjectSettingsClient } from "./project-settings-client";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectSettingsClient projectId={projectId} />;
}
