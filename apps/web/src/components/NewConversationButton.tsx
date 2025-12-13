"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEmptyConversation } from "@/actions/conversations";
import { Button } from "@/components/ui/button";

const NewConversationButton = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewConversation = async () => {
    setIsCreating(true);

    try {
      // Create empty conversation with "Untitled" placeholder
      const result = await createEmptyConversation({
        title: "Untitled",
      });

      if ("error" in result) {
        console.error("Failed to create conversation:", result.error);
        setIsCreating(false);
        return;
      }

      // Navigate to the new empty conversation
      router.push(`/chat/${result.conversationId}`);

      // Reset state after navigation (navigation is async, so button stays mounted briefly)
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      setIsCreating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      title="New Conversation"
      className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 gap-1"
      onClick={handleNewConversation}
      disabled={isCreating}
    >
      <Plus className="h-4 w-4" />
      <span>{isCreating ? "Creating..." : "New"}</span>
    </Button>
  );
};

export default NewConversationButton;
