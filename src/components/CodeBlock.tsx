import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 overflow-hidden rounded-md border bg-zinc-950 dark:bg-black">
      <div className="flex w-full items-center justify-between bg-zinc-800 px-4 py-1.5 text-xs text-zinc-100">
        <span>{language}</span>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-zinc-300 hover:text-zinc-100"
          onClick={onCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code
          className={cn(
            "text-sm text-white",
            language && `language-${language}`,
          )}
        >
          {value}
        </code>
      </pre>
    </div>
  );
}
