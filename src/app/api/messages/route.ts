import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tryCatch } from "@/utils/try-catch";
import { getUser } from "@/services/users";
import { getConversationByUserIdAndConversationId } from "@/services/conversations";
import { getOlderChatHistoryByConversationId } from "@/services/chats";
import { createClient } from "@/utils/supabase/server";

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

  const [user, userError] = await tryCatch(getUser());
  if (userError) {
    return NextResponse.json({ error: "Auth error" }, { status: 401 });
  }
  const userId = user.data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [convRes, convErr] = await tryCatch(
    getConversationByUserIdAndConversationId(userId, conversationId),
  );
  if (convErr || convRes.error || !convRes.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();

  // total count for pagination
  const totalHead = await supabase
    .from("chats")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);
  const totalCount = totalHead.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // If no cursor provided, return newest page as page 1
  if (!beforeId) {
    const newest = await supabase
      .from("chats")
      .select("id, sender, message, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);
    if (newest.error) {
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }
    const data = (newest.data || []).slice().reverse();
    return NextResponse.json({
      data,
      pagination: { totalCount, totalPages, page: 1, limit },
    });
  }

  // With cursor id: compute next page number by ranking the cursor in desc order
  const cursorRow = await supabase
    .from("chats")
    .select("id, created_at")
    .eq("conversation_id", conversationId)
    .eq("id", beforeId)
    .single();
  if (cursorRow.error || !cursorRow.data) {
    return NextResponse.json({ error: "Cursor not found" }, { status: 400 });
  }
  const createdAt = cursorRow.data.created_at as string;
  const rankHead = await supabase
    .from("chats")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .or(
      `created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gte.${beforeId})`,
    );
  const index = (rankHead.count ?? 1) - 1; // zero-based index of cursor
  const nextPage = Math.min(totalPages, Math.floor((index + 1) / limit) + 1);

  const [older, olderErr] = await tryCatch(
    getOlderChatHistoryByConversationId(
      conversationId,
      beforeId,
      limit,
      supabase,
    ),
  );
  if (olderErr || older.error) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  return NextResponse.json({
    data: older.data || [],
    pagination: { totalCount, totalPages, page: nextPage, limit },
  });
}
