export type Credentials = { email: string; password: string };

export interface AuthRepository {
  signInWithPassword(credentials: Credentials): Promise<void>;
  signUpWithPassword(credentials: Credentials): Promise<void>;
}
