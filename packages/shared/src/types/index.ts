// Model types
export type ModelId =
  | "gemini-3-pro-preview"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-preview-09-2025"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash-lite-preview-09-2025"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite";

// Message types
export type SenderRole = "user" | "assistant";

export interface Message {
  id: string;
  role: SenderRole;
  content: string;
  timestamp: Date;
  model?: string;
}

export interface ChatHistory {
  id?: string;
  conversation_id?: string;
  sender: SenderRole;
  message: string;
  created_at: string;
  model?: string | null;
}

// Conversation types
export interface Conversation {
  id: string;
  user_id?: string;
  title: string;
  created_at: string;
  updated_at?: string;
  parent_conversation_id?: string | null;
  parent_message_id?: string | null;
  branch_created_at?: string | null;
  branch_label?: string | null;
  has_messages?: boolean; // Tracks if conversation has any messages
}

export interface ConversationTree {
  conversation: Conversation;
  branches: ConversationTree[];
}

// User types
export interface User {
  id: string;
  email?: string;
  created_at?: string;
}
