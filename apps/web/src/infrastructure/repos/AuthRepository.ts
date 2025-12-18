import { createClient } from "@/utils/supabase/server";
import type { AuthRepository, Credentials } from "@chatbot-rag/domain/auth";

export class SupabaseAuthRepository implements AuthRepository {
  async signInWithPassword({ email, password }: Credentials): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error("Invalid credentials");
  }

  async signUpWithPassword({ email, password }: Credentials): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error("Email already in use");
  }
}
