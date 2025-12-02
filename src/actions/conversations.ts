"use server";

import { chat } from "@/app/api/chat/chat";
import { ConversationService } from "@/domain/conversations/ConversationService";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { tryCatch } from "@/utils/try-catch";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID } from "@/config/models";
import { createChatLlm, generateTitle } from "@/lib/llm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createConversationSchema = z.object({
  query: z.string().min(1, "Query is required"),
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
  const { query, model } = parsedData.data;

  const userService = new UserService(new SupabaseUsersRepository());
  const current = await userService.requireCurrentUser().catch(() => null);
  const userId = current?.id;
  if (!userId) {
    redirect("/login");
  }

  const llm = createChatLlm({ model });

  const conversationService = new ConversationService(
    new SupabaseConversationsRepository(),
    new SupabaseChatsRepository(),
  );
  let conversationId: string;
  try {
    const conversationTitle = await generateTitle(query);
    conversationId = await conversationService.create(
      userId,
      conversationTitle,
    );
  } catch {
    return "Error creating conversation";
  }

  const [assistantMessage, error] = await tryCatch(
    chat(userId, conversationId, query, model),
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
  const userService = new UserService(new SupabaseUsersRepository());
  const current = await userService.requireCurrentUser().catch(() => null);
  const userId = current?.id;
  if (!userId) {
    redirect("/login");
  }

  const { conversationId } = parsedData.data;
  const conversationService = new ConversationService(
    new SupabaseConversationsRepository(),
    new SupabaseChatsRepository(),
  );
  try {
    const ok = await conversationService.deleteForUser(userId, conversationId);
    if (!ok) return "Error deleting conversation";
  } catch {
    return "Error deleting conversation";
  }

  revalidatePath("/(authorized)/chat", "layout");
}
