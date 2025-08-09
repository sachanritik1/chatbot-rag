import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { ConversationService } from "@/domain/conversations/ConversationService";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";

const schema = z.object({
  conversationId: z.string().min(1),
  beforeId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parse = schema.safeParse({
    conversationId: url.searchParams.get("conversationId"),
    beforeId: url.searchParams.get("beforeId") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });

  if (!parse.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  const { conversationId, beforeId, limit } = parse.data;

  const userService = new UserService(new SupabaseUsersRepository());
  let userId: string;
  try {
    const { id } = await userService.requireCurrentUser();
    userId = id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convService = new ConversationService(
    new SupabaseConversationsRepository(),
    new SupabaseChatsRepository(),
  );
  const owns = await convService.verifyOwnership(userId, conversationId);
  if (!owns) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chatsRepo = new SupabaseChatsRepository();
  const { data, nextPage, totalPages, totalCount } = await chatsRepo.getOlder(
    conversationId,
    beforeId!,
    limit,
  );
  return NextResponse.json({
    data,
    pagination: { totalCount, totalPages, page: nextPage, limit },
  });
}
