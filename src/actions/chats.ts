"use server";

import { z } from "zod";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";

const deleteAfterMessageSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
});

export async function deleteMessagesAfter(
  data: z.infer<typeof deleteAfterMessageSchema>,
) {
  try {
    const parsed = deleteAfterMessageSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.message };
    }

    const { conversationId, messageId } = parsed.data;

    // Verify user is authenticated
    const userService = new UserService(new SupabaseUsersRepository());
    const user = await userService.requireCurrentUser().catch(() => null);

    if (!user?.id) {
      return { error: "Unauthorized" };
    }

    // Verify conversation ownership
    const conversationsRepo = new SupabaseConversationsRepository();
    const owns = await conversationsRepo.verifyOwnership(user.id, conversationId);

    if (!owns) {
      return { error: "Conversation not found" };
    }

    // Delete messages after the specified message
    const chatsRepo = new SupabaseChatsRepository();
    const result = await chatsRepo.deleteAfterMessage(conversationId, messageId);

    return result;
  } catch (error) {
    console.error("Error in deleteMessagesAfter:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete messages",
    };
  }
}
