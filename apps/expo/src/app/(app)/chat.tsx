import type { ModelId } from "@chatbot-rag/shared";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useChatRN } from "../../hooks/useChatRN";
import { supabase } from "../../lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export default function Chat() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const conversationId = id as string | undefined;

  const [inputText, setInputText] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("gpt-4o-mini");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Get auth token on mount
  useEffect(() => {
    async function getToken() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/(auth)/login");
        return;
      }

      setAuthToken(session.access_token);
    }

    getToken();
  }, [router]);

  // Use custom chat hook
  const { messages, sendMessage, setMessages, status } = useChatRN({
    conversationId,
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to send message");
    },
  });

  const isLoading = status === "loading" || status === "streaming";

  // Load messages from database on mount
  useEffect(() => {
    async function loadMessages() {
      if (!conversationId) return;

      setInitialLoading(true);
      try {
        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Convert DB messages to display format
        const displayMessages: Message[] = data.map((chat) => ({
          id: chat.id,
          role:
            chat.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: chat.message,
          timestamp: new Date(chat?.created_at),
        }));

        setMessages(displayMessages);
      } catch (error: unknown) {
        if (error instanceof Error) {
          Alert.alert("Error", error.message);
        }
        console.error("Error loading messages:", error);
      } finally {
        setInitialLoading(false);
      }
    }

    if (conversationId && authToken) {
      loadMessages();
    }
  }, [conversationId, authToken, setMessages]);

  async function handleSendMessage() {
    if (!inputText.trim() || !authToken) return;

    const userMessage = inputText.trim();
    setInputText("");

    await sendMessage(userMessage, selectedModel);
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.assistantMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputContainer}>
        <View style={styles.modelSelector}>
          <TouchableOpacity
            style={[
              styles.modelButton,
              selectedModel === "gpt-4o" && styles.modelButtonActive,
            ]}
            onPress={() => setSelectedModel("gpt-4o")}
          >
            <Text
              style={[
                styles.modelButtonText,
                selectedModel === "gpt-4o" && styles.modelButtonTextActive,
              ]}
            >
              GPT-4o
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modelButton,
              selectedModel === "gpt-4o-mini" && styles.modelButtonActive,
            ]}
            onPress={() => setSelectedModel("gpt-4o-mini")}
          >
            <Text
              style={[
                styles.modelButtonText,
                selectedModel === "gpt-4o-mini" && styles.modelButtonTextActive,
              ]}
            >
              GPT-4o Mini
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? "..." : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  messagesList: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  userMessageBubble: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  assistantMessageBubble: {
    backgroundColor: "#f3f4f6",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#fff",
  },
  assistantMessageText: {
    color: "#111827",
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 12,
    gap: 8,
  },
  modelSelector: {
    flexDirection: "row",
    gap: 8,
  },
  modelButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  modelButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  modelButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  modelButtonTextActive: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: "#111827",
  },
  sendButton: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
