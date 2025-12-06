import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import {
  ALLOWED_MODEL_IDS,
  DEFAULT_MODEL_ID,
  getModelConfig,
} from "@/config/models";
import { buildChatPrompt } from "@/lib/prompts";

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
  try {
    const userService = new UserService(new SupabaseUsersRepository());
    const { id: userId } = await userService.requireCurrentUser();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      console.log("Validation error:", parseResult.error);
      return Response.json(
        { error: parseResult.error.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { messages, conversationId, model } = parseResult.data;

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
      const conversationsRepo = new SupabaseConversationsRepository();
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
    const chatsRepo = new SupabaseChatsRepository();
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

    // Build prompt with history
    const formattedPrompt = await buildChatPrompt({
      history,
      question: messageText,
    });

    // Get model config
    const modelConfig = getModelConfig(model);

    // Stream with AI SDK
    const result = streamText({
      model: openai(modelConfig.modelName),
      prompt: formattedPrompt,
      temperature: modelConfig.supports.temperature
        ? modelConfig.defaultParams?.temperature
        : undefined,
      async onFinish({ text }) {
        // Save assistant response to DB
        if (conversationId && text.trim().length > 0) {
          await chatsRepo.create(conversationId, text, "assistant", model);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.log("Error in chat API:", error);
    return Response.json(
      { error: "Something went wrong", success: false },
      { status: 500 },
    );
  }
}
