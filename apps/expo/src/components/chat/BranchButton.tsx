import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { ModelId } from "@chatbot-rag/shared";

import { MODEL_OPTIONS } from "../../config/models";

interface BranchButtonProps {
  onBranch: (model: ModelId) => Promise<void>;
}

export function BranchButton({ onBranch }: BranchButtonProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleBranch = async (model: ModelId) => {
    setIsCreating(true);
    try {
      await onBranch(model);
      setShowModelSelector(false);
    } catch (error) {
      Alert.alert("Error", "Failed to create branch");
      console.error("Branch creation error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModelSelector(true)}
        style={styles.branchButton}
      >
        <Text style={styles.branchButtonText}>🌿 Branch</Text>
      </TouchableOpacity>

      <Modal
        visible={showModelSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Model for Branch</Text>
              <TouchableOpacity
                onPress={() => setShowModelSelector(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Create a new conversation branch from this point with a different
              model
            </Text>

            <ScrollView style={styles.modelList}>
              {MODEL_OPTIONS.map((model) => (
                <TouchableOpacity
                  key={model.value}
                  style={styles.modelOption}
                  onPress={() => handleBranch(model.value)}
                  disabled={isCreating}
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      isCreating && styles.modelOptionTextDisabled,
                    ]}
                  >
                    {model.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  branchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
  },
  branchButtonText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#6b7280",
  },
  modalDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  modelList: {
    maxHeight: 400,
  },
  modelOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modelOptionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  modelOptionTextDisabled: {
    color: "#9ca3af",
  },
});
