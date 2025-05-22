"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Send, Upload } from "lucide-react";

interface ChatInputFormProps {
  onSubmit: (message: string, file?: File | null) => Promise<void>;
  isLoading: boolean;
}

export function ChatInputForm({ onSubmit, isLoading }: ChatInputFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await onSubmit(currentMessage, fileInputRef.current?.files?.[0]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const errorMessage =
        (err as { message?: string }).message || "Request failed";
      setError(errorMessage);
    }
  }

  return (
    <>
      <div className="flex w-full items-center gap-2">
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          ref={fileInputRef}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="flex items-center gap-2 text-gray-600"
          type="button"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload PDF</span>
        </Button>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 items-center gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-14 flex-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-2 text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none sm:w-fit sm:px-4 dark:border-gray-700 dark:bg-[#23272f] dark:text-gray-100"
            placeholder="Ask your question here..."
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="rounded-full px-6"
          >
            {isLoading ? (
              "..."
            ) : (
              <>
                <Send className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </Button>
        </form>
      </div>
      {error && <div className="mt-1 px-2 text-sm text-red-600">{error}</div>}
    </>
  );
}
