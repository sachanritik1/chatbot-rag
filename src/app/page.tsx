import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquareText, ShieldCheck, Zap, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Chat App",
  description: "Chat with LLMs — try as a guest or sign in",
};

export default function LandingPage() {
  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-16 sm:px-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-400/40 via-blue-300/10 to-transparent blur-3xl dark:from-blue-600/30 dark:via-blue-500/10" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-violet-400/30 via-violet-300/10 to-transparent blur-3xl dark:from-violet-600/30 dark:via-violet-500/10" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-2">
        {/* Hero copy */}
        <div className="order-2 text-center md:order-1 md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur dark:bg-white/10 dark:text-gray-200">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            Streaming answers in real time
          </span>
          <h1 className="mt-4 bg-gradient-to-b from-black to-gray-700 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl dark:from-white dark:to-gray-300">
            Your AI chat companion
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg dark:text-gray-300">
            Ask questions, get answers, and explore documents with LLMs. No
            account required to try — guests get 10 messages/day.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 md:justify-start md:text-left">
            <Button asChild size="lg" className="px-6 py-5">
              <Link href="/guest">Chat as Guest</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-6 py-5">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          {/* Feature bullets */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-left sm:grid-cols-4 md:mt-10">
            <div className="rounded-xl border border-gray-200/60 bg-white/60 p-4 backdrop-blur dark:border-gray-700/60 dark:bg-white/5">
              <MessageSquareText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                Natural chat
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                Conversational answers, not snippets
              </p>
            </div>
            <div className="rounded-xl border border-gray-200/60 bg-white/60 p-4 backdrop-blur dark:border-gray-700/60 dark:bg-white/5">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                RAG-ready
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                Augment with your PDFs and notes
              </p>
            </div>
            <div className="rounded-xl border border-gray-200/60 bg-white/60 p-4 backdrop-blur dark:border-gray-700/60 dark:bg-white/5">
              <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                Fast streaming
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                See responses token-by-token
              </p>
            </div>
            <div className="rounded-xl border border-gray-200/60 bg-white/60 p-4 backdrop-blur dark:border-gray-700/60 dark:bg-white/5">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                Private by default
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                Your chats stay in your account
              </p>
            </div>
          </div>
        </div>

        {/* Preview card */}
        <div className="order-1 md:order-2">
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-500/30 via-violet-500/20 to-emerald-400/20 blur-2xl" />
            <div className="relative rounded-2xl border border-white/40 bg-white/70 p-5 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="space-y-3 text-left">
                <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900 dark:bg-gray-800/80 dark:text-gray-100">
                  How do I summarize a PDF with citations?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white dark:bg-blue-500">
                  I can read your document, extract key points, and include
                  citation markers. Upload a PDF and ask anything!
                </div>
                <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900 dark:bg-gray-800/80 dark:text-gray-100">
                  Can I try without signing in?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white dark:bg-blue-500">
                  Yes — use the Guest Chat to send up to 10 messages per day.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
