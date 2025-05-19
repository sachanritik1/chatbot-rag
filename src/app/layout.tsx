import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chat App",
  description: "Chat with LLMs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] transition-colors duration-300 dark:from-[#18181b] dark:to-[#23272f]">
        {children}
      </body>
    </html>
  );
}
