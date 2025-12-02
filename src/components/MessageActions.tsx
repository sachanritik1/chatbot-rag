"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  RefreshCw,
  Edit,
  GitBranch,
  Check,
  Loader2,
} from "lucide-react";
import { createBranch } from "@/actions/branches";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_MODEL_ID, type ModelId } from "@/config/models";

interface MessageActionsProps {
  role: "user" | "bot";
  content: string;
  messageId?: string;
  conversationId?: string;
  currentModel?: string | null;
  onRetry?: (model: ModelId) => void;
  onEdit?: (model: ModelId) => void;
}

export function MessageActions({
  role,
  content,
  messageId,
  conversationId,
  currentModel,
  onRetry,
  onEdit,
}: MessageActionsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isBranching, setIsBranching] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [actionType, setActionType] = useState<"retry" | "edit" | "branch" | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    (currentModel as ModelId) || DEFAULT_MODEL_ID,
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleBranchClick = () => {
    setActionType("branch");
    setShowModelSelect(true);
  };

  const handleRetryClick = () => {
    if (!onRetry) return;
    setActionType("retry");
    setShowModelSelect(true);
  };

  const handleEditClick = () => {
    if (!onEdit) return;
    setActionType("edit");
    setShowModelSelect(true);
  };

  const executeAction = async () => {
    if (actionType === "retry" && onRetry) {
      onRetry(selectedModel);
    } else if (actionType === "edit" && onEdit) {
      onEdit(selectedModel);
    } else if (actionType === "branch" && messageId && conversationId) {
      setIsBranching(true);
      try {
        await createBranch({
          conversationId,
          messageId,
          selectedModel,
        });
      } catch (error) {
        console.error("Error creating branch:", error);
      } finally {
        setIsBranching(false);
      }
    }
    setShowModelSelect(false);
    setActionType(null);
  };

  if (showModelSelect) {
    return (
      <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-md shadow-lg border border-gray-200 dark:border-zinc-700">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as ModelId)}
          className="text-xs px-2 py-1 border rounded bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-zinc-600"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
        </select>
        <Button
          size="sm"
          onClick={executeAction}
          className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
        >
          Go
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setShowModelSelect(false);
            setActionType(null);
          }}
          className="h-6 px-2 text-xs"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        {/* Copy button - show for all messages */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0"
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isCopied ? "Copied!" : "Copy"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Retry button - show for both user and bot messages */}
        {onRetry && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetryClick}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Retry with model selection</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Edit button - only for user messages */}
        {role === "user" && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="h-7 w-7 p-0"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit with model selection</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Branch button - show for all messages with ID */}
        {messageId && conversationId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBranchClick}
                disabled={isBranching}
                className="h-7 w-7 p-0"
              >
                {isBranching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <GitBranch className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Branch with model selection</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
