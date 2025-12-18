import { revalidatePath } from "next/cache";
import {
  createEmptyConversationSchema,
  deleteConversationSchema,
  updateConversationTitleSchema,
} from "@chatbot-rag/validators";
import { generateTitle } from "@/lib/llm";
import { composeAuthValidation } from "@/lib/api/middleware";

export const POST = composeAuthValidation(createEmptyConversationSchema)(async (
  _req,
  data,
  { user, container },
) => {
  const { title } = data;
  const conversationService = container.get("ConversationService");

  const conversationId = await conversationService.create(user.id, title);
  revalidatePath("/(authorized)/chat", "layout");

  return Response.json({ conversationId }, { status: 201 });
});

export const DELETE = composeAuthValidation(deleteConversationSchema)(async (
  _req,
  data,
  { user, container },
) => {
  const { conversationId } = data;
  const conversationService = container.get("ConversationService");

  const ok = await conversationService.deleteForUser(user.id, conversationId);

  if (!ok) {
    return Response.json(
      { error: "Error deleting conversation" },
      { status: 500 },
    );
  }

  revalidatePath("/(authorized)/chat", "layout");
  return Response.json({ success: true }, { status: 200 });
});

export const PATCH = composeAuthValidation(updateConversationTitleSchema)(
  async (_req, data, { user, container }) => {
    const { conversationId, query } = data;
    const conversationService = container.get("ConversationService");

    const newTitle = await generateTitle(query);
    await conversationService.updateTitle(user.id, conversationId, newTitle);
    revalidatePath("/(authorized)/chat", "layout");

    return Response.json({ success: true, title: newTitle }, { status: 200 });
  },
);
