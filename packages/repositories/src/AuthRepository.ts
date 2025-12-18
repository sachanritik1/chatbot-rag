import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuthRepository, Credentials } from "@chatbot-rag/domain/auth";

export class SupabaseAuthRepository<
  T extends SupabaseClient = SupabaseClient,
> implements AuthRepository {
  constructor(private readonly supabase: T) {}

  async signInWithPassword({ email, password }: Credentials): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error("Invalid credentials");
  }

  async signUpWithPassword({ email, password }: Credentials): Promise<void> {
    const { error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw new Error("Email already in use");
  }
}
