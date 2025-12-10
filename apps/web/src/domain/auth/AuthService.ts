import type { AuthRepository, Credentials } from "@/domain/auth/types";

export class AuthService {
  constructor(private readonly authRepo: AuthRepository) {}

  async login(credentials: Credentials): Promise<void> {
    return this.authRepo.signInWithPassword(credentials);
  }

  async signup(credentials: Credentials): Promise<void> {
    return this.authRepo.signUpWithPassword(credentials);
  }
}
