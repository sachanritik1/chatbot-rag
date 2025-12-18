import { generateTitle } from "@/lib/llm";
import { NextResponse } from "next/server";
import { UserService } from "@chatbot-rag/domain/users";
import { createAPIUsersRepository } from "@/utils/repositories";

export async function POST(request: Request) {
  try {
    // Verify authentication
    const usersRepo = await createAPIUsersRepository(request);
    const userService = new UserService(usersRepo);

    try {
      await userService.requireCurrentUser();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const title = await generateTitle(query);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 },
    );
  }
}
