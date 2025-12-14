import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import type { Conversation } from "@chatbot-rag/shared";

import type { SortOption } from "../../components/conversations/ConversationFilters";
import { ConversationCard } from "../../components/conversations/ConversationCard";
import { ConversationFilters } from "../../components/conversations/ConversationFilters";
import { SearchBar } from "../../components/conversations/SearchBar";
import { conversationsApi } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemedColors } from "../../lib/theme";

export default function Conversations() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const colors = getThemedColors(resolvedTheme);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const loadConversations = useCallback(
    async function () {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/(auth)/login");
          return;
        }

        setUserEmail(user.email ?? null);

        // Use API client to list conversations (filters has_messages = true)
        const data = await conversationsApi.list();

        setConversations(data);
      } catch (error: unknown) {
        console.error("Error loading conversations:", error);
        Alert.alert("Error", (error as Error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations, router]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.replace("/(auth)/login");
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadConversations();
  }

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) =>
        conv.title.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [conversations, searchQuery, sortBy]);

  function renderConversation({ item }: { item: Conversation }) {
    return (
      <ConversationCard
        conversation={item}
        onPress={() => router.push(`/(app)/chat?id=${item.id}`)}
        onDelete={() => {
          // Refresh list after delete or rename
          void loadConversations();
        }}
      />
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      padding: 16,
      paddingTop: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    userProfile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      maxWidth: 200,
    },
    userIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    userIconText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
      flex: 1,
    },
    headerButtons: {
      flexDirection: "row",
      gap: 8,
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    resultCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    newChatButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
    },
    newChatButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    signOutButton: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    signOutButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    list: {
      paddingTop: 0,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    emptyStateButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      paddingHorizontal: 32,
    },
    emptyStateButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>AI Chat</Text>
          {userEmail && (
            <TouchableOpacity
              style={styles.userProfile}
              onPress={() => router.push("/(app)/settings")}
            >
              <View style={styles.userIcon}>
                <Text style={styles.userIconText}>
                  {userEmail.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {userEmail}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => router.push("/(app)/chat")}
          >
            <Text style={styles.newChatButtonText}>New Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {conversations.length > 0 && (
        <>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
          <View style={styles.filterContainer}>
            <ConversationFilters sortBy={sortBy} onSortChange={setSortBy} />
            <Text style={styles.resultCount}>
              {filteredConversations.length}{" "}
              {filteredConversations.length === 1
                ? "conversation"
                : "conversations"}
            </Text>
          </View>
        </>
      )}

      {conversations.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No conversations yet</Text>
          <Text style={styles.emptyStateText}>
            Start a new chat to get started
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push("/(app)/chat")}
          >
            <Text style={styles.emptyStateButtonText}>Start Chatting</Text>
          </TouchableOpacity>
        </View>
      ) : filteredConversations.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No results found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
