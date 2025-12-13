import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { streamText } from "ai";
import { getModelConfig } from "@/config/models";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID } from "@/config/models";
import { createModelInstance } from "@/lib/llm";

const schema = z.object({
  query: z.string().min(1, "Query is required"),
  model: z.enum(ALLOWED_MODEL_IDS).optional().default(DEFAULT_MODEL_ID),
});

const DAILY_LIMIT = 10;
const RL_COOKIE_NAME = "guest_rl_v1"; // JSON: { date: YYYY-MM-DD, count: number }
const GUEST_ID_COOKIE = "guest_id";

function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function generateGuestId(): string {
  // Simple UUID v4-ish generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = {
      query: formData.get("query"),
      model: formData.get("model") ?? undefined,
    } as Record<string, unknown>;

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { query, model } = parsed.data;

    // Rate limit based on a server-managed cookie
    const cookieStore = await cookies();
    const today = formatDateYYYYMMDD(new Date());

    let rl = { date: today, count: 0 } as { date: string; count: number };
    const existing = cookieStore.get(RL_COOKIE_NAME)?.value;
    if (existing) {
      try {
        const parsedExisting = JSON.parse(existing) as {
          date?: string;
          count?: number;
        };
        if (
          parsedExisting.date === today &&
          typeof parsedExisting.count === "number"
        ) {
          rl = { date: today, count: parsedExisting.count };
        }
      } catch {
        // ignore malformed cookie
      }
    }

    if (rl.count >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily limit reached. You can send up to ${DAILY_LIMIT} messages per day as a guest.`,
        },
        { status: 429 },
      );
    }

    // Ensure a stable guest_id cookie for future use (not strictly required for RL)
    if (!cookieStore.get(GUEST_ID_COOKIE)) {
      cookieStore.set({
        name: GUEST_ID_COOKIE,
        value: generateGuestId(),
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        // 30 days
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    // Create streaming response with Vercel AI SDK
    const cfg = getModelConfig(model);
    const prompt = `You are a helpful assistant. Answer the user's question clearly and concisely.\nUser: ${query}\nAI:`;
    const modelInstance = createModelInstance(cfg.id);

    const result = streamText({
      model: modelInstance.modelInstance,
      prompt,
      temperature: cfg.supports.temperature
        ? cfg.defaultParams?.temperature
        : undefined,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const textPart of result.textStream) {
            controller.enqueue(encoder.encode(textPart));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    // Increment and persist RL cookie right away to prevent abuse on early-close
    const updated = JSON.stringify({ date: today, count: rl.count + 1 });
    cookieStore.set({
      name: RL_COOKIE_NAME,
      value: updated,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      // expire after 2 days to allow clock differences
      maxAge: 60 * 60 * 24 * 2,
      path: "/",
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error in guest chat API:", error);
    return NextResponse.json(
      { error: "Something went wrong", success: false },
      { status: 500 },
    );
  }
}
