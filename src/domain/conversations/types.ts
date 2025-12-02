export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  parent_conversation_id?: string | null;
  parent_message_id?: string | null;
  branch_created_at?: string | null;
  branch_label?: string | null;
};

export type ConversationTree = {
  conversation: Conversation;
  branches: ConversationTree[];
};

export interface ConversationsRepository {
  create(userId: string, title: string): Promise<{ id: string } | null>;
  listByUserId(userId: string): Promise<Conversation[]>;
  deleteById(id: string): Promise<boolean>;
  verifyOwnership(userId: string, conversationId: string): Promise<boolean>;
  getById(conversationId: string): Promise<Conversation | null>;
  createBranch(
    userId: string,
    parentConversationId: string,
    parentMessageId: string,
    title: string,
    branchLabel?: string,
  ): Promise<{ id: string } | null>;
  getBranches(conversationId: string): Promise<Conversation[]>;
  getBranchTree(rootConversationId: string): Promise<ConversationTree>;
}
