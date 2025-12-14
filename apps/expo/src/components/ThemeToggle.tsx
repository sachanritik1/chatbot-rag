import { TouchableOpacity, Text, StyleSheet } from "react-native";

import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        resolvedTheme === "dark" ? styles.buttonDark : styles.buttonLight,
      ]}
      onPress={toggleTheme}
    >
      <Text
        style={[
          styles.text,
          resolvedTheme === "dark" ? styles.textDark : styles.textLight,
        ]}
      >
        {resolvedTheme === "dark" ? "🌙 Dark" : "☀️ Light"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonLight: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  buttonDark: {
    backgroundColor: "#374151",
    borderColor: "#4b5563",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  textLight: {
    color: "#374151",
  },
  textDark: {
    color: "#f3f4f6",
  },
});
