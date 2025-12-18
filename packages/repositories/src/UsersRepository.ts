import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserIdentity, UsersRepository } from "@chatbot-rag/domain/users";

export class SupabaseUsersRepository<T extends SupabaseClient = SupabaseClient> implements UsersRepository {
  constructor(private readonly supabase: T) {}

  async getCurrentUser(): Promise<UserIdentity | null> {
    const res = await this.supabase.auth.getUser();
    const id = res.data.user?.id ?? null;
    return id ? { id } : null;
  }
}
