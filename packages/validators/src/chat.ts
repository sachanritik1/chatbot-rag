import { z } from "zod/v4";

// Chat message part
const chatMessagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

// Chat message
const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(chatMessagePartSchema),
});

// Chat request
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema),
  conversationId: z.string().uuid().optional(),
  model: z.string(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

// Generate title
export const generateTitleSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

export type GenerateTitleInput = z.infer<typeof generateTitleSchema>;
