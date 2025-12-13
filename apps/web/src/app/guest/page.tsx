import type { Metadata } from "next";
import ChatHeader from "@/components/ChatHeader";
import GuestChatPage from "./view";
import { SidebarProvider } from "@/components/ui/sidebar";
import GuestSideBar from "@/components/GuestSideBar";

export const metadata: Metadata = {
  title: "Guest Chat",
  description: "Chat with LLMs without signing in (10 messages/day)",
};

export default async function Page() {
  return (
    <SidebarProvider>
      <GuestSideBar />
      <main className="h-[100svh] w-screen flex-1 space-y-2 p-4 sm:h-screen">
        <ChatHeader title="Chat with LLMs" />
        <GuestChatPage />
      </main>
    </SidebarProvider>
  );
}
