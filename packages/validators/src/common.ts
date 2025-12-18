import { z } from "zod/v4";

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// UUID schema
export const uuidSchema = z.string().uuid();

// ID schema (can be UUID or other format)
export const idSchema = z.string().min(1);
