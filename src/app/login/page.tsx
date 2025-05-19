import { AuthForm } from "@/components/AuthForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Login() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  console.log("User data:", data);

  if (data?.user && data.user.id) {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] transition-colors duration-300 dark:from-[#18181b] dark:to-[#23272f]">
      <AuthForm />
    </div>
  );
}
