"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Send, Upload } from "lucide-react";

export default function ChatPage() {
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
    <div className="flex justify-center items-center">
      <div className="w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl shadow-2xl bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-[#23272f]/60">
          <span className="font-bold text-lg tracking-tight">PDF Chat</span>
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
              <Upload className="w-4 h-4" />
              Upload PDF
            </Button>
          </div>
        </header>
        {uploadStatus && (
          <div className="px-6 py-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400">
            {uploadStatus}
          </div>
        )}
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 select-none pt-16">
              Start asking questions about your PDF...
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
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-md whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-[#23272f] text-gray-900 dark:text-gray-100 rounded-bl-md"
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
          className="flex gap-2 px-4 py-4 border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-[#23272f]/60"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 rounded-full px-4 py-2 bg-gray-100 dark:bg-[#23272f] text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ask a question about the PDF..."
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
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
        {error && <div className="px-6 pb-2 text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
}
