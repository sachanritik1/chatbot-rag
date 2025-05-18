import "server-only";

import { createClient } from "@/utils/supabase/server";

export type ChatHistory = {
  sender: "user" | "assistant";
  message: string;
  created_at: string;
};

export const getChatHistoryByConversationId = async (
  conversationId: string,
  limit: number = 10
) => {
  const supabase = await createClient();
  // Fetch all chat history for this conversation
  const response = await supabase
    .from("chats")
    .select("sender, message, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return response;
};

export const createChat = async (
  conversationId: string,
  message: string,
  sender: "user" | "assistant"
) => {
  const supabase = await createClient();
  const response = await supabase.from("chats").insert([
    {
      conversation_id: conversationId,
      sender,
      message,
    },
  ]);
  console.log("Chat created:", response);

  return response;
};
