import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar";
import ThemeToggleWrapper from "./ThemeToggleWrapper";
import { LogIn, UserPlus, MessageSquare } from "lucide-react";

export default function GuestSideBar() {
  return (
    <Sidebar className="border-border/40 border-r">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary h-5 w-5" />
          <h2 className="text-lg font-semibold tracking-tight">Hello There</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={{ pathname: "/login", query: { mode: "signup" } }}>
              <UserPlus className="h-4 w-4" />
              Sign up
            </Link>
          </Button>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-border/40 border-t p-4">
        <div className="flex w-full items-center justify-end">
          <ThemeToggleWrapper />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
