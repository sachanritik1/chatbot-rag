import { createClient } from "@/utils/supabase/server";
import type { UsersRepository, UserIdentity } from "@/domain/users/types";

export class SupabaseUsersRepository implements UsersRepository {
  async getCurrentUser(): Promise<UserIdentity | null> {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    const id = res.data?.user?.id ?? null;
    return id ? { id } : null;
  }
}
