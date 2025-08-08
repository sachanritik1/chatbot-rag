import { ChatOpenAI } from "@langchain/openai";
import { getModelConfig, type ModelId } from "@/config/models";

export type LlmFactoryParams = {
  model?: string | null;
};

export function createChatLlm({ model }: LlmFactoryParams = {}) {
  const cfg = getModelConfig(model);

  switch (cfg.provider) {
    case "openai": {
      const params: Record<string, unknown> = { model: cfg.modelName };
      if (
        cfg.supports.temperature &&
        cfg.defaultParams?.temperature !== undefined
      ) {
        params.temperature = cfg.defaultParams.temperature;
      }
      return new ChatOpenAI(params as { model: string; temperature?: number });
    }
    default: {
      // Fallback to OpenAI default for unknown provider
      return new ChatOpenAI({ model: cfg.modelName });
    }
  }
}
