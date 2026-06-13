import { ProjectPageClient } from "./project-page-client";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectPageClient projectId={projectId} />;
}
