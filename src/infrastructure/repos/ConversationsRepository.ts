import type {
  ConversationsRepository,
  Conversation,
} from "@/domain/conversations/types";
import { createClient } from "@/utils/supabase/server";

export class SupabaseConversationsRepository
  implements ConversationsRepository
{
  async create(userId: string, title: string): Promise<{ id: string } | null> {
    const supabase = await createClient();
    const res = await supabase
      .from("conversations")
      .insert([{ user_id: userId, title }])
      .select("id")
      .single();
    if (res.error || !res.data) return null;
    return { id: res.data.id };
  }

  async listByUserId(userId: string): Promise<Conversation[]> {
    const supabase = await createClient();
    const res = await supabase
      .from("conversations")
      .select("id, user_id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (res.data ?? []) as Conversation[];
  }

  async deleteById(id: string): Promise<boolean> {
    const supabase = await createClient();
    const res = await supabase.from("conversations").delete().eq("id", id);
    return !res.error;
  }

  async verifyOwnership(
    userId: string,
    conversationId: string,
  ): Promise<boolean> {
    const supabase = await createClient();
    const res = await supabase
      .from("conversations")
      .select("user_id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();
    return !!res.data && !res.error;
  }

  async getById(conversationId: string) {
    const supabase = await createClient();
    const res = await supabase
      .from("conversations")
      .select("id, user_id, title, created_at")
      .eq("id", conversationId)
      .single();
    return res.error || !res.data ? null : (res.data as Conversation);
  }
}
