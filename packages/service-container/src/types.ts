import type { SupabaseClient } from "@supabase/supabase-js";

// Service constructor types
export type ServiceConstructor<T = unknown> = new (...args: unknown[]) => T;

// Container context
export interface ContainerContext {
  supabase: SupabaseClient;
  userId?: string;
}

// Service registry for manual registration
export type ServiceFactory<T = unknown> = (context: ContainerContext) => T;
