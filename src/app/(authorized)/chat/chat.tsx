"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Send, Upload } from "lucide-react";

export default function ChatPage({ title }: { title?: string }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; content: string }[]
  >([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const schema = z.object({ query: z.string().min(1, "Query is required") });
    const parseResult = schema.safeParse({ query: question });
    if (!parseResult.success) {
      setError(parseResult.error.errors.map((e) => e.message).join(", "));
      return;
    }
    setLoading(true);
    setMessages((msgs) => [...msgs, { role: "user", content: question }]);
    const currentQuestion = question;
    setQuestion("");
    try {
      setUploadStatus("Processing your question...");
      const formData = new FormData();
      if (fileInputRef.current?.files?.[0]) {
        formData.append("file", fileInputRef.current.files[0]); // attach the file
      }
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }

      formData.append("query", currentQuestion);
      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadStatus("");
      fileInputRef.current!.value = ""; // Clear the file input
      const botMsg = data?.data || data?.error || "No answer returned";
      setMessages((msgs) => [...msgs, { role: "bot", content: botMsg }]);
      setConversationId(data.conversationId);
    } catch (err: unknown) {
      const errorMessage =
        (err as { message?: string }).message || "Request failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex size-full max-h-[calc(100%-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-2xl backdrop-blur-lg dark:border-gray-800 dark:bg-[#18181b]/80">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white/60 px-6 py-4 dark:border-gray-800 dark:bg-[#23272f]/60">
        <span className="text-lg font-bold tracking-tight">
          {title ?? "AI Chat"}
        </span>
        <div className="flex items-center gap-2">
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
          >
            <Upload className="h-4 w-4" />
            Upload PDF
          </Button>
        </div>
      </header>
      {uploadStatus && (
        <div className="bg-blue-50 px-6 py-2 text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          {uploadStatus}
        </div>
      )}
      <main className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="pt-16 text-center text-gray-400 select-none">
            Start asking questions to your AI...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line shadow-md ${
                  msg.role === "user"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md bg-gray-100 text-gray-900 dark:bg-[#23272f] dark:text-gray-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </main>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 bg-white/60 px-4 py-4 dark:border-gray-800 dark:bg-[#23272f]/60"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none dark:border-gray-700 dark:bg-[#23272f] dark:text-gray-100"
          placeholder="Ask your question here..."
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-full px-6"
        >
          {loading ? (
            "..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </form>
      {error && <div className="px-6 pb-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
