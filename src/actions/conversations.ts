"use server";

import { revalidatePath } from "next/cache";

export async function revalidateConversations() {
  revalidatePath("/(authorized)/chat", "layout");
  return "done";
}
