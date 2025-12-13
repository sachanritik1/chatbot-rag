import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@chatbot-rag/eslint-config/base";
import { nextjsConfig } from "@chatbot-rag/eslint-config/nextjs";
import { reactConfig } from "@chatbot-rag/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
