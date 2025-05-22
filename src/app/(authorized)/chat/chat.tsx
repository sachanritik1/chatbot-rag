"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Send, Upload, Bot } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { revalidateConversations } from "@/actions/conversations";
import { ChatMessage } from "@/components/ChatMessage";

type ChatPageProps = {
  title?: string;
  prevMessages?: { role: "user" | "bot"; content: string }[];
};

export default function ChatPage({ title, prevMessages }: ChatPageProps) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; content: string; timestamp: Date }[]
  >(prevMessages?.map((msg) => ({ ...msg, timestamp: new Date() })) || []);
  const [uploadStatus, setUploadStatus] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const conversationId = params.conversationId as string;

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
    setMessages((msgs) => [
      ...msgs,
      { role: "user", content: question, timestamp: new Date() },
    ]);
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
      if (!conversationId) {
        await revalidateConversations();
        router.push(`/chat/${data.data.conversationId}`);
        return;
      }
      fileInputRef.current!.value = ""; // Clear the file input
      const botMsg =
        data?.data?.assistantMessage || data?.error || "No answer returned";
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", content: botMsg, timestamp: new Date() },
      ]);
    } catch (err: unknown) {
      const errorMessage =
        (err as { message?: string }).message || "Request failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="size-full max-h-[calc(100%-2.5rem)]">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 bg-white/60 dark:border-gray-800 dark:bg-[#23272f]/60">
        <CardTitle className="flex w-full items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            {title ?? "AI Chat"}
          </h1>
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
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full max-h-[calc(100%-2.5rem)] space-y-5 overflow-y-auto px-4 py-6">
        {uploadStatus && (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent" />
            {uploadStatus}
          </div>
        )}

        {loading && !uploadStatus && (
          <div className="animate-in fade-in-0 flex w-full">
            <div className="flex max-w-[80%] gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 select-none dark:bg-zinc-700">
                <Bot className="h-5 w-5 text-white" />
              </div>

              <div className="flex flex-col gap-1">
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 shadow-sm dark:bg-zinc-800">
                  <div className="flex space-x-1.5">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500"></div>
                    <div className="animation-delay-200 h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500"></div>
                    <div className="animation-delay-500 h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
              How can I help you today?
            </h3>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Ask me anything or upload a PDF document to get started with your
              AI assistant.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                isLatest={i === messages.length - 1}
              />
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </CardContent>
      <CardFooter className="flex w-full border-t border-gray-200 bg-white/60 dark:border-gray-800 dark:bg-[#23272f]/60">
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-14 flex-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-2 text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none sm:w-fit sm:px-4 dark:border-gray-700 dark:bg-[#23272f] dark:text-gray-100"
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
                <Send className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </Button>
        </form>
      </CardFooter>
      {error && <div className="px-6 pb-2 text-sm text-red-600">{error}</div>}
    </Card>
  );
}
