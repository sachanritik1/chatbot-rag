import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ModelId } from "@chatbot-rag/shared";

import { ThemeToggle } from "../../components/ThemeToggle";
import { DEFAULT_MODEL_ID, MODEL_OPTIONS } from "../../config/models";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";
import { getThemedColors } from "../../lib/theme";

const DEFAULT_MODEL_KEY = "@default_model";

export default function Settings() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const colors = getThemedColors(resolvedTheme);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [defaultModel, setDefaultModel] = useState<ModelId>(DEFAULT_MODEL_ID);

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email ?? null);
      }

      // Load saved default model
      const savedModel = await AsyncStorage.getItem(DEFAULT_MODEL_KEY);
      if (savedModel) {
        setDefaultModel(savedModel as ModelId);
      }
    }

    void loadUserData();
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Error", error.message);
          } else {
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  };

  const handleModelChange = async (modelId: ModelId) => {
    setDefaultModel(modelId);
    await AsyncStorage.setItem(DEFAULT_MODEL_KEY, modelId);
    Alert.alert("Success", "Default model updated");
  };

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
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backButton: {
      padding: 4,
    },
    backButtonText: {
      fontSize: 24,
      color: colors.text,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    section: {
      padding: 16,
      paddingBottom: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardRowLast: {
      borderBottomWidth: 0,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    value: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    hint: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: -8,
    },
    dangerButton: {
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.danger,
      textAlign: "center",
    },
    modelCard: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
    },
    modelOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    modelOptionActive: {
      backgroundColor: resolvedTheme === "dark" ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
    },
    modelOptionText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    modelOptionTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    checkmark: {
      fontSize: 18,
      color: colors.primary,
    },
    footer: {
      padding: 32,
      alignItems: "center",
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value} numberOfLines={1}>{userEmail ?? "Not available"}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Text style={styles.label}>Theme</Text>
              <ThemeToggle />
            </View>
          </View>
        </View>

        {/* Model Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Model</Text>
          <View style={styles.modelCard}>
            {MODEL_OPTIONS.map((model, index) => (
              <TouchableOpacity
                key={model.value}
                style={[
                  styles.modelOption,
                  defaultModel === model.value && styles.modelOptionActive,
                ]}
                onPress={() => handleModelChange(model.value)}
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    defaultModel === model.value &&
                      styles.modelOptionTextActive,
                  ]}
                >
                  {model.label}
                </Text>
                {defaultModel === model.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.value}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chatbot RAG • Powered by Gemini</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
