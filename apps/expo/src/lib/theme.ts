type ResolvedTheme = "light" | "dark";

export const colors = {
  light: {
    background: "#f9fafb",
    surface: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    primary: "#2563eb",
    danger: "#dc2626",
    dangerBg: "#fef2f2",
    dangerBorder: "#fecaca",
  },
  dark: {
    background: "#111827",
    surface: "#1f2937",
    text: "#f9fafb",
    textSecondary: "#9ca3af",
    border: "#374151",
    primary: "#3b82f6",
    danger: "#ef4444",
    dangerBg: "#1f2937",
    dangerBorder: "#374151",
  },
};

export function getThemedColors(theme: ResolvedTheme) {
  return colors[theme];
}
