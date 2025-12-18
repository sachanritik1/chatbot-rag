import { revalidatePath } from "next/cache";
import { createBranchSchema } from "@chatbot-rag/validators";
import { SupabaseConversationsRepository } from "@/utils/repositories";
import { generateTitle } from "@/lib/llm";
import { SupabaseChatsRepository } from "@/utils/repositories";
import type { ChatHistory } from "@chatbot-rag/domain/chat";
import { DEFAULT_MODEL_ID } from "@/config/models";
import { composeAuthValidation } from "@/lib/api/middleware";

export const POST = composeAuthValidation(createBranchSchema)(async (
  _req,
  data,
  { user, container },
) => {
  const { conversationId, messageId, selectedModel } = data;
  const supabase = container.getSupabase();

  const chatsRepository = new SupabaseChatsRepository(supabase);

  // Check if the message we're branching from is a user message
  const branchMessage: ChatHistory | null =
    await chatsRepository.getById(messageId);
  const isUserMessage = branchMessage?.sender === "user";

  const repo = new SupabaseConversationsRepository(supabase);
  const original = await repo.getById(conversationId);

  if (!original) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  let branchTitle = original.title.trim();

  if (!branchTitle) {
    // generate a new title if original has none
    const chats = await chatsRepository.getRecent(conversationId, 4);
    branchTitle = await generateTitle(
      chats.data.map((c) => c.sender + ":" + c.message).join(" \n "),
    );
  }

  const existingBranches = await repo.getBranches(conversationId);
  const branchLabel = `Branch ${existingBranches.length + 1}`;

  const result = await repo.createBranch(
    user.id,
    conversationId,
    messageId,
    branchTitle,
    branchLabel,
  );

  if (!result) {
    return Response.json({ error: "Failed to create branch" }, { status: 500 });
  }

  revalidatePath("/(authorized)/chat", "layout");

  // Determine model to use
  let modelToUse = selectedModel;
  if (!modelToUse) {
    const recentChats = await chatsRepository.getRecent(conversationId, 10);
    const lastBotMessage = recentChats.data.find(
      (c) => c.sender === "assistant",
    );
    modelToUse = lastBotMessage?.model ?? DEFAULT_MODEL_ID;
  }

  return Response.json(
    {
      branchId: result.id,
      isUserMessage,
      modelToUse,
      branchMessage: branchMessage?.message,
    },
    { status: 201 },
  );
});
