import type { Metadata } from "next";
import AppSideBar from "@/components/AppSideBar";
import ChatHeader from "@/components/ChatHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "AI Chat App",
  description: "Chat with LLMs",
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSideBar />
      <main className="h-[100svh] w-screen flex-1 space-y-2 p-4 sm:h-screen">
        {/* Title will be passed by each page via props on ChatHeader inside page components */}
        {children}
      </main>
    </SidebarProvider>
  );
}
