import { View, Text, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import type { ModelId } from "@chatbot-rag/shared";

import { MessageActions } from "./MessageActions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

interface MessageBubbleProps {
  message: Message;
  onCopy: () => void;
  onRetry: (modelId: string) => void;
  onEdit: (newContent: string, modelId: string) => void;
  onBranch?: (model: ModelId) => Promise<void>;
}

export function MessageBubble({
  message,
  onCopy,
  onRetry,
  onEdit,
  onBranch,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
      >
        <Markdown
          style={{
            body: isUser ? styles.userText : styles.assistantText,
            code_inline: styles.codeInline,
            code_block: styles.codeBlock,
            fence: styles.codeBlock,
            heading1: styles.heading,
            heading2: styles.heading,
            heading3: styles.heading,
            link: styles.link,
            blockquote: styles.blockquote,
            list_item: styles.listItem,
          }}
        >
          {message.content}
        </Markdown>

        {message.model && !isUser && (
          <Text style={styles.modelBadge}>{message.model}</Text>
        )}
      </View>

      <MessageActions
        message={message}
        onCopy={onCopy}
        onRetry={onRetry}
        onEdit={onEdit}
        onBranch={onBranch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "80%",
    marginVertical: 8,
  },
  userContainer: {
    alignSelf: "flex-end",
  },
  assistantContainer: {
    alignSelf: "flex-start",
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#f3f4f6",
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
  },
  assistantText: {
    color: "#111827",
    fontSize: 16,
    lineHeight: 22,
  },
  codeInline: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: "monospace",
  },
  codeBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: 12,
    borderRadius: 8,
    fontFamily: "monospace",
    fontSize: 14,
  },
  heading: {
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  link: {
    color: "#2563eb",
    textDecorationLine: "underline",
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#d1d5db",
    paddingLeft: 12,
    fontStyle: "italic",
  },
  listItem: {
    marginLeft: 16,
  },
  modelBadge: {
    marginTop: 8,
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
});
