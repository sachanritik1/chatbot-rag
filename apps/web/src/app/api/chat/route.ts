import { streamText } from "ai";
import { z } from "zod";

import { UserService } from "@/domain/users/UserService";
import { createAPIUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID } from "@/config/models";
import { buildChatPrompt } from "@/lib/prompts";
import { createAPIClient } from "@/utils/supabase/api";
import { createModelInstance } from "@/lib/llm";
import { updateConversationTitle } from "@/actions/conversations";

const schema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant", "system"]),
      parts: z.array(
        z.object({
          type: z.string(),
          text: z.string().optional(),
        }),
      ),
    }),
  ),
  conversationId: z.string().optional(),
  model: z.enum(ALLOWED_MODEL_IDS).optional().default(DEFAULT_MODEL_ID),
});

export async function POST(req: Request) {
  console.log("=== Chat API called ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Has Authorization header:", !!req.headers.get("authorization"));

  try {
    // Use API-aware repository that supports both cookies and Bearer tokens
    const supabaseClient = await createAPIClient(req);
    const usersRepo = await createAPIUsersRepository(req);
    const userService = new UserService(usersRepo);
    const { id: userId } = await userService.requireCurrentUser();
    console.log("User authenticated:", userId);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as unknown;
    console.log(
      "Request body received:",
      JSON.stringify(body).substring(0, 200),
    );

    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      console.log("Validation error:", parseResult.error);
      return Response.json(
        { error: parseResult.error.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { messages, conversationId, model } = parseResult.data;
    console.log(
      "Parsed successfully. Model:",
      model,
      "ConversationId:",
      conversationId,
    );

    // Get the last user message and extract text from parts
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) {
      return Response.json({ error: "No user message found" }, { status: 400 });
    }

    // Extract text content from parts array
    const textPart = lastUserMessage.parts.find((p) => p.type === "text");
    const messageText = textPart?.text ?? "";

    if (!messageText) {
      return Response.json({ error: "No message text found" }, { status: 400 });
    }

    // Create conversation server-side if not provided, or verify ownership if provided
    let actualConversationId = conversationId;
    let wasCreated = false;

    if (!actualConversationId) {
      // No conversationId provided - create new conversation server-side
      const conversationsRepo = new SupabaseConversationsRepository(
        supabaseClient,
      );

      // Create with initial title from message (will be updated later)
      const newConv = await conversationsRepo.create(
        userId,
        messageText.slice(0, 50),
      );

      if (!newConv?.id) {
        return Response.json(
          { error: "Failed to create conversation" },
          { status: 500 },
        );
      }

      actualConversationId = newConv.id;
      wasCreated = true;
    } else {
      // Existing conversation - verify ownership
      const conversationsRepo = new SupabaseConversationsRepository(
        supabaseClient,
      );
      const owns = await conversationsRepo.verifyOwnership(
        userId,
        actualConversationId,
      );
      if (!owns) {
        return Response.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }
    }

    // Get conversation history from DB
    const chatsRepo = new SupabaseChatsRepository(supabaseClient);
    let history: {
      sender: "user" | "assistant";
      message: string;
      created_at: string;
    }[] = [];

    if (actualConversationId) {
      const recent = await chatsRepo.getRecent(actualConversationId, 10);
      history = Array.isArray(recent.data) ? recent.data : [];
    }

    // Check if this is the first message in the conversation
    const isFirstMessage = history.length === 0;

    // Save user message to DB
    if (actualConversationId) {
      await chatsRepo.create(actualConversationId, messageText, "user", model);
    }

    console.log("Building prompt...");
    // Build prompt with history
    const formattedPrompt = buildChatPrompt({
      history,
      question: messageText,
    });
    console.log("Prompt built, getting model config...");

    // Get model config
    const { modelInstance, cfg: modelConfig } = createModelInstance(model);

    // Stream with AI SDK
    console.log("Starting streamText...");
    const result = streamText({
      model: modelInstance,
      prompt: formattedPrompt,
      temperature: modelConfig.supports.temperature
        ? modelConfig.defaultParams?.temperature
        : undefined,
      async onFinish({ text }) {
        console.log("Stream finished, saving to DB...");
        // Save assistant response to DB
        if (actualConversationId && text.trim().length > 0) {
          await chatsRepo.create(
            actualConversationId,
            text,
            "assistant",
            model,
          );

          // If this was the first message, update title if needed
          if (isFirstMessage) {
            const conversationsRepo = new SupabaseConversationsRepository(
              supabaseClient,
            );
            const conv = await conversationsRepo.getById(actualConversationId);

            // Generate better title from the user's first message
            if (conv?.title === "Untitled") {
              updateConversationTitle({
                conversationId: actualConversationId,
                query: messageText,
              }).catch((err) =>
                console.error("Failed to update conversation title:", err),
              );
            }
          }
        }
      },
    });
    console.log("streamText created, converting to response...");

    const response = result.toUIMessageStreamResponse();

    // If we created a new conversation, include ID in response header
    if (wasCreated && actualConversationId) {
      const headers = new Headers(response.headers);
      headers.set("X-Conversation-Id", actualConversationId);

      console.log(
        "Returning streaming response with conversation ID:",
        actualConversationId,
      );
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    }

    console.log("Returning streaming response, status:", response.status);

    return response;
  } catch (error) {
    console.error("=== ERROR in chat API ===");
    console.error(
      "Error type:",
      error instanceof Error ? error.name : typeof error,
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return Response.json(
      { error: "Something went wrong", success: false },
      { status: 500 },
    );
  }
}
