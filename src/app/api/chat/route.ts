import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID } from "@/config/models";
import { buildChatService } from "@/domain/chat/buildService";

const schema = z.object({
  query: z.string().min(1, "Query is required"),
  conversationId: z.string().min(1, "conversationId is required"),
  file: z.instanceof(File).optional(),
  model: z.enum(ALLOWED_MODEL_IDS).optional().default(DEFAULT_MODEL_ID),
});

export async function POST(req: NextRequest) {
  try {
    const userService = new UserService(new SupabaseUsersRepository());
    const { id: userId } = await userService.requireCurrentUser();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const data = {
      query: formData.get("query"),
      conversationId: formData.get("conversationId") ?? undefined,
      file: formData.get("file") ?? undefined,
      model: formData.get("model") ?? undefined,
    } as Record<string, unknown>;

    const parseResult = schema.safeParse(data);

    if (!parseResult.success) {
      console.log("Validation error:", parseResult.error);

      return NextResponse.json(
        { error: parseResult.error.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { query, conversationId, file, model } = parseResult.data;

    const service = buildChatService(model);

    const stream = await service.sendMessage({
      userId,
      conversationId,
      question: query,
      file,
      model,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
      status: 200,
    });
  } catch (error) {
    console.log("Error in chat API:", error);
    return NextResponse.json(
      { error: "Something went wrong", success: false },
      { status: 500 },
    );
  }
}
