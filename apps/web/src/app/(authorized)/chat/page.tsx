import { Metadata } from "next";
import ChatPage from "./chat";
import ChatHeader from "@/components/ChatHeader";

export const metadata: Metadata = {
  title: "Create a new conversation",
  description: "Chat with LLMs",
};

const Page = async () => {
  return (
    <>
      <ChatHeader title="Create a new conversation" />
      <ChatPage initialHasMore={false} />
    </>
  );
};

export default Page;
