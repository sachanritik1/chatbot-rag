import { AuthForm } from "@/components/AuthForm";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { redirect } from "next/navigation";
import LoginThemeToggle from "@/components/LoginThemeToggle";

export default async function Login() {
  const userService = new UserService(new SupabaseUsersRepository());
  const current = await userService.requireCurrentUser().catch(() => null);
  if (current?.id) redirect("/chat");
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] transition-colors duration-300 dark:from-[#18181b] dark:to-[#23272f]">
      <LoginThemeToggle />
      <AuthForm />
    </div>
  );
}
