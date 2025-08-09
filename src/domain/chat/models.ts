export type ChatHistory = {
  sender: "user" | "assistant";
  message: string;
  created_at: string;
  id?: string;
  model?: string | null;
};
