import { createAPIClient } from "@/utils/supabase/api";
import { createClient } from "@/utils/supabase/server";

// Re-export all repository classes
export {
  SupabaseAuthRepository,
  SupabaseUsersRepository,
  SupabaseConversationsRepository,
  SupabaseChatsRepository,
} from "@chatbot-rag/repositories";

import {
  SupabaseAuthRepository,
  SupabaseUsersRepository,
  SupabaseConversationsRepository,
  SupabaseChatsRepository,
} from "@chatbot-rag/repositories";

/**
 * Create repositories for API routes that supports both
 * cookie-based and Bearer token authentication
 */
export async function createAPIRepositories(request: Request) {
  const supabase = await createAPIClient(request);
  return {
    auth: new SupabaseAuthRepository(supabase),
    users: new SupabaseUsersRepository(supabase),
    conversations: new SupabaseConversationsRepository(supabase),
    chats: new SupabaseChatsRepository(supabase),
  };
}

/**
 * Create repositories for server components
 */
export async function createServerRepositories() {
  const supabase = await createClient();
  return {
    auth: new SupabaseAuthRepository(supabase),
    users: new SupabaseUsersRepository(supabase),
    conversations: new SupabaseConversationsRepository(supabase),
    chats: new SupabaseChatsRepository(supabase),
  };
}

// For backward compatibility
export async function createAPIUsersRepository(request: Request) {
  const supabase = await createAPIClient(request);
  return new SupabaseUsersRepository(supabase);
}
