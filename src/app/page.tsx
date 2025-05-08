"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; content: string }[]
  >([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Zod validation on client
    const schema = z.object({ query: z.string().min(1, "Query is required") });
    const parseResult = schema.safeParse({ query: question });
    if (!parseResult.success) {
      setError(parseResult.error.errors.map((e) => e.message).join(", "));
      return;
    }
    setLoading(true);
    setMessages((msgs) => [...msgs, { role: "user", content: question }]);
    setQuestion("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });
      const data = await res.json();
      const botMsg =
        data?.data?.output_text ||
        (data?.data
          ? JSON.stringify(data.data)
          : data.error || "No answer returned");
      setMessages((msgs) => [...msgs, { role: "bot", content: botMsg }]);
    } catch (err: unknown) {
      const errorMessage =
        (err as { message?: string }).message || "Request failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] dark:from-[#18181b] dark:to-[#23272f] transition-colors duration-300">
      <div className="w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl shadow-2xl bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <header className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-[#23272f]/60">
          <span className="font-bold text-lg tracking-tight">Chatbot RAG</span>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 select-none pt-16">
              Start the conversation…
            </div>
          )}
          {messages.map((msg, i) => (
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
          ))}
          <div ref={chatEndRef} />
        </main>
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 px-4 py-4 border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-[#23272f]/60"
        >
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 rounded-full px-4 py-2 bg-gray-100 dark:bg-[#23272f] text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your question…"
            disabled={loading}
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-semibold shadow transition disabled:opacity-50"
            disabled={loading || !question.trim()}
          >
            {loading ? "…" : "Send"}
          </button>
        </form>
        {error && <div className="px-6 pb-2 text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
}
