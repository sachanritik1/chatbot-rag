"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { generateTitle } from "@/lib/llm";
import { ChatService } from "@/domain/chat/ChatService";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";

const createBranchSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
});

export async function createBranch(data: z.infer<typeof createBranchSchema>) {
  let branchId: string | null = null;

  try {
    const parsed = createBranchSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return { error: parsed.error.message };
    }

    const { conversationId, messageId } = parsed.data;

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
  redirect(`/chat/${branchId}`);
}
