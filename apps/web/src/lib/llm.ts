import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { DEFAULT_MODEL_ID, getModelConfig } from "@/config/models";
import type { ModelId } from "@/config/models";

export interface LlmFactoryParams {
  model?: ModelId;
}

export function createModelInstance(modelId?: ModelId) {
  const cfg = getModelConfig(modelId);
  let modelInstance;
  switch (cfg.provider) {
    case "openai":
      modelInstance = openai(cfg.modelName);
      break;
    case "google":
      modelInstance = google(cfg.modelName);
      break;
    default:
      throw new Error(`Unsupported model provider for model: ${cfg.modelName}`);
  }
  return { modelInstance, cfg };
}

export function createChatLlm({
  model = DEFAULT_MODEL_ID,
}: LlmFactoryParams = {}) {
  const { modelInstance, cfg } = createModelInstance(model);
  return {
    async invoke(prompt: string) {
      const result = streamText({
        model: modelInstance,
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

export async function generateTitle(query: string) {
  const llm = createChatLlm({ model: DEFAULT_MODEL_ID });
  const conversationTitlePrompt = `
          Generate a title for a new conversation based on the following question in 4 to 5 words only: "${query}"
        `;
  const { text } = await llm.invoke(conversationTitlePrompt);
  return text;
}
