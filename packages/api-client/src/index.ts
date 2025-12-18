// Main exports
export { createApiClient, type ApiClient } from "./client";

// Type exports
export type {
  ApiClientConfig,
  AuthTokenProvider,
  Conversation,
  Message,
  PaginatedMessages,
  ChatMessage,
  ChatRequest,
  CreateConversationResponse,
  DeleteResponse,
  UpdateTitleResponse,
  CreateBranchResponse,
} from "./types";

// Error export
export { ApiError } from "./utils/fetch";
