import { AppShell } from "easySLR/components/layout/app-shell";
import { requireSession } from "easySLR/lib/auth-utils";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return <AppShell>{children}</AppShell>;
}
