"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import {
  MODEL_OPTIONS,
  DEFAULT_MODEL_ID,
  
  ALLOWED_MODEL_IDS
} from "@/config/models";
import type {ModelId} from "@/config/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./ui/textarea";

interface ChatInputFormProps {
  onSubmit: (message: string, model?: ModelId) => Promise<void>;
  isLoading: boolean;
  initialModel?: ModelId;
}

export function ChatInputForm({
  onSubmit,
  isLoading,
  initialModel,
}: ChatInputFormProps) {
  const params = useParams();
  const conversationId =
    (params?.conversationId as string | undefined) || undefined;

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    initialModel || DEFAULT_MODEL_ID,
  );

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const GLOBAL_KEY = "last_selected_model_v1";
      const CONV_KEY = conversationId
        ? `model_for_conversation:${conversationId}`
        : undefined;

      const tryRead = (key?: string  ): string | null =>
        key ? (window.localStorage.getItem(key)) : null;

      const isAllowed = (m: unknown): m is ModelId =>
        typeof m === "string" &&
        (ALLOWED_MODEL_IDS as readonly string[]).includes(m);

      const fromConv = tryRead(CONV_KEY || undefined);
      if (isAllowed(fromConv)) {
        setSelectedModel(fromConv);
        return;
      }
      const fromGlobal = tryRead(GLOBAL_KEY);
      if (isAllowed(fromGlobal)) {
        setSelectedModel(fromGlobal);
        return;
      }
      setSelectedModel(DEFAULT_MODEL_ID);
    } catch {}
  }, [conversationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const schema = z.object({ query: z.string().min(1, "Query is required") });
    const parseResult = schema.safeParse({ query: message });

    if (!parseResult.success) {
      setError(parseResult.error.errors.map((e) => e.message).join(", "));
      return;
    }

    setError("");
    const currentMessage = message;
    setMessage("");

    try {
      console.log("selected model", selectedModel);
      await onSubmit(currentMessage, selectedModel);
    } catch (err) {
      const errorMessage =
        (err as { message?: string }).message || "Request failed";
      setError(errorMessage);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
        <div className="relative flex">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            // add class to leave space for submit button
            className="max-h-32 w-full border border-gray-300 bg-gray-100 px-2 py-2 text-left text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none sm:px-4 dark:border-gray-700 dark:bg-[#23272f] dark:text-gray-100"
            placeholder="Ask your question here..."
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            variant="ghost"
            className="absolute right-0 bottom-0 px-6"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Hidden file input for PDF uploads */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedModel}
            onValueChange={(val: string) => {
              const next = val as ModelId;
              setSelectedModel(next);
              try {
                if (typeof window !== "undefined") {
                  const GLOBAL_KEY = "last_selected_model_v1";
                  const CONV_KEY = conversationId
                    ? `model_for_conversation:${conversationId}`
                    : undefined;
                  window.localStorage.setItem(GLOBAL_KEY, next);
                  if (CONV_KEY) window.localStorage.setItem(CONV_KEY, next);
                }
              } catch {}
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 px-2 py-1 text-sm sm:w-[140px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
      {error && <div className="mt-1 px-2 text-sm text-red-600">{error}</div>}
    </>
  );
}
