import { deleteAfterMessageSchema } from "@chatbot-rag/validators";
import { SupabaseChatsRepository } from "@/utils/repositories";
import { composeAuthValidation } from "@/lib/api/middleware";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: conversationId } = await params;

  const handler = composeAuthValidation(deleteAfterMessageSchema)(async (
    _req,
    data,
    { user, container },
  ) => {
    const { messageId } = data;

    // Verify conversation ownership
    const convService = container.get("ConversationService");
    const owns = await convService.verifyOwnership(user.id, conversationId);

    if (!owns) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Delete messages after the specified message
    const supabase = container.getSupabase();
    const chatsRepo = new SupabaseChatsRepository(supabase);
    const result = await chatsRepo.deleteAfterMessage(
      conversationId,
      messageId,
    );

    if (result.error) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  });

  return handler(req);
}
