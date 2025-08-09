export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
};

export interface ConversationsRepository {
  create(userId: string, title: string): Promise<{ id: string } | null>;
  listByUserId(userId: string): Promise<Conversation[]>;
  deleteById(id: string): Promise<boolean>;
  verifyOwnership(userId: string, conversationId: string): Promise<boolean>;
  getById(conversationId: string): Promise<Conversation | null>;
}
