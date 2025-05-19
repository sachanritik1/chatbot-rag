import { Metadata } from "next";
import ChatPage from "../chat";
import { tryCatch } from "@/utils/try-catch";
import { getConversationById } from "@/services/conversations";
import { getChatHistoryByConversationId } from "@/services/chats";

type Props = {
  params: Promise<{
    conversationId: string;
  }>;
};

// Dynamic metadata based on conversationId
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { conversationId } = await params;
  const [res, err] = await tryCatch(getConversationById(conversationId));

  if (err || res.error) {
    return {
      title: "AI Chat App",
      description: "Chat with AI",
    };
  }

  const conversation = res?.data;

  return {
    title: `${conversation.title}`,
    description: `Chat with AI about ${conversation.title}`,
  };
}

const Page = async ({ params }: Props) => {
  const { conversationId } = await params;
  const [res, err] = await tryCatch(getConversationById(conversationId));
  if (err || res.error) {
    return <ChatPage />;
  }
  const conversation = res?.data;
  const [chatsResponse, chatError] = await tryCatch(
    getChatHistoryByConversationId(conversationId),
  );
  if (chatError || chatsResponse.error) {
    return <ChatPage />;
  }
  const messages =
    chatsResponse.data.map((chat) => ({
      role: chat.sender,
      content: chat.message,
      createdAt: chat.created_at,
    })) || [];
  return <ChatPage title={conversation.title} prevMessages={messages} />;
};

export default Page;
