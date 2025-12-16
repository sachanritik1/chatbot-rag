import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import type { ModelId } from "@chatbot-rag/shared";

import { MODEL_OPTIONS } from "../../config/models";
import { BranchButton } from "./BranchButton";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

interface MessageActionsProps {
  message: Message;
  onCopy: () => void;
  onRetry: (modelId: string) => void;
  onEdit: (newContent: string, modelId: string) => void;
  onBranch?: (model: ModelId) => Promise<void>;
}

export function MessageActions({
  message,
  onCopy,
  onRetry,
  onEdit,
  onBranch,
}: MessageActionsProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionType, setActionType] = useState<"retry" | "edit" | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(message.content);
      onCopy();
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    } catch (error) {
      console.error("Clipboard copy error:", error);
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const handleRetryPress = () => {
    setActionType("retry");
    setShowModelSelector(true);
  };

  const handleEditPress = () => {
    setEditedContent(message.content);
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (!editedContent.trim()) {
      Alert.alert("Error", "Message cannot be empty");
      return;
    }
    setShowEditModal(false);
    setActionType("edit");
    setShowModelSelector(true);
  };

  const handleModelSelect = (modelId: ModelId) => {
    setShowModelSelector(false);

    if (actionType === "retry") {
      onRetry(modelId);
    } else if (actionType === "edit") {
      onEdit(editedContent.trim(), modelId);
    }

    setActionType(null);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleCopy} style={styles.button}>
          <Ionicons
            name={copiedFeedback ? "checkmark" : "copy-outline"}
            size={18}
            color="#6b7280"
          />
        </TouchableOpacity>

        {message.role === "user" && (
          <TouchableOpacity onPress={handleEditPress} style={styles.button}>
            <Ionicons name="pencil-outline" size={18} color="#6b7280" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleRetryPress} style={styles.button}>
          <Ionicons name="refresh-outline" size={18} color="#6b7280" />
        </TouchableOpacity>

        {onBranch && <BranchButton onBranch={onBranch} />}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Message</Text>

            <TextInput
              style={styles.editInput}
              value={editedContent}
              onChangeText={setEditedContent}
              multiline
              placeholder="Enter your message..."
              placeholderTextColor="#9ca3af"
              autoFocus
            />

            <View style={styles.editButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEditSubmit}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Model Selector Modal */}
      <Modal
        visible={showModelSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select Model to {actionType === "retry" ? "Retry" : "Edit"} with
            </Text>

            <ScrollView style={styles.modelList}>
              {MODEL_OPTIONS.map((model) => (
                <TouchableOpacity
                  key={model.value}
                  style={styles.modelOption}
                  onPress={() => handleModelSelect(model.value)}
                >
                  <Text style={styles.modelLabel}>{model.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModelSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
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
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111827",
  },
  modelList: {
    maxHeight: 300,
  },
  modelOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modelLabel: {
    fontSize: 16,
    color: "#111827",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  editInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    minHeight: 120,
    maxHeight: 300,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
