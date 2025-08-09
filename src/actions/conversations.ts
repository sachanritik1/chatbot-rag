"use server";

import { chat } from "@/app/api/chat/chat";
import {
  createConversation,
  deleteConversationById,
} from "@/services/conversations";
import { getUser } from "@/services/users";
import { tryCatch } from "@/utils/try-catch";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID } from "@/config/models";
import { createChatLlm } from "@/lib/llm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createConversationSchema = z.object({
  query: z.string().min(1, "Query is required"),
  file: z.instanceof(File).optional(),
  model: z.enum(ALLOWED_MODEL_IDS).optional().default(DEFAULT_MODEL_ID),
});

type createConversationSchemaType = z.infer<typeof createConversationSchema>;

export async function createNewConversation(
  props: createConversationSchemaType,
) {
  const parsedData = createConversationSchema.safeParse(props);
  if (!parsedData.success) {
    console.log("Validation error:", parsedData.error);
    return parsedData.error.message;
  }
  const { query, file, model } = parsedData.data;

  const [user, userError] = await tryCatch(getUser());
  const userId = user?.data.user?.id;
  if (!userId || userError) {
    redirect("/login");
  }

  const llm = createChatLlm({ model });

  const conversationTitlePrompt = `
          Generate a title for a new conversation based on the following question in 4 to 5 words only: "${query}"
        `;
  const { text } = await llm.invoke(conversationTitlePrompt);
  const [response, err] = await tryCatch(createConversation(userId, text));
  const conversationId = response?.data.id;
  if (err || response.error || !conversationId) {
    return "Error creating conversation";
  }

  const [assistantMessage, error] = await tryCatch(
    chat(userId, conversationId, query, file, model),
  );

  if (error || !assistantMessage) {
    return error?.message || "Error creating conversation";
  }

  revalidatePath("/(authorized)/chat", "layout");
  redirect(`/chat/${conversationId}`);
}

const deleteConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});
type deleteConversationSchemaType = z.infer<typeof deleteConversationSchema>;

export async function deleteConversation(props: deleteConversationSchemaType) {
  const parsedData = deleteConversationSchema.safeParse(props);
  if (!parsedData.success) {
    return parsedData.error.message;
  }
  const [user, userError] = await tryCatch(getUser());
  const userId = user?.data.user?.id;
  if (!userId || userError) {
    redirect("/login");
  }

  const { conversationId } = parsedData.data;
  const [response, error] = await tryCatch(
    deleteConversationById(conversationId),
  );

  if (error || response.error || !response.data) {
    return "Error deleting conversation";
  }

  revalidatePath("/(authorized)/chat", "layout");
}
