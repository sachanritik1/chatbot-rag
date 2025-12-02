import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { ConversationService } from "@/domain/conversations/ConversationService";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
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
import ConversationCard from "./ConversationCard";
import NewConversationButton from "./NewConversationButton";
import ThemeToggleWrapper from "./ThemeToggleWrapper";
import { MessageSquare, LogOut } from "lucide-react";
import { Conversation } from "@/domain/conversations/types";

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

  const conversationsPromise = (async () => {
    const service = new ConversationService(
      new SupabaseConversationsRepository(),
      new SupabaseChatsRepository(),
    );
    const list = await service.listForUser(userId);
    return { data: list } as PostgrestSingleResponse<Conversation[]>;
  })();

  return (
    <Sidebar className="border-border/40 border-r">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-primary h-5 w-5" />
            <h2 className="text-lg font-semibold tracking-tight">
              Conversations
            </h2>
          </div>
          <NewConversationButton />
        </div>
      </SidebarHeader>
      <Suspense
        fallback={
          <div className="flex flex-col space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
          </div>
        }
      >
        <Conversations conversationsPromise={conversationsPromise} />
      </Suspense>
      <SidebarFooter className="border-border/40 border-t p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground truncate text-sm font-medium">
              {userResponse.data.user.email}
            </p>
            <ThemeToggleWrapper />
          </div>
          <form action={logout}>
            <Button
              variant="outline"
              type="submit"
              className="text-muted-foreground hover:text-foreground w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

interface ConversationsProps {
  conversationsPromise: Promise<PostgrestSingleResponse<Conversation[]>>;
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
    return (
      <SidebarContent className="flex-1 overflow-y-auto p-4">
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">
          Error fetching conversations
        </div>
      </SidebarContent>
    );
  }
  const conversations = conversationsResponse.data || [];

  return (
    <SidebarContent className="flex-1 overflow-y-auto px-3 py-2">
      <div className="space-y-1">
        {conversations.length === 0 ? (
          <div className="border-border/50 mt-8 flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-8 text-center">
            <div className="bg-primary/10 rounded-full p-3">
              <MessageSquare className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-muted-foreground text-xs">
                Start a new conversation to get help
              </p>
            </div>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))
        )}
      </div>
    </SidebarContent>
  );
}
