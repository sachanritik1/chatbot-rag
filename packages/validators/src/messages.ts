import { z } from "zod/v4";

// Delete messages after a specific message
export const deleteAfterMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export type DeleteAfterMessageInput = z.infer<
  typeof deleteAfterMessageSchema
>;

// Get paginated messages
export const getPaginatedMessagesSchema = z.object({
  conversationId: z.string().uuid(),
  beforeId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type GetPaginatedMessagesInput = z.infer<
  typeof getPaginatedMessagesSchema
>;
