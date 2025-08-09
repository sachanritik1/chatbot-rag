"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

type ChatHeaderProps = {
  title?: string;
};

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <div className="mb-2 flex max-w-[100dvh-8rem] items-center justify-between gap-3 sm:max-w-[100dvw-20rem]">
      <SidebarTrigger />
      {title ? (
        <h1 className="truncate text-lg font-semibold" title={title}>
          {title}
        </h1>
      ) : null}

      <ThemeToggle />
    </div>
  );
}
