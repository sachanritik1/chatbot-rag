"use client";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const NewConversationButton = () => {
  const router = useRouter();
  return (
    <Button
      variant="default"
      title="New Conversation"
      onClick={() => router.push("/chat")}
    >
      New
      <Plus className="h-5 w-5" />
    </Button>
  );
};

export default NewConversationButton;
