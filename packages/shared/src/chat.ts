import type { Message } from "./types";

/**
 * Parses a Server-Sent Events (SSE) response body and concatenates all `text-delta` chunks.
 *
 * The server emits lines like: `data: {"type":"text-delta","delta":"..."}`.
 */
export function parseSSETextDeltas(sseText: string): string {
  const lines = sseText.split("\n");
  let assistantMessage = "";

  for (const line of lines) {
    if (!line.trim()) continue;
    if (!line.startsWith("data: ")) continue;

    const jsonStr = line.slice("data: ".length);
    try {
      const parsed = JSON.parse(jsonStr) as { type?: string; delta?: string };
      if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
        assistantMessage += parsed.delta;
      }
    } catch {
      // Ignore parse errors for non-JSON lines
    }
  }

  return assistantMessage;
}

export function getMessageIdBeforeIndex<T extends { id: string }>(
  messages: T[],
  messageIndex: number,
): string | undefined {
  const beforeIndex = messageIndex - 1;
  if (beforeIndex < 0) return undefined;
  return messages[beforeIndex]?.id;
}

export function findLastUserMessageBeforeIndex(
  messages: Message[],
  messageIndex: number,
): Message | undefined {
  const prefix = messages.slice(0, messageIndex + 1);
  return prefix.reverse().find((msg) => msg.role === "user");
}
