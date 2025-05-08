import { NextRequest, NextResponse } from "next/server";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { z } from "zod";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { supabaseClient } from "@/server/db";

const promptTemplate = `
You are a helpful assistant that answers user questions strictly based on the provided context extracted from a audio, video or PDF file.

Context: {context}

Question: {question}

Answer: Do not use any outside knowledge or assumptions. Stick only to the given context.
`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const schema = z.object({ query: z.string().min(1, "Query is required") });
  const parseResult = schema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }
  const { query } = parseResult.data;

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

  const refinePrompt = new PromptTemplate({
    template: `You are a helpful assistant. Improve the following user question for better search relevance.

    Original Question: {question}

    Refined Question:`,
    inputVariables: ["question"],
  });

  const refineChain = refinePrompt.pipe(llm);
  const refinedQuery = await refineChain.invoke({ question: query });

  // Set up RetrievalQA chain
  const combineDocsChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabaseClient,
    tableName: "documents",
  });

  const docs = await vectorStore.similaritySearch(refinedQuery, 2);

  const finalResult = await combineDocsChain.invoke({
    context: docs,
    question: query,
  });

  return NextResponse.json({ data: finalResult, status: "success" });
}
