import type { ApiClientConfig, ChatRequest } from "../types";
import { apiStreamingFetch } from "../utils/fetch";

export function createChatApi(config: ApiClientConfig) {
  const { baseUrl, getAuthToken } = config;

  return {
    /**
     * Send a chat message with streaming response
     * Returns a Response object with a readable stream
     */
    async send(request: ChatRequest): Promise<Response> {
      return apiStreamingFetch(`${baseUrl}/api/chat`, {
        method: "POST",
        body: JSON.stringify(request),
        getAuthToken,
      });
    },
  };
}
