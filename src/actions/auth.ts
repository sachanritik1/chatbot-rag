"use server";

// import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthService } from "@/domain/auth/AuthService";
import { SupabaseAuthRepository } from "@/infrastructure/repos/AuthRepository";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(formData: FormData) {
  const auth = new AuthService(new SupabaseAuthRepository());

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsedData = loginSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error("Email or password is not valid");
  }

  await auth.login(parsedData.data);

  // revalidatePath("/", "layout");
  redirect("/chat");
}

export async function signup(formData: FormData) {
  const auth = new AuthService(new SupabaseAuthRepository());

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsedData = loginSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error("Email or password is not valid");
  }

  await auth.signup(parsedData.data);

  // revalidatePath("/", "layout");
  redirect("/chat");
}
