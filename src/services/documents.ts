import { createClient } from "@/utils/supabase/server";

export const getDocumentsByConversationId = async (conversationId: string) => {
  const supabase = await createClient();
  const response = await supabase
    .from("documents")
    .select("*")
    .eq("conversation_id", conversationId);

  return response;
};
