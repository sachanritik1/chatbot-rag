import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ChatHistory,
  createChat,
  getChatHistoryByConversationId,
} from "@/services/chats";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableMap, RunnableSequence } from "@langchain/core/runnables";
import {
  createConversation,
  getConversationsByUserIdAndConversationId,
} from "@/services/conversations";
import { getUser } from "@/services/users";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@/utils/supabase/server";

const schema = z.object({
  query: z.string().min(1, "Query is required"),
  conversationId: z.string().optional(),
  file: z.instanceof(File).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "No user_id provided" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    console.log("Parsed data:", parseResult.data);

    const { query } = parseResult.data;
    let conversationId = parseResult.data.conversationId;
    let chatHistory = [] as ChatHistory[];
    const file = parseResult.data.file;
    const vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
      client: await createClient(),
      tableName: "documents", // or your vector table
      queryName: "match_documents", // optional RPC name
    });

    if (!conversationId) {
      // Create a new conversation if no conversationId is provided
      const { data, error } = await createConversation(userId);
      conversationId = data?.id;
      if (!conversationId || error) {
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }
    } else {
      //check if the conversationId belongs to the user
      const { data: conversation, error } =
        await getConversationsByUserIdAndConversationId(userId, conversationId);
      if (error || !conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      // Fetch chat history for this conversation
      const { data } = await getChatHistoryByConversationId(conversationId, 10);
      chatHistory = data || [];
      console.log("Chat history:", chatHistory);
    }

    console.log("Conversation ID:", conversationId);

    if (file) {
      const loader = new WebPDFLoader(file);
      const pages = await loader.load();
      const enrichedPages = pages.map((doc, idx) => ({
        pageContent: doc.pageContent,
        metadata: {
          page_number: idx + 1,
          conversation_id: conversationId,
          file_name: file.name,
        },
      }));

      // Now split using LangChain splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.splitDocuments(enrichedPages);
      await vectorStore.addDocuments(splitDocs);
    }

    const docs = await vectorStore.similaritySearch(query, 5, {
      conversation_id: conversationId,
    });

    console.log("Docs found:", docs);

    const fileContext =
      docs.map((doc) => doc.pageContent).join("\n---\n") || "";

    const formatMessages = (messages: ChatHistory[]) => {
      return messages.map((message) => ({
        role: message.sender,
        content: message.message,
      }));
    };

    // 1. Load LLM
    const llm = new ChatOpenAI({ temperature: 0.2 });

    type ChatInput = {
      history: ChatHistory[];
      question: string;
      fileContext: string;
    };

    // 2. Format input
    const formatInput = RunnableMap.from({
      chat_history: (input: ChatInput) => formatMessages(input.history),
      question: (input: ChatInput) => input.question,
      fileContext: (input: ChatInput) => input.fileContext,
    });

    const prompt = PromptTemplate.fromTemplate(
      `You are a helpful assistant. Use the following chat history and PDF context (if available) to answer the user’s last question.
      Chat history: {chat_history}
      User: {question}
      PDF Context: {fileContext}
      AI:`
    );

    // 3. Create chain
    const chain = RunnableSequence.from([formatInput, prompt, llm]);

    // 4. Call it
    const result = await chain.invoke({
      history: chatHistory,
      question: query,
      fileContext,
    });

    const assistantMessage = result.text;

    // Store user message in chat_history
    await createChat(conversationId, query, "user");

    // Store assistant message in chat_history
    await createChat(conversationId, assistantMessage, "assistant");

    return NextResponse.json({
      data: assistantMessage,
      status: "success",
      conversationId,
    });
  } catch (error) {
    console.log("Error in chat API:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
