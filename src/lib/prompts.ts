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
    `You are a helpful assistant. Use the following chat history and PDF context (if available) to answer the user’s last question.\nChat history:\n{chat_history}\nUser: {question}\nPDF Context:\n{fileContext}\nAI:
    \n Rules:
    - Don't mention that PDF context is not available. Assume that if it's not available then user hasn't uploaded any PDF file yet.
    - Always check if the user's question is about the PDF context. If it is, use the PDF context to answer the question.
    - Make sure to respond the user's question in a concise and clear manner.
    - If the user's question is not about the PDF context, Then answer with the best of your knowledge.
    `,
  );

  return prompt.format({
    chat_history: formatMessages(history),
    question,
    fileContext,
  });
};
