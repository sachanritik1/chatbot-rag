import { z } from "zod";
import { UserService } from "@/domain/users/UserService";
import { ConversationService } from "@/domain/conversations/ConversationService";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { createAPIUsersRepository } from "@/infrastructure/repos/UsersRepository";
import { generateTitle } from "@/lib/llm";
import { revalidatePath } from "next/cache";
import { createAPIClient } from "@/utils/supabase/api";

const createEmptyConversationSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const deleteConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

const updateConversationTitleSchema = z.object({
  conversationId: z.string().uuid(),
  query: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsedData = createEmptyConversationSchema.safeParse(body);

    if (!parsedData.success) {
      return Response.json({ error: parsedData.error.message }, { status: 400 });
    }

    const { title } = parsedData.data;

    // Create API client with auth context
    const supabaseClient = await createAPIClient(req);

    const usersRepo = await createAPIUsersRepository(req);
    const userService = new UserService(usersRepo);
    const current = await userService.requireCurrentUser().catch(() => null);
    const userId = current?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationService = new ConversationService(
      new SupabaseConversationsRepository(supabaseClient),
      new SupabaseChatsRepository(supabaseClient),
    );

    const conversationId = await conversationService.create(userId, title);
    revalidatePath("/(authorized)/chat", "layout");

    return Response.json({ conversationId }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return Response.json(
      { error: "Error creating conversation" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsedData = deleteConversationSchema.safeParse(body);

    if (!parsedData.success) {
      return Response.json({ error: parsedData.error.message }, { status: 400 });
    }

    // Create API client with auth context
    const supabaseClient = await createAPIClient(req);

    const usersRepo = await createAPIUsersRepository(req);
    const userService = new UserService(usersRepo);
    const current = await userService.requireCurrentUser().catch(() => null);
    const userId = current?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = parsedData.data;
    const conversationService = new ConversationService(
      new SupabaseConversationsRepository(supabaseClient),
      new SupabaseChatsRepository(supabaseClient),
    );

    const ok = await conversationService.deleteForUser(userId, conversationId);

    if (!ok) {
      return Response.json(
        { error: "Error deleting conversation" },
        { status: 500 },
      );
    }

    revalidatePath("/(authorized)/chat", "layout");
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return Response.json(
      { error: "Error deleting conversation" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsedData = updateConversationTitleSchema.safeParse(body);

    if (!parsedData.success) {
      return Response.json({ error: parsedData.error.message }, { status: 400 });
    }

    const { conversationId, query } = parsedData.data;

    // Create API client with auth context
    const supabaseClient = await createAPIClient(req);

    const usersRepo = await createAPIUsersRepository(req);
    const userService = new UserService(usersRepo);
    const current = await userService.requireCurrentUser().catch(() => null);
    const userId = current?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repo = new SupabaseConversationsRepository(supabaseClient);

    // Verify ownership
    const conversation = await repo.getById(conversationId);
    if (conversation?.user_id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newTitle = await generateTitle(query);
    await repo.updateTitle(conversationId, newTitle);
    revalidatePath("/(authorized)/chat", "layout");

    return Response.json({ success: true, title: newTitle }, { status: 200 });
  } catch (error) {
    console.error("Error updating title:", error);
    return Response.json({ error: "Error updating title" }, { status: 500 });
  }
}
