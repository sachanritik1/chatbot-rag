import type { Metadata } from "next";
import AppSideBar from "@/components/AppSideBar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "AI Chat App",
  description: "Chat with LLMs",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSideBar />
      <main className="flex-8/12">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
