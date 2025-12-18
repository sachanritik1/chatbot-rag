import { defineConfig } from "eslint/config";

import { baseConfig } from "@chatbot-rag/eslint-config/base";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
);
