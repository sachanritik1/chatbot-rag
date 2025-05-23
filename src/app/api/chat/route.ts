import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tryCatch } from "@/utils/try-catch";
import { chat } from "./chat";
import { getUser } from "@/services/users";

const schema = z.object({
  query: z.string().min(1, "Query is required"),
  conversationId: z.string(),
  file: z.instanceof(File).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const [user, userError] = await tryCatch(getUser());
    if (userError) {
      console.log("User error:", userError);
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 },
      );
    }
    const userId = user.data.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "No user_id provided" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const data = {
      query: formData.get("query"),
      conversationId: formData.get("conversationId") ?? undefined,
      file: formData.get("file") ?? undefined,
    };

    const parseResult = schema.safeParse(data);

    if (!parseResult.success) {
      console.log("Validation error:", parseResult.error);

      return NextResponse.json(
        { error: parseResult.error.message || "Invalid input" },
        { status: 400 },
      );
    }

    console.log("Parsed data:", parseResult.data);

    const { query, conversationId, file } = parseResult.data;

    const [assistantMessage, err] = await tryCatch(
      chat(userId, conversationId, query, file),
    );

    if (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({
      data: { assistantMessage },
      success: true,
    });
  } catch (error) {
    console.log("Error in chat API:", error);
    return NextResponse.json(
      { error: "Something went wrong", success: false },
      { status: 500 },
    );
  }
}
