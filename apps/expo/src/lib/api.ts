import type { ModelId } from "@chatbot-rag/shared";

import { API_BASE_URL } from "../config/api";
import { supabase } from "./supabase";

/**
 * Get authentication headers for API requests
 */
async function getAuthHeaders(): Promise<HeadersInit_> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// Conversations API
// ============================================================================

export const conversationsApi = {
  /**
   * Create a new empty conversation
   */
  create: async (title: string): Promise<{ conversationId: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ title }),
    });

    return handleResponse<{ conversationId: string }>(response);
  },

  /**
   * Delete a conversation
   */
  delete: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ conversationId }),
    });

    return handleResponse<{ success: boolean }>(response);
  },

  /**
   * Update conversation title (AI-generated from query)
   */
  updateTitle: async (
    conversationId: string,
    query: string,
  ): Promise<{ success: boolean; title: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ conversationId, query }),
    });

    return handleResponse<{ success: boolean; title: string }>(response);
  },

  /**
   * List conversations with messages (uses direct Supabase query for performance)
   */
  list: async (): Promise<
    {
      id: string;
      user_id: string;
      title: string;
      created_at: string;
      has_messages: boolean;
      branch_label?: string | null;
    }[]
  > => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("has_messages", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data as {
      id: string;
      user_id: string;
      title: string;
      created_at: string;
      has_messages: boolean;
      branch_label?: string | null;
    }[];
  },
};

// ============================================================================
// Messages API
// ============================================================================

export const messagesApi = {
  /**
   * Delete all messages after a specific message (for retry/edit)
   */
  deleteAfter: async (
    conversationId: string,
    messageId: string,
  ): Promise<{ success: boolean }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/messages`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ messageId }),
      },
    );

    return handleResponse<{ success: boolean }>(response);
  },

  /**
   * Fetch paginated messages for a conversation
   */
  getPaginated: async (
    conversationId: string,
    options?: {
      beforeId?: string;
      limit?: number;
    },
  ) => {
    const params = new URLSearchParams({
      conversationId,
      ...(options?.beforeId && { beforeId: options.beforeId }),
      ...(options?.limit && { limit: options.limit.toString() }),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/messages?${params.toString()}`,
      {
        headers: await getAuthHeaders(),
      },
    );

    return handleResponse<{
      data: {
        id?: string;
        conversation_id?: string;
        sender: "user" | "assistant";
        message: string;
        created_at: string;
        model?: string | null;
      }[];
      pagination: {
        totalCount: number;
        totalPages: number;
        page: number;
        limit: number;
      } | null;
    }>(response);
  },
};

// ============================================================================
// Branches API
// ============================================================================

export const branchesApi = {
  /**
   * Create a conversation branch from a specific message
   */
  create: async (
    conversationId: string,
    messageId: string,
    selectedModel?: ModelId,
  ): Promise<{
    branchId: string;
    isUserMessage: boolean;
    modelToUse: string;
    branchMessage?: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/branches`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        conversationId,
        messageId,
        selectedModel,
      }),
    });

    return handleResponse<{
      branchId: string;
      isUserMessage: boolean;
      modelToUse: string;
      branchMessage?: string;
    }>(response);
  },
};

// ============================================================================
// Chat API (existing - for reference)
// ============================================================================

/**
 * Send a chat message with streaming response
 * Note: This uses the existing /api/chat endpoint
 */
export async function sendChatMessage(
  conversationId: string | undefined,
  messageText: string,
  model: ModelId,
  messages: { role: "user" | "assistant"; content: string }[],
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        ...messages.map((m) => ({
          role: m.role,
          parts: [{ type: "text", text: m.content }],
        })),
        {
          role: "user",
          parts: [{ type: "text", text: messageText }],
        },
      ],
      conversationId,
      model,
    }),
  });

  return response;
}
