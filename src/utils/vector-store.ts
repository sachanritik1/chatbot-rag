import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { createClient } from "./supabase/server";

export const createEmbeddings = () => {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};

export const createVectorStore = async (embeddings: OpenAIEmbeddings) => {
  return new SupabaseVectorStore(embeddings, {
    client: await createClient(),
    tableName: "documents",
  });
};

export const getExistingVectorStore = async () => {
  const embeddings = createEmbeddings();
  return SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: await createClient(),
    tableName: "documents",
  });
};

export const addDocumentsToStore = async (
  documents: Document[],
  conversationId: string
) => {
  // Ensure every document has the conversationId in metadata
  const docsWithConversation = documents.map((doc) => ({
    ...doc,
    conversation_id: conversationId,
  }));

  console.log("Adding documents to vector store:", docsWithConversation);

  const embeddings = createEmbeddings();
  const vectorStore = await createVectorStore(embeddings);
  return vectorStore.addDocuments(docsWithConversation);
};
