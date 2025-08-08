export const ALLOWED_MODEL_IDS = [
  //   "gpt-5-mini",
  "gpt-4o",
  "gpt-4o-mini",
] as const;

export type ModelId = (typeof ALLOWED_MODEL_IDS)[number];

export type SupportedProvider = "openai"; // extend later: "anthropic" | "google"

export type ModelConfig = {
  id: ModelId;
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
};

export const DEFAULT_MODEL_ID: ModelId = "gpt-4o-mini";

const REGISTRY: Record<ModelId, ModelConfig> = {
  //   "gpt-5-mini": {
  //     id: "gpt-5-mini",
  //     label: "GPT-5 Mini",
  //     provider: "openai",
  //     modelName: "gpt-5-mini",
  //     supports: {
  //       temperature: false, // per error log, this model ignores temperature
  //       streaming: true,
  //     },
  //   },
  "gpt-4o": {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    modelName: "gpt-4o",
    supports: {
      temperature: true,
      streaming: true,
    },
    defaultParams: { temperature: 0.2 },
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    modelName: "gpt-4o-mini",
    supports: {
      temperature: true,
      streaming: true,
    },
    defaultParams: { temperature: 0.2 },
  },
};

export function getModelConfig(modelId?: string | null): ModelConfig {
  const id = (modelId as ModelId) || DEFAULT_MODEL_ID;
  return REGISTRY[id] ?? REGISTRY[DEFAULT_MODEL_ID];
}

export const MODEL_OPTIONS = (Object.values(REGISTRY) as ModelConfig[]).map(
  (cfg) => ({ value: cfg.id, label: cfg.label }),
);
