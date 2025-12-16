import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { ModelId } from "@chatbot-rag/shared";

import { MessageBubble } from "../../components/chat/MessageBubble";
import { TypingIndicator } from "../../components/chat/TypingIndicator";
import { DEFAULT_MODEL_ID, MODEL_OPTIONS } from "../../config/models";
import { useTheme } from "../../contexts/ThemeContext";
import { useChatRN } from "../../hooks/useChatRN";
import { supabase } from "../../lib/supabase";
import { getThemedColors } from "../../lib/theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

export default function Chat() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const colors = getThemedColors(resolvedTheme);
  const { id, branchMessage, branchModel } = useLocalSearchParams();
  const conversationId = id as string | undefined;

  const [inputText, setInputText] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const hasSentBranchMessage = useRef(false);

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

    void getToken();
  }, [router]);

  // Use custom chat hook
  const {
    messages,
    sendMessage,
    handleRetry,
    handleEdit,
    handleBranch,
    loadMoreMessages,
    setMessages,
    status,
    hasMoreMessages,
    isLoadingMore,
  } = useChatRN({
    conversationId,
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to send message");
    },
    onBranchCreated: (branchId, branchData) => {
      // Navigate to the new branch conversation
      // If it's a user message, pass the message data via URL params to auto-send
      if (branchData.isUserMessage && branchData.branchMessage) {
        router.push(
          `/(app)/chat?id=${branchId}&branchMessage=${encodeURIComponent(branchData.branchMessage)}&branchModel=${branchData.modelToUse}`,
        );
      } else {
        router.push(`/(app)/chat?id=${branchId}`);
      }
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
        const displayMessages: Message[] = data.map(
          (chat: {
            id: string;
            sender: string;
            message: string;
            created_at: string;
          }) => ({
            id: chat.id,
            role:
              chat.sender === "user"
                ? ("user" as const)
                : ("assistant" as const),
            content: chat.message,
            timestamp: new Date(chat.created_at),
          }),
        );

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
      void loadMessages();
    }
  }, [conversationId, authToken, setMessages]);

  // Auto-send branch message if this is a branched conversation from a user message
  useEffect(() => {
    async function sendBranchMessage() {
      if (
        branchMessage &&
        branchModel &&
        conversationId &&
        !hasSentBranchMessage.current &&
        !initialLoading &&
        authToken
      ) {
        hasSentBranchMessage.current = true;
        console.log("🌿 Auto-sending branch message:", branchMessage);
        await sendMessage(
          decodeURIComponent(branchMessage as string),
          branchModel as ModelId,
        );
      }
    }

    void sendBranchMessage();
  }, [
    branchMessage,
    branchModel,
    conversationId,
    initialLoading,
    authToken,
    sendMessage,
  ]);

  async function handleSendMessage() {
    if (!inputText.trim() || !authToken) return;

    const userMessage = inputText.trim();
    setInputText("");

    await sendMessage(userMessage, selectedModel);
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    return (
      <MessageBubble
        message={item}
        onCopy={() => {
          // Copy handled by MessageBubble
        }}
        onRetry={(modelId) => handleRetry(index, modelId as ModelId)}
        onEdit={(newContent, modelId) =>
          handleEdit(index, newContent, modelId as ModelId)
        }
        onBranch={
          conversationId
            ? async (model) => {
                await handleBranch(item.id, model);
              }
            : undefined
        }
      />
    );
  }

  function renderListHeader() {
    if (!hasMoreMessages || !conversationId) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMoreMessages}
        disabled={isLoadingMore}
      >
        <Text style={styles.loadMoreButtonText}>
          {isLoadingMore ? "Loading..." : "Load earlier messages"}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderListFooter() {
    if (status === "streaming" || status === "loading") {
      return <TypingIndicator />;
    }
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    messagesList: {
      padding: 16,
    },
    loadMoreButton: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    loadMoreButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 8,
    },
    modelSelector: {
      maxHeight: 48,
      marginBottom: 8,
    },
    modelSelectorContent: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 2,
    },
    modelButton: {
      minWidth: 120,
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      backgroundColor: colors.background,
    },
    modelButtonActive: {
      backgroundColor: resolvedTheme === "dark" ? "#1e3a8a" : "#eff6ff",
      borderColor: colors.primary,
    },
    modelButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    modelButtonTextActive: {
      color: colors.primary,
    },
    inputRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-end",
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      maxHeight: 100,
      color: colors.text,
    },
    sendButton: {
      backgroundColor: colors.primary,
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

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.modelSelector}
          contentContainerStyle={styles.modelSelectorContent}
        >
          {MODEL_OPTIONS.map((model) => (
            <TouchableOpacity
              key={model.value}
              style={[
                styles.modelButton,
                selectedModel === model.value && styles.modelButtonActive,
              ]}
              onPress={() => setSelectedModel(model.value)}
            >
              <Text
                style={[
                  styles.modelButtonText,
                  selectedModel === model.value && styles.modelButtonTextActive,
                ]}
              >
                {model.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
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
