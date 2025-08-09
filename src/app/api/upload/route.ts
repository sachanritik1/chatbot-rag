import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/domain/users/UserService";
import { SupabaseUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { ConversationService } from "@/domain/conversations/ConversationService";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { DocumentService } from "@/domain/documents/DocumentService";
import { IngestionService } from "@/domain/ingestion/IngestionService";
import { DocumentIndexer } from "@/domain/documents/DocumentIndexer";
import { VectorStoreService } from "@/domain/vector/VectorStoreService";
import { SupabaseVectorAdapter } from "@/infrastructure/vector/SupabaseVectorAdapter";
import { SupabaseDocumentsRepository } from "@/infrastructure/repos/DocumentsRepository";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const userService = new UserService(new SupabaseUsersRepository());
    const user = await userService.requireCurrentUser().catch(() => null);
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "No user_id provided" },
        { status: 400 },
      );
    }

    // Create conversation using service
    const conversationService = new ConversationService(
      new SupabaseConversationsRepository(),
      new SupabaseChatsRepository(),
    );
    const conversationId = await conversationService.create(userId, file.name);

    // Ingest PDF and add to vector store via services
    const vectorService = new VectorStoreService(new SupabaseVectorAdapter());
    const ingestionService = new IngestionService(
      new DocumentIndexer(500, 100),
      vectorService,
    );
    const documentService = new DocumentService(
      new SupabaseDocumentsRepository(),
      ingestionService,
      conversationService,
    );
    await documentService.addPdf(userId, conversationId, file);

    return NextResponse.json({
      status: "success",
      message: "PDF processed successfully",
      chunks: undefined,
      conversationId: conversationId,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 },
    );
  }
}
