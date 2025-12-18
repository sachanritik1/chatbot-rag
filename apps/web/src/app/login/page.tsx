import { AuthForm } from "@/components/AuthForm";
import { UserService } from "@chatbot-rag/domain/users";
import { createServerRepositories } from "@/utils/repositories";
import { redirect } from "next/navigation";
import LoginThemeToggle from "@/components/LoginThemeToggle";
import Link from "next/link";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { users: usersRepo } = await createServerRepositories();
  const userService = new UserService(usersRepo);
  const current = await userService.requireCurrentUser().catch(() => null);
  if (current?.id) redirect("/chat");
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#f8fafc] to-[#e0e7ef] transition-colors duration-300 dark:from-[#18181b] dark:to-[#23272f]">
      <LoginThemeToggle />
      <div className="flex w-full max-w-md flex-col items-center gap-4 px-4">
        <AuthForm defaultMode={sp.mode === "signup" ? "signup" : "login"} />
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/guest"
            className="text-primary underline-offset-4 hover:underline"
          >
            Continue as guest
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/"
            className="text-primary underline-offset-4 hover:underline"
          >
            Go to Home page
          </Link>
        </div>
      </div>
    </div>
  );
}
