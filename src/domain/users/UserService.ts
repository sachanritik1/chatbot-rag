import type { UsersRepository, UserIdentity } from "@/domain/users/types";

export class UserService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async requireCurrentUser(): Promise<UserIdentity> {
    const user = await this.usersRepo.getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }
    return user;
  }
}
