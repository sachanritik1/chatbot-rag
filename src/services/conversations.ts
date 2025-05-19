import { createClient } from "@/utils/supabase/server";

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
};

export const createConversation = async (userId: string) => {
  const supabase = await createClient();
  const response = await supabase
    .from("conversations")
    .insert([{ user_id: userId, title: "New Conversation" }])
    .select()
    .single();
  return response;
};

export const getConversationsByUserIdAndConversationId = async (
  userId: string,
  conversationId: string
) => {
  const supabase = await createClient();
  const response = await supabase
    .from("conversations")
    .select("user_id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();
  return response;
};

export const getAllConversationsByUserId = async (userId: string) => {
  const supabase = await createClient();
  const response = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return response;
};
