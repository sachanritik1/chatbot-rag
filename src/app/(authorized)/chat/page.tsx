import { Metadata } from "next";
import ChatPage from "./chat";

export const metadata: Metadata = {
  title: "Create a new conversation",
  description: "Chat with LLMs",
};

const Page = async () => {
  return <ChatPage title="Create a new conversation" />;
};

export default Page;
