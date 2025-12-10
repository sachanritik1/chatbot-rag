export type SupportedProvider = "openai"; // extend later: "anthropic" | "google"

type BaseModelConfig = {
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
};

const REGISTRY = {
  // "gpt-5-mini": {
  //   id: "gpt-5-mini",
  //   label: "GPT-5 Mini",
  //   provider: "openai",
  //   modelName: "gpt-5-mini",
  //   supports: {
  //     temperature: false, // per error log, this model ignores temperature
  //     streaming: true,
  //   },
  // },
  "gpt-4o": {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    modelName: "gpt-4o",
    supports: {
      temperature: true,
      streaming: true,
    },
    defaultParams: { temperature: 1 },
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
    defaultParams: { temperature: 1 },
  },
} as const satisfies Record<string, BaseModelConfig>;

export type ModelId = keyof typeof REGISTRY;

export type ModelConfig = Omit<BaseModelConfig, "id"> & { id: ModelId };

export const ALLOWED_MODEL_IDS = Object.keys(REGISTRY) as [
  ModelId,
  ...ModelId[],
];

export const DEFAULT_MODEL_ID: ModelId = "gpt-4o-mini";

export function getModelConfig(modelId?: string | null): ModelConfig {
  const id = (modelId as ModelId) || DEFAULT_MODEL_ID;
  const cfg =
    (REGISTRY as Record<ModelId, BaseModelConfig>)[id] ??
    (REGISTRY as Record<ModelId, BaseModelConfig>)[DEFAULT_MODEL_ID];
  return cfg as ModelConfig;
}

export const MODEL_OPTIONS = (Object.values(REGISTRY) as BaseModelConfig[]).map(
  (cfg) => ({ value: cfg.id as ModelId, label: cfg.label }),
);
