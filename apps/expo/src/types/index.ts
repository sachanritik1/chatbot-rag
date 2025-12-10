export type ModelId = "gpt-4o" | "gpt-4o-mini";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistory {
  id: string;
  conversation_id: string;
  sender: "user" | "assistant";
  message: string;
  created_at: string;
  model?: string | null;
}
