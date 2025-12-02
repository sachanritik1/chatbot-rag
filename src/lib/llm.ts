import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getModelConfig } from "@/config/models";

export type LlmFactoryParams = {
  model?: string | null;
};

export function createChatLlm({ model }: LlmFactoryParams = {}) {
  const cfg = getModelConfig(model);

  return {
    async invoke(prompt: string) {
      const result = await streamText({
        model: openai(cfg.modelName),
        prompt,
        temperature: cfg.supports.temperature
          ? cfg.defaultParams?.temperature
          : undefined,
      });

      let fullText = "";
      for await (const textPart of result.textStream) {
        fullText += textPart;
      }

      return { text: fullText };
    },
  };
}
