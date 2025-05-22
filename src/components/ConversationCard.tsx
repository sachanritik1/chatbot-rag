"use client";

import { useParams, useRouter } from "next/navigation";
import { Card } from "./ui/card";

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
      <div className="flex flex-col gap-1">
        <div className="line-clamp-2 text-sm leading-tight font-medium">
          {conversation.title}
        </div>
        {/* <div className="text-muted-foreground flex items-center text-xs">
          <span>{formatDate(conversation.created_at)}</span>
        </div> */}
      </div>
      <div
        className={`absolute inset-y-0 right-0 w-1 ${currentConversationId === conversation.id ? "bg-primary/40" : "group-hover:bg-primary/20 bg-transparent"}`}
      />
    </Card>
  );
};

export default ConversationCard;
