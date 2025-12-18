import type { ApiClientConfig } from "./types";
import { createBranchesApi } from "./endpoints/branches";
import { createChatApi } from "./endpoints/chat";
import { createConversationsApi } from "./endpoints/conversations";
import { createMessagesApi } from "./endpoints/messages";

/**
 * Unified API client for chatbot-rag
 * Works on both web (Next.js) and mobile (React Native/Expo)
 *
 * @example
 * ```ts
 * // Web (with Supabase auth)
 * const apiClient = createApiClient({
 *   baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
 *   getAuthToken: async () => {
 *     const { data: { session } } = await supabase.auth.getSession();
 *     return session?.access_token ?? null;
 *   }
 * });
 *
 * // Mobile (with Supabase auth)
 * const apiClient = createApiClient({
 *   baseUrl: API_BASE_URL,
 *   getAuthToken: async () => {
 *     const { data: { session } } = await supabase.auth.getSession();
 *     return session?.access_token ?? null;
 *   }
 * });
 *
 * // Usage
 * const result = await apiClient.conversations.create("New Chat");
 * ```
 */
export function createApiClient(config: ApiClientConfig) {
  return {
    conversations: createConversationsApi(config),
    messages: createMessagesApi(config),
    branches: createBranchesApi(config),
    chat: createChatApi(config),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
