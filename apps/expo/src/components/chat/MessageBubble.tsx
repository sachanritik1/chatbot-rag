import { View, Text, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import type { ModelId } from "@chatbot-rag/shared";

import { useTheme } from "../../contexts/ThemeContext";
import { getThemedColors } from "../../lib/theme";
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
  const { resolvedTheme } = useTheme();
  const colors = getThemedColors(resolvedTheme);
  const isUser = message.role === "user";

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
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userText: {
      color: "#ffffff",
      fontSize: 16,
      lineHeight: 22,
    },
    assistantText: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
    },
    codeInline: {
      backgroundColor: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      color: colors.text,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: "monospace",
    },
    codeBlock: {
      backgroundColor: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      fontFamily: "monospace",
      fontSize: 14,
    },
    heading: {
      color: colors.text,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 4,
    },
    link: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.border,
      paddingLeft: 12,
      fontStyle: "italic",
      color: colors.textSecondary,
    },
    listItem: {
      marginLeft: 16,
      color: colors.text,
    },
    modelBadge: {
      marginTop: 8,
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "500",
    },
  });

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
