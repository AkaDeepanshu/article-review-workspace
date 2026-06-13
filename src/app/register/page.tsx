import { redirect } from "next/navigation";

import { RegisterForm } from "./register-form";
import { auth } from "easySLR/server/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "easySLR/components/ui/card";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/orgs");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Join ArticleDesk — systematic literature review, simplified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  );
}
