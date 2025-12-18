import type {
  ApiClientConfig,
  Conversation,
  CreateConversationResponse,
  DeleteResponse,
  UpdateTitleResponse,
} from "../types";
import { apiFetch } from "../utils/fetch";

export function createConversationsApi(config: ApiClientConfig) {
  const { baseUrl, getAuthToken } = config;

  return {
    /**
     * Create a new empty conversation
     */
    async create(title: string): Promise<CreateConversationResponse> {
      return apiFetch<CreateConversationResponse>(
        `${baseUrl}/api/conversations`,
        {
          method: "POST",
          body: JSON.stringify({ title }),
          getAuthToken,
        },
      );
    },

    /**
     * Delete a conversation
     */
    async delete(conversationId: string): Promise<DeleteResponse> {
      return apiFetch<DeleteResponse>(`${baseUrl}/api/conversations`, {
        method: "DELETE",
        body: JSON.stringify({ conversationId }),
        getAuthToken,
      });
    },

    /**
     * Update conversation title (AI-generated from query)
     */
    async updateTitle(
      conversationId: string,
      query: string,
    ): Promise<UpdateTitleResponse> {
      return apiFetch<UpdateTitleResponse>(`${baseUrl}/api/conversations`, {
        method: "PATCH",
        body: JSON.stringify({ conversationId, query }),
        getAuthToken,
      });
    },

    /**
     * List all conversations
     * Note: This currently uses a direct fetch, but should be migrated to API route
     */
    list(): Promise<Conversation[]> {
      // TODO: Implement API route for listing conversations
      // For now, this will need to be handled by the app using Supabase directly
      throw new Error(
        "conversations.list() should use Supabase directly for now",
      );
    },
  };
}
