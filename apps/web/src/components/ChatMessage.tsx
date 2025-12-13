import { useState } from "react";
import { User, Bot, X, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";
import { MessageActions } from "./MessageActions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { DEFAULT_MODEL_ID } from "@/config/models";
import type { ModelId } from "@/config/models";

interface ChatMessageProps {
  role: "user" | "bot";
  content: string;
  timestamp?: Date;
  isLatest?: boolean;
  messageId?: string;
  conversationId?: string;
  model?: ModelId;
  onRetry?: (model: ModelId) => void;
  onEdit?: (newContent: string, model: ModelId) => void;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isLatest,
  messageId,
  conversationId,
  model,
  onRetry,
  onEdit,
}: ChatMessageProps) {
  const isUser = role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  // Get model display name
  const getModelDisplay = (modelName?: string | null) => {
    return modelName;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(content);
  };

  const handleSave = () => {
    if (onEdit && editedContent.trim() && editedContent !== content) {
      // Use the model from the message, or default to gpt-4o
      const validModel = model ?? DEFAULT_MODEL_ID;
      onEdit(editedContent, validModel);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(content);
  };

  return (
    <div
      className={cn(
        "animate-in fade-in-0 group relative flex w-full",
        isUser ? "justify-end" : "justify-start",
        isLatest && "slide-in-from-bottom-5",
      )}
    >
      <div
        className={cn(
          "flex gap-3 sm:max-w-[80%]",
          isUser ? "flex-col items-end" : "flex-col items-start",
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

        <div className="flex w-full flex-col gap-1">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 shadow-sm",
              isUser
                ? "rounded-br-sm bg-blue-600 text-white"
                : "rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100",
            )}
          >
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[100px] border-gray-300 bg-white text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-gray-100"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    className="h-7 px-2"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="h-7 bg-blue-600 px-2 hover:bg-blue-700"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            ) : isUser ? (
              <div className="text-sm whitespace-pre-line">{content}</div>
            ) : (
              <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { children, className, ...rest } = props;
                      const match = /language-(\w+)/.exec(className ?? "");

                      if (
                        match &&
                        children &&
                        typeof children === "string" &&
                        match[1]
                      ) {
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

          <div className="flex items-center gap-2">
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
                })}
              </div>
            )}
            {!isUser && model && (
              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                • {getModelDisplay(model)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message actions - visible on hover (desktop) and always visible on mobile, hide when editing */}
      {!isEditing && (
        <div
          className={cn(
            "absolute top-0 transition-opacity",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            isUser ? "right-10" : "left-10",
          )}
        >
          <MessageActions
            role={role}
            content={content}
            messageId={messageId}
            conversationId={conversationId}
            currentModel={model}
            onRetry={onRetry}
            onEdit={handleEdit}
          />
        </div>
      )}
    </div>
  );
}
