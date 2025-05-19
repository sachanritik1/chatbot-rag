import { Metadata } from "next";
import ChatPage from "./Home";

export const metadata: Metadata = {
  title: "AI Chat App",
  description: "Chat with LLMs",
};

const Page = async () => {
  return <ChatPage />;
};

export default Page;
