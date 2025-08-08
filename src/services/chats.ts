import "server-only";

import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatHistory = {
  sender: "user" | "assistant";
  message: string;
  created_at: string;
  id?: string;
};

export const getChatHistoryByConversationId = async (
  conversationId: string,
  limit: number = 10,
  supabaseOverride?: SupabaseClient,
) => {
  const supabase = supabaseOverride ?? (await createClient());
  // Fetch all chat history for this conversation
  const response = await supabase
    .from("chats")
    .select("id, sender, message, created_at")
    .eq("conversation_id", conversationId)
    // get latest first, we'll reverse below so UI sees chronological order
    .order("created_at", { ascending: false })
    .limit(limit);
  if (response.data) {
    response.data = [...response.data].reverse();
  }
  return response;
};

export const getOlderChatHistoryByConversationId = async (
  conversationId: string,
  beforeMessageId: string,
  limit: number = 20,
  supabaseOverride?: SupabaseClient,
) => {
  const supabase = supabaseOverride ?? (await createClient());
  // Fetch the cursor message to read its created_at and id
  const cursor = await supabase
    .from("chats")
    .select("id, created_at")
    .eq("id", beforeMessageId)
    .eq("conversation_id", conversationId)
    .single();
  if (cursor.error || !cursor.data) {
    return { data: [], error: cursor.error } as const;
  }
  const response = await supabase
    .from("chats")
    .select("id, sender, message, created_at")
    .eq("conversation_id", conversationId)
    .or(
      `created_at.lt.${cursor.data.created_at},and(created_at.eq.${cursor.data.created_at},id.lt.${beforeMessageId})`,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (response.data) {
    response.data = [...response.data].reverse();
  }
  return response;
};

export const createChat = async (
  conversationId: string,
  message: string,
  sender: "user" | "assistant",
  supabaseOverride?: SupabaseClient,
) => {
  const supabase = supabaseOverride ?? (await createClient());
  const response = await supabase.from("chats").insert([
    {
      conversation_id: conversationId,
      sender,
      message,
    },
  ]);
  if (response.error) {
    console.error("Failed to create chat:", response.error);
  }

  return response;
};
