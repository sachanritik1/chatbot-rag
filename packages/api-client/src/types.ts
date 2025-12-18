import type { ModelId } from "@chatbot-rag/shared";

export type AuthTokenProvider = () => Promise<string | null>;

export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken: AuthTokenProvider;
}

// Conversation types
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  has_messages: boolean;
  branch_label?: string | null;
}

// Message types
export interface Message {
  id?: string;
  conversation_id?: string;
  sender: "user" | "assistant";
  message: string;
  created_at: string;
  model?: string | null;
}

export interface PaginatedMessages {
  data: Message[];
  pagination: {
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
  } | null;
}

// Chat message format (for AI SDK compatibility)
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  parts: {
    type: string;
    text?: string;
  }[];
  id?: string;
}

// API response types
export interface CreateConversationResponse {
  conversationId: string;
}

export interface DeleteResponse {
  success: boolean;
}

export interface UpdateTitleResponse {
  success: boolean;
  title: string;
}

export interface CreateBranchResponse {
  branchId: string;
  isUserMessage: boolean;
  modelToUse: string;
  branchMessage?: string;
}

// Chat request/response types
export interface ChatRequest {
  messages: ChatMessage[];
  conversationId?: string;
  model: ModelId;
}
