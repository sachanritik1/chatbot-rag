"use client";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const NewConversationButton = () => {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      title="New Conversation"
      className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 gap-1"
      onClick={() => router.push("/chat")}
    >
      <Plus className="h-4 w-4" />
      <span>New</span>
    </Button>
  );
};

export default NewConversationButton;
