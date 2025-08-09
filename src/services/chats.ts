import "server-only";

import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatHistory = {
  sender: "user" | "assistant";
  message: string;
  created_at: string;
  id?: string;
  model?: string | null;
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
    .select("id, sender, message, created_at, model")
    .eq("conversation_id", conversationId)
    // get latest first, we'll reverse below so UI sees chronological order
    .order("created_at", { ascending: false })
    .limit(limit);
  if (response.data) {
    response.data = [...response.data].reverse();
  }
  // Compute total pages (treat newest page as page 1)
  const totalHead = await supabase
    .from("chats")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);
  const totalCount = totalHead.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  return { ...response, page: 1, totalPages } as const;
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
    .select("id, sender, message, created_at, model")
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
  // Compute total pages and next page index relative to cursor (newest page is page 1)
  const totalHead = await supabase
    .from("chats")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);
  const totalCount = totalHead.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const createdAt = cursor.data.created_at as string;
  const rankHead = await supabase
    .from("chats")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .or(
      `created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gte.${beforeMessageId})`,
    );
  const index = (rankHead.count ?? 1) - 1; // zero-based index of cursor in newest-first ordering
  const nextPage = Math.min(totalPages, Math.floor((index + 1) / limit) + 1);

  return { ...response, page: nextPage, totalPages } as const;
};

export const createChat = async (
  conversationId: string,
  message: string,
  sender: "user" | "assistant",
  model?: string | null,
  supabaseOverride?: SupabaseClient,
) => {
  const supabase = supabaseOverride ?? (await createClient());
  const response = await supabase.from("chats").insert([
    {
      conversation_id: conversationId,
      sender,
      message,
      model: model ?? null,
    },
  ]);
  if (response.error) {
    console.error("Failed to create chat:", response.error);
  }

  return response;
};
