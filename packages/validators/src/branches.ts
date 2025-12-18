import { z } from "zod/v4";

// Create conversation branch
export const createBranchSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  selectedModel: z.string().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
