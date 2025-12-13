export interface UserIdentity {
  id: string;
}

export interface UsersRepository {
  getCurrentUser(): Promise<UserIdentity | null>;
}
