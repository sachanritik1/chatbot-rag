"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

type ChatHeaderProps = {
  title?: string;
};

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        {title ? (
          <h1 className="truncate text-lg font-semibold" title={title}>
            {title}
          </h1>
        ) : null}
      </div>
      <ThemeToggle />
    </div>
  );
}
