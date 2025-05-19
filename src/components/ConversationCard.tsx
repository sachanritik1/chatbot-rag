"use client";

import { useParams, useRouter } from "next/navigation";
import { Card } from "./ui/card";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

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
      className={`cursor-pointer gap-1 p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 ${
        currentConversationId === conversation.id
          ? "border-blue-300 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30"
          : "bg-white dark:bg-[#23272f]"
      }`}
      onClick={() => router.push(`/chat/${conversation.id}`)}
    >
      <div className="truncate font-medium">{conversation.title}</div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {formatDate(conversation.created_at)}
      </div>
    </Card>
  );
};

export default ConversationCard;
