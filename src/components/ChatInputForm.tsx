"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Send, Upload, X } from "lucide-react";
import { Input } from "./ui/input";

interface ChatInputFormProps {
  onSubmit: (message: string, file?: File | null) => Promise<void>;
  isLoading: boolean;
}

export function ChatInputForm({ onSubmit, isLoading }: ChatInputFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        setSelectedFile(null);
      }
    } catch (err) {
      const errorMessage =
        (err as { message?: string }).message || "Request failed";
      setError(errorMessage);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ? file.name : null);
  };

  const clearSelectedFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      setSelectedFile(null);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-gray-100 px-2 py-2 text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none sm:px-4 dark:border-gray-700 dark:bg-[#23272f] dark:text-gray-100"
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
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
        {/* Hidden file input for PDF uploads */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-1 text-gray-600 sm:gap-2"
            type="button"
          >
            <Upload className="size-4" />
            Upload PDF
          </Button>
          {selectedFile && (
            <div className="flex items-center gap-[2px] rounded-full bg-green-50 px-1 py-1 sm:gap-1 sm:px-2 dark:bg-green-900/20">
              <span
                className="max-w-[150px] overflow-hidden text-sm text-ellipsis text-green-600 dark:text-green-400"
                title={selectedFile}
              >
                {selectedFile}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="flex h-5 w-5 items-center justify-center p-0"
                onClick={clearSelectedFile}
              >
                <X className="h-3 w-3 text-green-600 dark:text-green-400" />
              </Button>
            </div>
          )}
        </div>
      </form>
      {error && <div className="mt-1 px-2 text-sm text-red-600">{error}</div>}
    </>
  );
}
