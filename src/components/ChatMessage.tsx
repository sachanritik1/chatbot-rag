import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";

type ChatMessageProps = {
  role: "user" | "bot";
  content: string;
  timestamp?: Date;
  isLatest?: boolean;
};

export function ChatMessage({
  role,
  content,
  timestamp,
  isLatest,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "animate-in fade-in-0 flex w-full",
        isUser ? "justify-end" : "justify-start",
        isLatest && "slide-in-from-bottom-5",
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full select-none",
            isUser ? "bg-blue-600" : "bg-zinc-800 dark:bg-zinc-700",
          )}
        >
          {isUser ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <Bot className="h-5 w-5 text-white" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 shadow-sm",
              isUser
                ? "rounded-br-sm bg-blue-600 text-white"
                : "rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100",
            )}
          >
            {isUser ? (
              <div className="text-sm whitespace-pre-line">{content}</div>
            ) : (
              <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { children, className, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || "");

                      if (match && children && typeof children === "string") {
                        return (
                          <CodeBlock
                            key={Math.random()}
                            language={match[1]}
                            value={children.trim()}
                          />
                        );
                      }

                      return (
                        <code className={className} {...rest}>
                          {children}
                        </code>
                      );
                    },
                    ul(props) {
                      const { children, ...rest } = props;
                      return (
                        <ul
                          className="mt-1 mb-4 list-disc space-y-1 pl-6 text-gray-800 dark:text-gray-200"
                          {...rest}
                        >
                          {children}
                        </ul>
                      );
                    },
                    ol(props) {
                      const { children, ...rest } = props;
                      return (
                        <ol
                          className="mt-1 mb-4 list-decimal space-y-1 pl-6 text-gray-800 dark:text-gray-200"
                          {...rest}
                        >
                          {children}
                        </ol>
                      );
                    },
                    li(props) {
                      const { children, ...rest } = props;
                      return (
                        <li
                          className="pl-1 marker:text-gray-500 dark:marker:text-gray-400"
                          {...rest}
                        >
                          {children}
                        </li>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {timestamp && (
            <div
              className={cn(
                "text-xs text-gray-500 dark:text-gray-400",
                isUser ? "mr-2 text-right" : "ml-2 text-left",
              )}
              suppressHydrationWarning
            >
              {timestamp.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "UTC",
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
