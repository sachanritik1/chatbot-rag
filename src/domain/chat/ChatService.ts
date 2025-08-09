import type {
  LlmClient,
  ChatsRepository,
  ConversationsRepository,
  BuildPromptFn,
} from "@/domain/chat/types";
import { VectorStoreService } from "@/domain/vector/VectorStoreService";
import { IngestionService } from "@/domain/ingestion/IngestionService";

type SendMessageInput = {
  userId: string;
  conversationId: string;
  question: string;
  file?: File | null;
  model?: string | null;
};

export class ChatService {
  constructor(
    private readonly deps: {
      llm: LlmClient;
      vectorService: VectorStoreService;
      chats: ChatsRepository;
      conversations: ConversationsRepository;
      buildPrompt: BuildPromptFn;
      ingestionService: IngestionService;
    },
  ) {}

  async sendMessage(
    input: SendMessageInput,
  ): Promise<ReadableStream<Uint8Array>> {
    const { userId, conversationId, question, file, model } = input;

    // Verify ownership
    const owns = await this.deps.conversations.verifyOwnership(
      userId,
      conversationId,
    );
    if (!owns) {
      throw new Error("Conversation not found");
    }

    // Index file if provided (ignore indexing errors to keep UX smooth)
    if (file) {
      try {
        await this.deps.ingestionService.indexPdfAndAdd(file, conversationId);
      } catch (e) {
        console.error("Error indexing PDF:", e);
      }
    }

    // Retrieve context and history
    const { fileContext } = await this.deps.vectorService.searchConversation(
      question,
      conversationId,
      4,
    );

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
      fileContext,
    });

    const encoder = new TextEncoder();
    let assistantBuffer = "";

    const extractContent = (chunk: unknown): string => {
      const c = (chunk as { content?: unknown }).content;
      if (typeof c === "string") return c;
      if (Array.isArray(c)) {
        const parts = (c as unknown[]).map((part) => {
          if (typeof part === "string") return part;
          const maybeObj = part as { text?: unknown };
          return typeof maybeObj?.text === "string" ? maybeObj.text : "";
        });
        return parts.join("");
      }
      const d = (chunk as { delta?: unknown }).delta;
      return typeof d === "string" ? d : "";
    };

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        (async () => {
          try {
            const asyncIterator = (await this.deps.llm.stream(
              formattedPrompt,
            )) as AsyncIterable<unknown>;
            for await (const chunk of asyncIterator) {
              const content = extractContent(chunk);
              if (content) {
                assistantBuffer += content;
                controller.enqueue(encoder.encode(content));
              }
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
        })();
      },
    });

    return stream;
  }
}
