import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tryCatch } from "@/utils/try-catch";
import { getUser } from "@/services/users";
import { getConversationByUserIdAndConversationId } from "@/services/conversations";
import { getChatHistoryByConversationId, createChat } from "@/services/chats";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createClient } from "@/utils/supabase/server";
import { createChatLlm } from "@/lib/llm";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID } from "@/config/models";

const schema = z.object({
  query: z.string().min(1, "Query is required"),
  conversationId: z.string().min(1, "conversationId is required"),
  file: z.instanceof(File).optional(),
  model: z.enum(ALLOWED_MODEL_IDS).optional().default(DEFAULT_MODEL_ID),
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

    // Verify conversation belongs to user
    const [convRes, convErr] = await tryCatch(
      getConversationByUserIdAndConversationId(userId, conversationId),
    );
    if (convErr || convRes.error || !convRes.data) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Prepare vector store and retrieve context
    const supabase = await createClient();

    const vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

    // Optionally index uploaded PDF into this conversation's context
    if (file) {
      try {
        const loader = new WebPDFLoader(file);
        const pages = await loader.load();
        const enrichedPages = pages.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            conversation_id: conversationId,
          },
        }));
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const splitDocs = await splitter.splitDocuments(enrichedPages);
        await vectorStore.addDocuments(splitDocs);
      } catch (e) {
        console.error("Error indexing PDF:", e);
        // continue without file context
      }
    }

    const docs = await vectorStore.similaritySearch(query, 4, (rpc) =>
      rpc.filter("metadata->>conversation_id", "eq", conversationId),
    );
    const fileContext = docs.map((d) => d.pageContent).join("\n---\n") || "";

    // Fetch recent chat history
    const [historyRes] = await tryCatch(
      getChatHistoryByConversationId(conversationId, 10, supabase),
    );
    const chatHistory = historyRes?.data || [];

    // Insert the user message immediately
    await createChat(conversationId, query, "user", supabase);

    // Prepare prompt
    const formatMessages = (
      messages: { sender: "user" | "assistant"; message: string }[],
    ) =>
      messages
        .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.message}`)
        .join("\n");

    const prompt = PromptTemplate.fromTemplate(
      `You are a helpful assistant. Use the following chat history and PDF context (if available) to answer the user’s last question.\nChat history:\n{chat_history}\nUser: {question}\nPDF Context:\n{fileContext}\nAI:`,
    );

    const formattedPrompt = await prompt.format({
      chat_history: formatMessages(chatHistory),
      question: query,
      fileContext,
    });

    // console.log("model", model);

    const llm = createChatLlm({ model });

    const encoder = new TextEncoder();
    let assistantBuffer = "";

    type ChunkWithPossibleFields = {
      content?: unknown;
      delta?: unknown;
    };

    const extractContent = (chunk: unknown): string => {
      const c = (chunk as ChunkWithPossibleFields)?.content;
      if (typeof c === "string") return c;
      if (Array.isArray(c)) {
        const parts = (c as unknown[]).map((part) => {
          if (typeof part === "string") return part;
          const maybeObj = part as { text?: unknown };
          return typeof maybeObj?.text === "string" ? maybeObj.text : "";
        });
        return parts.join("");
      }
      const d = (chunk as ChunkWithPossibleFields)?.delta;
      return typeof d === "string" ? d : "";
    };

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        (async () => {
          try {
            const asyncIterator = (await llm.stream(
              formattedPrompt,
            )) as AsyncIterable<unknown>;
            for await (const chunk of asyncIterator) {
              const content = extractContent(chunk);
              if (content) {
                assistantBuffer += content;
                controller.enqueue(encoder.encode(content));
              }
            }
            // Persist assistant message
            if (assistantBuffer.trim().length > 0) {
              console.log(
                "Creating assistant chat",
                conversationId,
                assistantBuffer,
              );
              await createChat(
                conversationId,
                assistantBuffer,
                "assistant",
                supabase,
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
