"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatHeader() {
  return (
    <div className="mb-2 flex items-center justify-between">
      <SidebarTrigger />
      <ThemeToggle />
    </div>
  );
}
