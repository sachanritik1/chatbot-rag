import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { UserService } from "@/domain/users/UserService";
import { createAPIUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import {
  ALLOWED_MODEL_IDS,
  DEFAULT_MODEL_ID,
  getModelConfig,
} from "@/config/models";
import { buildChatPrompt } from "@/lib/prompts";
import { createAPIClient } from "@/utils/supabase/api";

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
  model: z
    .enum(ALLOWED_MODEL_IDS)
    .or(z.literal(""))
    .transform((val) => (val === "" ? DEFAULT_MODEL_ID : val))
    .pipe(z.enum(ALLOWED_MODEL_IDS)),
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

    const body = await req.json();
    console.log("Request body received:", JSON.stringify(body).substring(0, 200));

    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      console.log("Validation error:", parseResult.error);
      return Response.json(
        { error: parseResult.error.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { messages, conversationId, model } = parseResult.data;
    console.log("Parsed successfully. Model:", model, "ConversationId:", conversationId);

    // Get the last user message and extract text from parts
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) {
      return Response.json({ error: "No user message found" }, { status: 400 });
    }

    // Extract text content from parts array
    const textPart = lastUserMessage.parts.find((p) => p.type === "text");
    const messageText = textPart?.text || "";

    if (!messageText) {
      return Response.json({ error: "No message text found" }, { status: 400 });
    }

    // Verify conversation ownership
    if (conversationId) {
      const conversationsRepo = new SupabaseConversationsRepository(supabaseClient);
      const owns = await conversationsRepo.verifyOwnership(
        userId,
        conversationId,
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
    let history: Array<{
      sender: "user" | "assistant";
      message: string;
      created_at: string;
    }> = [];

    if (conversationId) {
      const recent = await chatsRepo.getRecent(conversationId, 10);
      history = Array.isArray(recent.data) ? recent.data : [];
    }

    // Save user message to DB
    if (conversationId) {
      await chatsRepo.create(conversationId, messageText, "user", model);
    }

    console.log("Building prompt...");
    // Build prompt with history
    const formattedPrompt = await buildChatPrompt({
      history,
      question: messageText,
    });
    console.log("Prompt built, getting model config...");

    // Get model config
    const modelConfig = getModelConfig(model);
    console.log("Model config:", modelConfig.modelName);

    // Stream with AI SDK
    console.log("Starting streamText...");
    const result = streamText({
      model: openai(modelConfig.modelName),
      prompt: formattedPrompt,
      temperature: modelConfig.supports.temperature
        ? modelConfig.defaultParams?.temperature
        : undefined,
      async onFinish({ text }) {
        console.log("Stream finished, saving to DB...");
        // Save assistant response to DB
        if (conversationId && text.trim().length > 0) {
          await chatsRepo.create(conversationId, text, "assistant", model);
        }
      },
    });
    console.log("streamText created, converting to response...");

    const response = result.toUIMessageStreamResponse();
    console.log("Returning streaming response, status:", response.status);
    return response;
  } catch (error) {
    console.error("=== ERROR in chat API ===");
    console.error("Error type:", error instanceof Error ? error.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return Response.json(
      { error: "Something went wrong", success: false },
      { status: 500 },
    );
  }
}
