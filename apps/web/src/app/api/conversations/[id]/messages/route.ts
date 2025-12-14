import { z } from "zod";
import { UserService } from "@/domain/users/UserService";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { createAPIUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { createAPIClient } from "@/utils/supabase/api";
import { ConversationService } from "@/domain/conversations/ConversationService";

const deleteAfterMessageSchema = z.object({
  messageId: z.string().uuid(),
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: conversationId } = await params;
    const body = (await req.json()) as unknown;
    const parsedData = deleteAfterMessageSchema.safeParse(body);

    if (!parsedData.success) {
      return Response.json(
        { error: parsedData.error.message },
        { status: 400 },
      );
    }

    const { messageId } = parsedData.data;

    // Create API client with auth context
    const supabaseClient = await createAPIClient(req);

    // Verify user is authenticated
    const usersRepo = await createAPIUsersRepository(req);
    const userService = new UserService(usersRepo);
    const user = await userService.requireCurrentUser().catch(() => null);

    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify conversation ownership
    const convService = new ConversationService(
      new SupabaseConversationsRepository(supabaseClient),
      new SupabaseChatsRepository(supabaseClient),
    );
    const owns = await convService.verifyOwnership(user.id, conversationId);

    if (!owns) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Delete messages after the specified message
    const chatsRepo = new SupabaseChatsRepository(supabaseClient);
    const result = await chatsRepo.deleteAfterMessage(
      conversationId,
      messageId,
    );

    if (result.error) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in deleteMessagesAfter:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete messages",
      },
      { status: 500 },
    );
  }
}
