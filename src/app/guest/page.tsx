import { Metadata } from "next";
import ChatHeader from "@/components/ChatHeader";
import GuestChatPage from "./view";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Guest Chat",
  description: "Chat with LLMs without signing in (10 messages/day)",
};

export default async function Page() {
  return (
    <SidebarProvider>
      <main className="h-[100svh] w-screen flex-1 space-y-2 p-4 sm:h-screen">
        <ChatHeader title="Guest Chat (10 messages/day)" />
        <GuestChatPage />
      </main>
    </SidebarProvider>
  );
}
