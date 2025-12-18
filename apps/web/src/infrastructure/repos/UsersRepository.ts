import { createClient } from "@/utils/supabase/server";
import { createAPIClient } from "@/utils/supabase/api";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsersRepository, UserIdentity } from "@chatbot-rag/domain/users";

export class SupabaseUsersRepository implements UsersRepository {
  constructor(private supabaseClient?: SupabaseClient) {}

  async getCurrentUser(): Promise<UserIdentity | null> {
    const supabase = this.supabaseClient ?? (await createClient());
    const res = await supabase.auth.getUser();
    const id = res.data.user?.id ?? null;
    return id ? { id } : null;
  }
}

/**
 * Create a UsersRepository for API routes that supports both
 * cookie-based and Bearer token authentication
 */
export async function createAPIUsersRepository(request: Request) {
  const supabase = await createAPIClient(request);
  return new SupabaseUsersRepository(supabase);
}
