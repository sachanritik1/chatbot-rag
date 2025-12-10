import type {
  ConversationsRepository,
  Conversation,
  ConversationTree,
} from "@/domain/conversations/types";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConversationsRepository
  implements ConversationsRepository
{
  constructor(private supabaseClient?: SupabaseClient) {}

  async create(userId: string, title: string): Promise<{ id: string } | null> {
    const supabase = this.supabaseClient || (await createClient());
    const res = await supabase
      .from("conversations")
      .insert([{ user_id: userId, title }])
      .select("id")
      .single();
    if (res.error || !res.data) return null;
    return { id: res.data.id };
  }

  async updateTitle(conversationId: string, title: string): Promise<boolean> {
    const supabase = this.supabaseClient || (await createClient());
    const res = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);
    return !res.error;
  }

  async listByUserId(userId: string): Promise<Conversation[]> {
    const supabase = this.supabaseClient || (await createClient());
    const res = await supabase
      .from("conversations")
      .select(
        "id, user_id, title, created_at, parent_conversation_id, parent_message_id, branch_created_at, branch_label",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (res.error) {
      console.error("Error fetching conversations:", res.error);
    }
    console.log(
      `Fetched ${res.data?.length || 0} conversations for user ${userId}`,
    );

    return (res.data ?? []) as Conversation[];
  }

  async deleteById(id: string): Promise<boolean> {
    const supabase = this.supabaseClient || (await createClient());
    const res = await supabase.from("conversations").delete().eq("id", id);
    return !res.error;
  }

  async verifyOwnership(
    userId: string,
    conversationId: string,
  ): Promise<boolean> {
    const supabase = this.supabaseClient || (await createClient());
    const res = await supabase
      .from("conversations")
      .select("user_id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();
    return !!res.data && !res.error;
  }

  async getById(conversationId: string) {
    const supabase = this.supabaseClient || (await createClient());
    const res = await supabase
      .from("conversations")
      .select(
        "id, user_id, title, created_at, parent_conversation_id, parent_message_id, branch_created_at, branch_label",
      )
      .eq("id", conversationId)
      .single();
    return res.error || !res.data ? null : (res.data as Conversation);
  }

  async createBranch(
    userId: string,
    parentConversationId: string,
    parentMessageId: string,
    title: string,
    branchLabel?: string,
  ): Promise<{ id: string } | null> {
    const supabase = this.supabaseClient || (await createClient());

    // Verify ownership
    const parentOwned = await this.verifyOwnership(userId, parentConversationId);
    if (!parentOwned) {
      console.error("Parent conversation not owned by user");
      return null;
    }

    // Create new conversation
    const res = await supabase
      .from("conversations")
      .insert([
        {
          user_id: userId,
          title,
          parent_conversation_id: parentConversationId,
          parent_message_id: parentMessageId,
          branch_label: branchLabel || null,
        },
      ])
      .select("id")
      .single();

    if (res.error) {
      console.error("Error creating conversation:", res.error);
      return null;
    }
    if (!res.data) {
      console.error("No data returned from conversation creation");
      return null;
    }

    const newConversationId = res.data.id;
    console.log("New conversation created:", newConversationId);

    // Copy messages up to branch point
    console.log("Copying messages:", {
      source_conv_id: parentConversationId,
      target_conv_id: newConversationId,
      until_message_id: parentMessageId,
    });

    const copyRes = await supabase.rpc("copy_messages_until", {
      source_conv_id: parentConversationId,
      target_conv_id: newConversationId,
      until_message_id: parentMessageId,
    });

    if (copyRes.error) {
      console.error("Error copying messages:", copyRes.error);
      console.error("Full error details:", JSON.stringify(copyRes.error));
      await this.deleteById(newConversationId);
      return null;
    }

    console.log("Messages copied successfully");
    return { id: newConversationId };
  }

  async getBranches(conversationId: string): Promise<Conversation[]> {
    const supabase = this.supabaseClient || (await createClient());
    const res = await supabase
      .from("conversations")
      .select(
        "id, user_id, title, created_at, parent_conversation_id, parent_message_id, branch_created_at, branch_label",
      )
      .eq("parent_conversation_id", conversationId)
      .order("branch_created_at", { ascending: true });

    return (res.data ?? []) as Conversation[];
  }

  async getBranchTree(rootConversationId: string): Promise<ConversationTree> {
    const root = await this.getById(rootConversationId);
    if (!root) throw new Error("Conversation not found");

    const buildTree = async (conv: Conversation): Promise<ConversationTree> => {
      const branches = await this.getBranches(conv.id);
      const branchTrees = await Promise.all(branches.map((b) => buildTree(b)));
      return { conversation: conv, branches: branchTrees };
    };

    return buildTree(root);
  }
}
