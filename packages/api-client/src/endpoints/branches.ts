import type { ModelId } from "@chatbot-rag/shared";

import type { ApiClientConfig, CreateBranchResponse } from "../types";
import { apiFetch } from "../utils/fetch";

export function createBranchesApi(config: ApiClientConfig) {
  const { baseUrl, getAuthToken } = config;

  return {
    /**
     * Create a conversation branch from a specific message
     */
    async create(
      conversationId: string,
      messageId: string,
      selectedModel?: ModelId,
    ): Promise<CreateBranchResponse> {
      return apiFetch<CreateBranchResponse>(`${baseUrl}/api/branches`, {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          messageId,
          selectedModel,
        }),
        getAuthToken,
      });
    },
  };
}
