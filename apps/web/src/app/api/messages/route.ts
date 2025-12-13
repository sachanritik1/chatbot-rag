import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { UserService } from "@/domain/users/UserService";
import { createAPIUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { ConversationService } from "@/domain/conversations/ConversationService";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { createAPIClient } from "@/utils/supabase/api";

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

  // Use API-aware repository that supports both cookies and Bearer tokens
  const supabaseClient = await createAPIClient(req);
  const usersRepo = await createAPIUsersRepository(req);
  const userService = new UserService(usersRepo);
  let userId: string;
  try {
    const { id } = await userService.requireCurrentUser();
    userId = id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convService = new ConversationService(
    new SupabaseConversationsRepository(supabaseClient),
    new SupabaseChatsRepository(supabaseClient),
  );
  const owns = await convService.verifyOwnership(userId, conversationId);
  if (!owns) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chatsRepo = new SupabaseChatsRepository(supabaseClient);
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
