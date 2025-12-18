import type {
  ApiClientConfig,
  DeleteResponse,
  PaginatedMessages,
} from "../types";
import { apiFetch } from "../utils/fetch";

export function createMessagesApi(config: ApiClientConfig) {
  const { baseUrl, getAuthToken } = config;

  return {
    /**
     * Delete all messages after a specific message (for retry/edit)
     */
    async deleteAfter(
      conversationId: string,
      messageId: string,
    ): Promise<DeleteResponse> {
      return apiFetch<DeleteResponse>(
        `${baseUrl}/api/conversations/${conversationId}/messages`,
        {
          method: "DELETE",
          body: JSON.stringify({ messageId }),
          getAuthToken,
        },
      );
    },

    /**
     * Fetch paginated messages for a conversation
     */
    async getPaginated(
      conversationId: string,
      options?: {
        beforeId?: string;
        limit?: number;
      },
    ): Promise<PaginatedMessages> {
      const params = new URLSearchParams({
        conversationId,
        ...(options?.beforeId && { beforeId: options.beforeId }),
        ...(options?.limit && { limit: options.limit.toString() }),
      });

      return apiFetch<PaginatedMessages>(
        `${baseUrl}/api/messages?${params.toString()}`,
        {
          getAuthToken,
        },
      );
    },
  };
}
