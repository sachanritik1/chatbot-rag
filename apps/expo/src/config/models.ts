export type SupportedProvider = "openai" | "google";

interface BaseModelConfig {
  id: string;
  label: string;
  provider: SupportedProvider;
  modelName: string; // provider-native name
  supports: {
    temperature: boolean;
    streaming: boolean;
  };
  defaultParams?: {
    temperature?: number;
  };
  default: boolean;
}

const GEMINI_TEXT_MODELS = [
  // ───────────────── Gemini 3 ─────────────────
  {
    id: "gemini-3-pro-preview",
    label: "Gemini 3 Pro (Preview)",
    provider: "google",
    modelName: "gemini-3-pro-preview",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: false,
  },

  // ───────────────── Gemini 2.5 ─────────────────
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    modelName: "gemini-2.5-pro",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: false,
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    modelName: "gemini-2.5-flash",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: true, // ✅ recommended default
  },
  {
    id: "gemini-2.5-flash-preview-09-2025",
    label: "Gemini 2.5 Flash (Preview)",
    provider: "google",
    modelName: "gemini-2.5-flash-preview-09-2025",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: false,
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    provider: "google",
    modelName: "gemini-2.5-flash-lite",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: false,
  },
  {
    id: "gemini-2.5-flash-lite-preview-09-2025",
    label: "Gemini 2.5 Flash-Lite (Preview)",
    provider: "google",
    modelName: "gemini-2.5-flash-lite-preview-09-2025",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: false,
  },

  // ───────────────── Gemini 2.0 (legacy) ─────────────────
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google",
    modelName: "gemini-2.0-flash",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: false,
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash-Lite",
    provider: "google",
    modelName: "gemini-2.0-flash-lite",
    supports: {
      temperature: true,
      streaming: true,
    },
    default: false,
  },
] as const;

const REGISTRY = [...GEMINI_TEXT_MODELS] as const satisfies readonly BaseModelConfig[];

export type ModelId = (typeof REGISTRY)[number]["id"];

export type ModelConfig = Omit<BaseModelConfig, "id"> & { id: ModelId };

const nonEmptyTuple = <T extends readonly [string, ...string[]]>(
  values: T,
): T => values;

export const ALLOWED_MODEL_IDS = nonEmptyTuple(
  REGISTRY.map((cfg) => cfg.id) as [ModelId, ...ModelId[]],
);

export const DEFAULT_MODEL_ID =
  REGISTRY.find((cfg) => cfg.default)?.id ?? REGISTRY[0].id;

export function getModelConfig(modelId?: ModelId): ModelConfig {
  const id = modelId ?? DEFAULT_MODEL_ID;
  const cfg = REGISTRY.find((m) => m.id === id);
  if (!cfg) {
    throw new Error(`Model with id "${id}" not found in registry.`);
  }
  return cfg;
}

export const MODEL_OPTIONS = REGISTRY.map((cfg) => ({
  label: cfg.label,
  value: cfg.id,
}));
