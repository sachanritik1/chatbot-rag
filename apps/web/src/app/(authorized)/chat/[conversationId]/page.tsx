import type { Metadata } from "next";
import ChatPage from "../chat";
import ChatHeader from "@/components/ChatHeader";
//
import { ConversationService } from "@chatbot-rag/domain/conversations";
import { createServerRepositories } from "@/utils/repositories";
import type { ModelId } from "@/config/models";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    conversationId: string;
  }>;
  searchParams: Promise<{
    regenerate?: string;
    model?: ModelId;
  }>;
}

// Dynamic metadata based on conversationId
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { conversationId } = await params;
  const { conversations: convRepo, chats: chatsRepo } =
    await createServerRepositories();
  const convService = new ConversationService(convRepo, chatsRepo);
  const conversation = (await convService.getById(conversationId)) as {
    title: string;
  } | null;
  if (!conversation) {
    return {
      title: "AI Chat App",
      description: "Chat with AI",
    };
  }

  return {
    title: `${conversation.title}`,
    description: `Chat with AI about ${conversation.title}`,
  };
}

const Page = async ({ params, searchParams }: Props) => {
  const { conversationId } = await params;
  const { regenerate, model } = await searchParams;
  const { conversations: convRepo2, chats: chatsRepo2 } =
    await createServerRepositories();
  const convService = new ConversationService(convRepo2, chatsRepo2);
  const conversation = (await convService.getById(conversationId)) as {
    title: string;
  } | null;
  if (!conversation) {
    return <ChatPage />;
  }
  const recent = await chatsRepo2.getRecent(conversationId, 10);
  const messages = recent.data.slice().map((chat) => ({
    id: chat.id,
    role: chat.sender === "assistant" ? ("bot" as const) : ("user" as const),
    content: chat.message,
    createdAt: chat.created_at,
    model: chat.model ?? null,
  }));
  // With a simple newest-first fetch, assume there may be more if we hit the limit
  const initialHasMore = recent.data.length >= 10;
  return (
    <>
      <ChatHeader title={conversation.title} />
      <ChatPage
        prevMessages={messages}
        initialHasMore={initialHasMore}
        shouldRegenerate={regenerate === "true"}
        regenerateModel={model}
      />
    </>
  );
};

export default Page;
