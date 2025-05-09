import { createClient } from "@/utils/supabase/server";
import ChatPage from "./Home";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const logout = async () => {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};

const Page = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/");
  }
  return (
    <div>
      <div className="flex justify-between items-center">
        <p>Hello {data.user.email}</p>
        <form action={logout}>
          <Button variant="outline" type="submit">
            Logout
          </Button>
        </form>
      </div>
      <ChatPage />
    </div>
  );
};

export default Page;
