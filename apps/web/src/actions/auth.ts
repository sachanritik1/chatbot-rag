"use server";

// import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { AuthService } from "@/domain/auth/AuthService";
import { SupabaseAuthRepository } from "@/infrastructure/repos/AuthRepository";
import { z } from "zod";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { env } from "@/env";

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

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  const originHeader = (await headers()).get("origin");
  console.log("originHeader", originHeader);
  const siteUrl = originHeader ?? env.NEXT_PUBLIC_SITE_URL;
  console.log("siteUrl", siteUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error("Failed to start Google sign-in. Please try again.");
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login");
}
