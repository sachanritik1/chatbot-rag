import { PromptTemplate } from "@langchain/core/prompts";
import type { BuildPromptFn } from "@/domain/chat/types";

export const buildChatPrompt: BuildPromptFn = async ({
  history,
  question,
  fileContext,
}) => {
  const formatMessages = (
    messages: { sender: "user" | "assistant"; message: string }[],
  ) =>
    messages
      .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.message}`)
      .join("\n");

  const prompt = PromptTemplate.fromTemplate(
    `You are a helpful assistant. Use the following chat history and PDF context (if available) to answer the user’s last question.\nChat history:\n{chat_history}\nUser: {question}\nPDF Context:\n{fileContext}\nAI:`,
  );

  return prompt.format({
    chat_history: formatMessages(history),
    question,
    fileContext,
  });
};
