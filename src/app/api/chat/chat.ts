import {
  ChatHistory,
  createChat,
  getChatHistoryByConversationId,
} from "@/services/chats";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableMap, RunnableSequence } from "@langchain/core/runnables";
import { getConversationByUserIdAndConversationId } from "@/services/conversations";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@/utils/supabase/server";
import { tryCatch } from "@/utils/try-catch";

export const chat = async (
  userId: string,
  conversationId: string,
  query: string,
  file: File | undefined,
  model: string = "gpt-5-mini",
) => {
  const vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
    client: await createClient(),
    tableName: "documents", // or your vector table
    queryName: "match_documents", // optional RPC name
  });

  const llm = new ChatOpenAI({ model, temperature: 0.2 });

  // check if the conversationId belongs to the user
  const [response, err] = await tryCatch(
    getConversationByUserIdAndConversationId(userId, conversationId),
  );
  const conversation = response;
  if (err || response.error || !conversation) {
    throw err || response.error || new Error("Conversation not found");
  }
  // Fetch chat history for this conversation
  const [res] = await tryCatch(
    getChatHistoryByConversationId(conversationId, 10),
  );

  const chatHistory = res?.data || [];
  console.log("Chat history:", chatHistory);

  console.log("Conversation ID:", conversationId);

  if (file) {
    const loader = new WebPDFLoader(file);
    const pages = await loader.load();
    const enrichedPages = pages.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        conversation_id: conversationId,
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

  const docs = await vectorStore.similaritySearch(query, 4, (rpc) =>
    rpc.filter("metadata->>conversation_id", "eq", conversationId),
  );

  console.log("Docs found:", docs);

  const fileContext = docs.map((doc) => doc.pageContent).join("\n---\n") || "";

  const formatMessages = (messages: ChatHistory[]) => {
    return messages.map((message) => ({
      role: message.sender,
      content: message.message,
    }));
  };

  // 1. Load LLM

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
      AI:`,
  );

  // 3. Create chain
  const chain = RunnableSequence.from([formatInput, prompt, llm]);

  // 4. Call it
  const [result, error] = await tryCatch(
    chain.invoke({
      history: chatHistory,
      question: query,
      fileContext,
    }),
  );

  if (error) {
    console.error("Error invoking chain:", error);
    throw error;
  }

  const assistantMessage = String((result as any).content ?? "");

  // Store user message in chat_history
  await createChat(conversationId, query, "user");
  // Store assistant message in chat_history
  await createChat(conversationId, assistantMessage, "assistant");

  return assistantMessage;
};
