import { z } from "zod";
import { revalidatePath } from "next/cache";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { UserService } from "@/domain/users/UserService";
import { createAPIUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { generateTitle } from "@/lib/llm";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import type { ChatHistory } from "@/domain/chat/models";
import { DEFAULT_MODEL_ID } from "@/config/models";
import { createAPIClient } from "@/utils/supabase/api";

const createBranchSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  selectedModel: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = createBranchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.message }, { status: 400 });
    }

    const { conversationId, messageId, selectedModel } = parsed.data;

    // Create API client with auth context
    const supabaseClient = await createAPIClient(req);

    const usersRepo = await createAPIUsersRepository(req);
    const userService = new UserService(usersRepo);
    const user = await userService.requireCurrentUser().catch(() => null);

    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatsRepository = new SupabaseChatsRepository(supabaseClient);

    // Check if the message we're branching from is a user message
    const branchMessage: ChatHistory | null =
      await chatsRepository.getById(messageId);
    const isUserMessage = branchMessage?.sender === "user";

    const repo = new SupabaseConversationsRepository(supabaseClient);
    const original = await repo.getById(conversationId);

    if (!original) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
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
  } catch (error) {
    console.error("Error in createBranch:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create branch",
      },
      { status: 500 },
    );
  }
}
