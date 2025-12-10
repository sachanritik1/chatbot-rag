import type {
  LlmClient,
  ChatsRepository,
  ConversationsRepository,
  BuildPromptFn,
} from "@/domain/chat/types";

type SendMessageInput = {
  userId: string;
  conversationId: string;
  question: string;
  model?: string | null;
};

export class ChatService {
  constructor(
    private readonly deps: {
      llm: LlmClient;
      chats: ChatsRepository;
      conversations: ConversationsRepository;
      buildPrompt: BuildPromptFn;
    },
  ) {}

  async sendMessage(
    input: SendMessageInput,
  ): Promise<ReadableStream<Uint8Array>> {
    const { userId, conversationId, question, model } = input;

    // Verify ownership
    const owns = await this.deps.conversations.verifyOwnership(
      userId,
      conversationId,
    );
    if (!owns) {
      throw new Error("Conversation not found");
    }

    // Retrieve history
    const recent = await this.deps.chats.getRecent(conversationId, 10);
    const history = (recent as { data: unknown } | { data: null })
      .data as Array<{
      sender: "user" | "assistant";
      message: string;
      created_at: string;
    }> | null;
    const safeHistory = Array.isArray(history) ? history : [];

    // Persist user message immediately
    await this.deps.chats.create(
      conversationId,
      question,
      "user",
      model ?? undefined,
    );

    const formattedPrompt = await this.deps.buildPrompt({
      history: safeHistory,
      question,
    });

    const encoder = new TextEncoder();
    let assistantBuffer = "";

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const result = await this.deps.llm.stream(formattedPrompt);

          // Vercel AI SDK provides textStream
          for await (const textPart of result.textStream) {
            assistantBuffer += textPart;
            controller.enqueue(encoder.encode(textPart));
          }

          if (assistantBuffer.trim().length > 0) {
            await this.deps.chats.create(
              conversationId,
              assistantBuffer,
              "assistant",
              model ?? undefined,
            );
          }

          controller.close();
        } catch (err) {
          console.error("Error streaming response:", err);
          controller.error(err);
        }
      },
    });

    return stream;
  }
}
