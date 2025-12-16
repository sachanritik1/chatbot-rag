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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import type { Conversation } from "@chatbot-rag/shared";

import type { SortOption } from "../../components/conversations/ConversationFilters";
import { ConversationCard } from "../../components/conversations/ConversationCard";
import { ConversationFilters } from "../../components/conversations/ConversationFilters";
import { SearchBar } from "../../components/conversations/SearchBar";
import { useTheme } from "../../contexts/ThemeContext";
import { conversationsApi } from "../../lib/api";
import { supabase } from "../../lib/supabase";
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
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingsIcon: {
      fontSize: 20,
      color: colors.text,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
      backgroundColor: colors.surface,
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultCount: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    fabText: {
      fontSize: 28,
      color: "#fff",
      fontWeight: "300",
    },
    list: {
      paddingTop: 8,
      paddingBottom: 96,
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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Chats</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push("/(app)/settings")}
            >
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
          </View>

          {conversations.length > 0 && (
            <>
              <View style={styles.searchContainer}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                />
              </View>
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
        </View>

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

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/(app)/chat")}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
