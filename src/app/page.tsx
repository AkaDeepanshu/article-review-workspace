import { redirect } from "next/navigation";

import { auth } from "easySLR/server/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/orgs");
  }
  redirect("/login");
}
