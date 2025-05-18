import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { addDocumentsToStore } from "@/utils/vector-store";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = await createClient();

    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "No user_id provided" },
        { status: 400 }
      );
    }

    // Create a new conversation for this upload
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert([{ user_id: userId, title: file.name }])
      .select()
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }
    console.log("Conversation created:", conversation);

    const conversationId = conversation.id;

    const loader = new WebPDFLoader(file);

    const docs = await loader.load();

    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitDocuments(docs);

    // Add documents to the vector store
    await addDocumentsToStore(chunks, conversationId);

    return NextResponse.json({
      status: "success",
      message: "PDF processed successfully",
      chunks: chunks.length,
      conversationId: conversationId,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
