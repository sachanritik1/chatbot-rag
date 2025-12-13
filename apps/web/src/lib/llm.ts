import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getModelConfig } from "@/config/models";

export interface LlmFactoryParams {
  model?: string | null;
}

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

export async function generateTitle(query: string) {
  const llm = createChatLlm({ model: "gpt-4o-mini" });
  const conversationTitlePrompt = `
          Generate a title for a new conversation based on the following question in 4 to 5 words only: "${query}"
        `;
  const { text } = await llm.invoke(conversationTitlePrompt);
  return text;
}
