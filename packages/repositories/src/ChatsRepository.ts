import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChatHistory, ChatsRepository } from "@chatbot-rag/domain/chat";

export class SupabaseChatsRepository<
  T extends SupabaseClient = SupabaseClient,
> implements ChatsRepository {
  constructor(private readonly supabase: T) {}

  async getById(messageId: string) {
    const supabase = this.supabase;
    const response = await supabase
      .from("chats")
      .select("id, sender, message, created_at, model")
      .eq("id", messageId)
      .single();

    if (response.error) return null;
    return response.data as ChatHistory;
  }

  async getRecent(conversationId: string, limit: number) {
    const supabase = this.supabase;
    const response = await supabase
      .from("chats")
      .select("id, sender, message, created_at, model")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);
    const data = (response.data ?? []).slice().reverse() as ChatHistory[];
    return { data } as const;
  }

  async create(
    conversationId: string,
    message: string,
    sender: "user" | "assistant",
    model?: string | null,
  ) {
    const supabase = this.supabase;

    // Insert the message
    const result = await supabase.from("chats").insert([
      {
        conversation_id: conversationId,
        sender,
        message,
        model: model ?? null,
      },
    ]);

    // Mark conversation as having messages (idempotent - safe to set multiple times)
    await supabase
      .from("conversations")
      .update({ has_messages: true })
      .eq("id", conversationId);

    return result;
  }

  async countByConversation(conversationId: string): Promise<number> {
    const supabase = this.supabase;
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
    const supabase = this.supabase;
    const cursor = await supabase
      .from("chats")
      .select("id, created_at")
      .eq("id", beforeMessageId)
      .eq("conversation_id", conversationId)
      .single();
    if (cursor.error ?? !cursor.data) {
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
    const data = (response.data ?? []).slice().reverse() as ChatHistory[];

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

  async deleteAfterMessage(conversationId: string, messageId: string) {
    const supabase = this.supabase;

    // Get the timestamp of the message we're keeping
    const message = await supabase
      .from("chats")
      .select("created_at")
      .eq("id", messageId)
      .eq("conversation_id", conversationId)
      .single();

    if (message.error ?? !message.data) {
      return { error: "Message not found" };
    }

    // Delete all messages with created_at > message.created_at
    // OR (created_at = message.created_at AND id > messageId)
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("conversation_id", conversationId)
      .or(
        `created_at.gt.${message.data.created_at},and(created_at.eq.${message.data.created_at},id.gt.${messageId})`,
      );

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  }
}
