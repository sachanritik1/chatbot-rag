import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { getThemedColors } from "../../lib/theme";

export type SortOption = "newest" | "oldest" | "alphabetical";

interface ConversationFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "alphabetical", label: "Alphabetical" },
];

export function ConversationFilters({
  sortBy,
  onSortChange,
}: ConversationFiltersProps) {
  const { resolvedTheme } = useTheme();
  const colors = getThemedColors(resolvedTheme);
  const [showModal, setShowModal] = useState(false);

  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ?? "Sort";

  const styles = StyleSheet.create({
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    filterIcon: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "50%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.textSecondary,
    },
    optionsList: {
      maxHeight: 300,
    },
    option: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionActive: {
      backgroundColor: resolvedTheme === "dark" ? "#1e3a8a" : "#eff6ff",
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    optionTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    checkmark: {
      fontSize: 18,
      color: colors.primary,
    },
  });

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.filterButtonText}>Sort: {currentLabel}</Text>
        <Text style={styles.filterIcon}>⌄</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Conversations</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    sortBy === option.value && styles.optionActive,
                  ]}
                  onPress={() => {
                    onSortChange(option.value);
                    setShowModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
