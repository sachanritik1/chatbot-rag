import type {
  DocumentsRepository,
  StoredDocument,
} from "@/domain/documents/types";
import { createClient } from "@/utils/supabase/server";

export class SupabaseDocumentsRepository implements DocumentsRepository {
  async listByConversationId(
    conversationId: string,
  ): Promise<StoredDocument[]> {
    const supabase = await createClient();
    const res = await supabase
      .from("documents")
      .select("id, conversation_id, created_at")
      .eq("conversation_id", conversationId);
    return (res.data ?? []) as StoredDocument[];
  }

  async deleteByConversationId(conversationId: string): Promise<boolean> {
    const supabase = await createClient();
    const res = await supabase
      .from("documents")
      .delete()
      .eq("conversation_id", conversationId);
    return !res.error;
  }
}
