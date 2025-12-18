import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPaginatedMessagesSchema } from "@chatbot-rag/validators";
import { SupabaseChatsRepository } from "@/utils/repositories";
import { composeAuth } from "@/lib/api/middleware";

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = {
    conversationId: url.searchParams.get("conversationId") ?? "",
    beforeId: url.searchParams.get("beforeId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };

  const parse = getPaginatedMessagesSchema.safeParse(queryParams);

  if (!parse.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const { conversationId, beforeId, limit } = parse.data;

  const handler = composeAuth(async (_req, { user, container }) => {
    const convService = container.get("ConversationService");
    const owns = await convService.verifyOwnership(user.id, conversationId);
    if (!owns) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!beforeId) {
      return NextResponse.json({ data: [], pagination: null });
    }

    const supabase = container.getSupabase();
    const chatsRepo = new SupabaseChatsRepository(supabase);
    const { data, nextPage, totalPages, totalCount } = await chatsRepo.getOlder(
      conversationId,
      beforeId,
      limit,
    );
    return NextResponse.json({
      data,
      pagination: { totalCount, totalPages, page: nextPage, limit },
    });
  });

  return handler(req);
}
