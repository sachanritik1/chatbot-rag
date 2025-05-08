import { NextRequest, NextResponse } from "next/server";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

const promptTemplate = `
You are a helpful assistant that answers user questions strictly based on the provided context extracted from a audio, video or PDF file.

Context: {context}

Question: {question}

Answer: Do not use any outside knowledge or assumptions. Stick only to the given context.
`;

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const openAIApiKey = process.env.OPENAI_API_KEY;
  if (!openAIApiKey) {
    return NextResponse.json(
      { error: "OPEN_AI_API_KEY not set" },
      { status: 500 }
    );
  }

  // Load Chroma vector DB
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  const vectorStore = new Chroma(embeddings, {
    collectionName: "chat-bot-rag",
    url: "http://localhost:8000",
  });

  // Load OpenAI model
  const llm = new OpenAI({
    temperature: 0.7,
    maxTokens: 512,
    topP: 1,
    verbose: false,
  });

  const prompt = new PromptTemplate({
    template: promptTemplate,
    inputVariables: ["context", "question"],
  });
  // Set up RetrievalQA chain
  const combineDocsChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  const qaChain = await createRetrievalChain({
    combineDocsChain,

    retriever: vectorStore.asRetriever({
      searchType: "mmr",
      searchKwargs: { fetchK: 10 },
    }),
  });

  const result = await qaChain.invoke({ input: query });
  return NextResponse.json({ data: result, status: "success" });
}
