"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GitBranch, Loader2 } from "lucide-react";
import { createBranch } from "@/actions/branches";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BranchButtonProps {
  conversationId: string;
  messageId: string;
  className?: string;
}

export function BranchButton({
  conversationId,
  messageId,
  className,
}: BranchButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBranch = async () => {
    setIsLoading(true);
    try {
      const result = await createBranch({ conversationId, messageId });
    } catch (error) {
      console.error("Error creating branch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBranch}
            disabled={isLoading}
            className={className}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitBranch className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create branch from this message</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
