import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { getAllConversationsByUserId } from "@/services/conversations";
import { tryCatch } from "@/utils/try-catch";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar";
import { redirect } from "next/navigation";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Suspense } from "react";

const logout = async () => {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};

export default async function AppSideBar() {
  const supabase = await createClient();

  const [userResponse, userError] = await tryCatch(supabase.auth.getUser());
  const userId = userResponse?.data?.user?.id;
  if (userError || userResponse.error || !userId) {
    return <div>Error fetching user data</div>;
  }

  const conversationsPromise = getAllConversationsByUserId(userId);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button variant="ghost" size="icon" title="New Conversation">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </SidebarHeader>
      <Suspense fallback={<div>Loading conversations...</div>}>
        <Conversations conversationsPromise={conversationsPromise} />
      </Suspense>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2">
          <p>{userResponse.data.user.email}</p>
          <form action={logout}>
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

interface ConversationsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversationsPromise: Promise<PostgrestSingleResponse<any[]>>;
}

export async function Conversations({
  conversationsPromise,
}: ConversationsProps) {
  const [conversationsResponse, conversationsError] =
    await tryCatch(conversationsPromise);
  if (conversationsError || conversationsResponse.error) {
    console.error(
      "Error fetching conversations:",
      conversationsError || conversationsResponse.error,
    );
    return <div>Error fetching conversations</div>;
  }
  const conversations = conversationsResponse.data || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  return (
    <SidebarContent className="flex-1 space-y-2 overflow-y-auto p-2">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No conversations yet. Start a new one!
        </div>
      ) : (
        conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={`cursor-pointer p-3 transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 ${
              "currentConversationId" === conversation.id
                ? "border-blue-300 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30"
                : "bg-white dark:bg-[#23272f]"
            }`}
            //   onClick={() => onConversationSelect(conversation.id)}
          >
            <div className="truncate font-medium">{conversation.title}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formatDate(conversation.created_at)}
            </div>
          </Card>
        ))
      )}
    </SidebarContent>
  );
}
