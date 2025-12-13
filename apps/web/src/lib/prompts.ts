import type { BuildPromptFn } from "@/domain/chat/types";

export const buildChatPrompt: BuildPromptFn = ({ history, question }) => {
  const formatMessages = (
    messages: { sender: "user" | "assistant"; message: string }[],
  ) =>
    messages
      .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.message}`)
      .join("\n");

  return `You are a helpful assistant. Use the following chat history to answer the user's question.

Chat history:
${formatMessages(history)}

User: ${question}
AI:`;
};
