"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";

const createBranchSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  title: z.string().optional(),
});

export async function createBranch(
  data: z.infer<typeof createBranchSchema>,
) {
  const parsed = createBranchSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const { conversationId, messageId, title } = parsed.data;

  const userService = new UserService(new SupabaseUsersRepository());
  const user = await userService.requireCurrentUser().catch(() => null);
  if (!user?.id) {
    redirect("/login");
  }

  const repo = new SupabaseConversationsRepository();
  const original = await repo.getById(conversationId);
  if (!original) {
    return { error: "Conversation not found" };
  }

  const branchTitle = title || `${original.title} (Branch)`;
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
    return { error: "Failed to create branch" };
  }

  revalidatePath("/(authorized)/chat", "layout");
  redirect(`/chat/${result.id}`);
}
