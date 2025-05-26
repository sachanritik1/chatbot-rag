"use client";

import { deleteConversation } from "@/actions/conversations";
import { useParams, useRouter } from "next/navigation";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

// const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString();
// };

const ConversationCard = ({
  conversation,
}: {
  conversation: { id: string; title: string; created_at: string };
}) => {
  const router = useRouter();
  const params = useParams();
  const currentConversationId = params.conversationId;
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <Card
      key={conversation.id}
      className={`group border-border/50 hover:bg-accent relative cursor-pointer overflow-hidden p-3 transition-all ${
        currentConversationId === conversation.id
          ? "border-primary/30 bg-primary/5 ring-primary/10 shadow-sm ring-1"
          : "hover:shadow-sm"
      }`}
      onClick={() => router.push(`/chat/${conversation.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-1 flex-col gap-1">
          <div className="line-clamp-2 text-sm leading-tight font-medium">
            {conversation.title}
          </div>
          {/* <div className="text-muted-foreground flex items-center text-xs">
            <span>{formatDate(conversation.created_at)}</span>
          </div> */}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-6 w-6 shrink-0 opacity-100 transition-opacity group-hover:opacity-100 sm:opacity-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleting(true);
            deleteConversation({ conversationId: conversation.id })
              .then(() => {
                // If we're on the deleted conversation's page, redirect to root
                if (currentConversationId === conversation.id) {
                  router.push("/chat");
                }
              })
              .finally(() => {
                setIsDeleting(false);
              });
          }}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete conversation</span>
        </Button>
      </div>
      <div
        className={`absolute inset-y-0 right-0 w-1 ${currentConversationId === conversation.id ? "bg-primary/40" : "group-hover:bg-primary/20 bg-transparent"}`}
      />
    </Card>
  );
};

export default ConversationCard;
