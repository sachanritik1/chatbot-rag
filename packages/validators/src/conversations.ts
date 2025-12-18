import { z } from "zod/v4";

// Create empty conversation
export const createEmptyConversationSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type CreateEmptyConversationInput = z.infer<
  typeof createEmptyConversationSchema
>;

// Create conversation with initial message
export const createConversationSchema = z.object({
  query: z.string().min(1, "Query is required"),
  model: z.string().optional(),
});

export type CreateConversationInput = z.infer<
  typeof createConversationSchema
>;

// Delete conversation
export const deleteConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export type DeleteConversationInput = z.infer<
  typeof deleteConversationSchema
>;

// Update conversation title
export const updateConversationTitleSchema = z.object({
  conversationId: z.string().uuid(),
  query: z.string().min(1),
});

export type UpdateConversationTitleInput = z.infer<
  typeof updateConversationTitleSchema
>;
