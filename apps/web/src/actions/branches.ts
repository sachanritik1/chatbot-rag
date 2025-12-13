"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { generateTitle } from "@/lib/llm";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import type { ChatHistory } from "@/domain/chat/models";
import { DEFAULT_MODEL_ID } from "@/config/models";

const createBranchSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  selectedModel: z.string().optional(),
});

export async function createBranch(data: z.infer<typeof createBranchSchema>) {
  let branchId: string | null = null;
  let isUserMessage = false;
  let branchMessage: ChatHistory | null = null;
  let conversationId = "";
  let selectedModel: string | undefined;

  try {
    const parsed = createBranchSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return { error: parsed.error.message };
    }

    conversationId = parsed.data.conversationId;
    const { messageId } = parsed.data;
    selectedModel = parsed.data.selectedModel;

    const userService = new UserService(new SupabaseUsersRepository());
    const chatsRepository = new SupabaseChatsRepository();
    const user = await userService.requireCurrentUser().catch((err) => {
      console.error("User auth error:", err);
      return null;
    });

    if (!user?.id) {
      // ✅ DO NOT CATCH redirects
      redirect("/login");
    }

    // Check if the message we're branching from is a user message
    branchMessage = await chatsRepository.getById(messageId);
    isUserMessage = branchMessage?.sender === "user";

    const repo = new SupabaseConversationsRepository();
    const original = await repo.getById(conversationId);

    if (!original) {
      console.error("Original conversation not found:", conversationId);
      return { error: "Conversation not found" };
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

    console.log("Creating branch:", {
      userId: user.id,
      conversationId,
      messageId,
      branchTitle,
      branchLabel,
    });

    const result = await repo.createBranch(
      user.id,
      conversationId,
      messageId,
      branchTitle,
      branchLabel,
    );

    if (!result) {
      console.error("Branch creation returned null");
      return { error: "Failed to create branch" };
    }

    console.log("Branch created successfully:", result.id);

    branchId = result.id;

    revalidatePath("/(authorized)/chat", "layout");
  } catch (error) {
    console.error("Error in createBranch:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to create branch",
    };
  }

  // ✅ MUST BE OUTSIDE TRY/CATCH
  // If branching from a user message, we need to regenerate the response
  if (isUserMessage && branchMessage) {
    // Use the selected model, or fall back to the original conversation's model
    let modelToUse = selectedModel;
    if (!modelToUse) {
      const chatsRepository = new SupabaseChatsRepository();
      const recentChats = await chatsRepository.getRecent(conversationId, 10);
      const lastBotMessage = recentChats.data.find(
        (c) => c.sender === "assistant",
      );
      modelToUse = lastBotMessage?.model ?? DEFAULT_MODEL_ID;
    }

    // Redirect with regenerate flag and selected model
    redirect(
      `/chat/${branchId}?regenerate=true&model=${encodeURIComponent(modelToUse)}`,
    );
  }

  redirect(`/chat/${branchId}`);
}
