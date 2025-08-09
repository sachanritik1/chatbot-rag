"use server";

// import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsedData = loginSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error("Email or password is not valid");
  }

  const { error } = await supabase.auth.signInWithPassword(parsedData.data);

  if (error) {
    throw new Error("Invalid credentials");
  }

  // revalidatePath("/", "layout");
  redirect("/chat");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsedData = loginSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error("Email or password is not valid");
  }

  const { error } = await supabase.auth.signUp(parsedData.data);

  if (error) {
    throw new Error("Email already in use");
  }

  // revalidatePath("/", "layout");
  redirect("/chat");
}
