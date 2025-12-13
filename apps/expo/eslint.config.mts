import { baseConfig } from "@chatbot-rag/eslint-config/base";
import { reactConfig } from "@chatbot-rag/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
