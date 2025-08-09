import { buildChatService } from "@/domain/chat/buildService";

export const chat = async (
  userId: string,
  conversationId: string,
  query: string,
  file: File | undefined,
  model: string = "gpt-5-mini",
) => {
  // Reuse ChatService but collect the streaming output into a string
  const service = buildChatService(model);
  const stream = await service.sendMessage({
    userId,
    conversationId,
    question: query,
    file,
    model,
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }
  return output;
};
