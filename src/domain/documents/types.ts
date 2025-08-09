export type StoredDocument = {
  id: string;
  conversation_id: string;
  content?: string | null;
  created_at: string;
};

export interface DocumentsRepository {
  listByConversationId(conversationId: string): Promise<StoredDocument[]>;
  deleteByConversationId(conversationId: string): Promise<boolean>;
}
