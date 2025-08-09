export type UserIdentity = {
  id: string;
};

export interface UsersRepository {
  getCurrentUser(): Promise<UserIdentity | null>;
}
