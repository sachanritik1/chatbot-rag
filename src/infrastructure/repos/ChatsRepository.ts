import type { ChatsRepository } from "@/domain/chat/types";
import { createClient } from "@/utils/supabase/server";
import type { ChatHistory } from "@/domain/chat/models";

export class SupabaseChatsRepository implements ChatsRepository {
  async getById(messageId: string) {
    const supabase = await createClient();
    const response = await supabase
      .from("chats")
      .select("id, sender, message, created_at, model")
      .eq("id", messageId)
      .single();

    if (response.error || !response.data) return null;
    return response.data as ChatHistory;
  }

  async getRecent(conversationId: string, limit: number) {
    const supabase = await createClient();
    const response = await supabase
      .from("chats")
      .select("id, sender, message, created_at, model")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);
    const data = (response.data || []).slice().reverse() as ChatHistory[];
    return { data } as const;
  }

  async create(
    conversationId: string,
    message: string,
    sender: "user" | "assistant",
    model?: string | null,
  ) {
    const supabase = await createClient();
    return supabase.from("chats").insert([
      {
        conversation_id: conversationId,
        sender,
        message,
        model: model ?? null,
      },
    ]);
  }

  async countByConversation(conversationId: string): Promise<number> {
    const supabase = await createClient();
    const head = await supabase
      .from("chats")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId);
    return head.count ?? 0;
  }

  async getOlder(
    conversationId: string,
    beforeMessageId: string,
    limit: number,
  ) {
    const supabase = await createClient();
    const cursor = await supabase
      .from("chats")
      .select("id, created_at")
      .eq("id", beforeMessageId)
      .eq("conversation_id", conversationId)
      .single();
    if (cursor.error || !cursor.data) {
      return { data: [], nextPage: 1, totalPages: 1 };
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
    const data = (response.data || []).slice().reverse() as ChatHistory[];

    const totalCount = await this.countByConversation(conversationId);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const createdAt = cursor.data.created_at as string;
    const rankHead = await supabase
      .from("chats")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .or(
        `created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gte.${beforeMessageId})`,
      );
    const index = (rankHead.count ?? 1) - 1;
    const nextPage = Math.min(totalPages, Math.floor((index + 1) / limit) + 1);
    return { data, nextPage, totalPages, totalCount };
  }
}
