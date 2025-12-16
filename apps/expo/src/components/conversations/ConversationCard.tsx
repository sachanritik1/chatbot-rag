import { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { Conversation } from "@chatbot-rag/shared";

import { useTheme } from "../../contexts/ThemeContext";
import { conversationsApi } from "../../lib/api";
import { getThemedColors } from "../../lib/theme";

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
  onDelete: () => void;
  isActive?: boolean;
}

export function ConversationCard({
  conversation,
  onPress,
  onDelete,
  isActive = false,
}: ConversationCardProps) {
  const { resolvedTheme } = useTheme();
  const colors = getThemedColors(resolvedTheme);
  const [showActions, setShowActions] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleLongPress = () => {
    setShowActions(true);
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onPress: async () => {
            try {
              await conversationsApi.delete(conversation.id);
              onDelete();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete conversation",
              );
            }
          },
        },
      ],
    );
  };

  const handleRename = () => {
    setShowActions(false);
    setNewTitle(conversation.title);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Title cannot be empty");
      return;
    }

    setIsRenaming(true);
    try {
      // Use the first user message or title as query for AI generation
      await conversationsApi.updateTitle(conversation.id, newTitle);
      setShowRenameModal(false);
      Alert.alert("Success", "Conversation title updated");
      // Trigger parent to refresh
      onDelete(); // Reuse delete callback to trigger refresh
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to rename conversation",
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    activeContainer: {
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
      lineHeight: 22,
    },
    date: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    branchBadge: {
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: colors.background,
      borderRadius: 4,
      alignSelf: "flex-start",
    },
    branchText: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: "500",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    actionSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    actionButton: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionButtonText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
    },
    deleteButton: {
      borderBottomWidth: 0,
    },
    deleteButtonText: {
      color: colors.danger,
    },
    cancelButton: {
      marginTop: 12,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
      textAlign: "center",
    },
    renameModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      padding: 20,
    },
    renameModalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
    },
    renameTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    renameInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
    },
    renameButtons: {
      flexDirection: "row",
      gap: 12,
    },
    renameButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    renameCancelButton: {
      backgroundColor: colors.background,
    },
    renameCancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    renameSaveButton: {
      backgroundColor: colors.primary,
    },
    renameSaveButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.surface,
    },
  });

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        style={[styles.container, isActive && styles.activeContainer]}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {conversation.title}
          </Text>
          <Text style={styles.date}>{formatDate(conversation.created_at)}</Text>
          {conversation.branch_label && (
            <View style={styles.branchBadge}>
              <Text style={styles.branchText}>{conversation.branch_label}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Sheet Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.actionSheet}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRename}
            >
              <Text style={styles.actionButtonText}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Delete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowActions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.renameModalOverlay}>
          <View style={styles.renameModalContent}>
            <Text style={styles.renameTitle}>Rename Conversation</Text>

            <TextInput
              style={styles.renameInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              editable={!isRenaming}
            />

            <View style={styles.renameButtons}>
              <TouchableOpacity
                style={[styles.renameButton, styles.renameCancelButton]}
                onPress={() => setShowRenameModal(false)}
                disabled={isRenaming}
              >
                <Text style={styles.renameCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.renameButton, styles.renameSaveButton]}
                onPress={handleRenameSubmit}
                disabled={isRenaming}
              >
                <Text style={styles.renameSaveButtonText}>
                  {isRenaming ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
