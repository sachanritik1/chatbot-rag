import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { LlmClient } from "@chatbot-rag/domain/chat";
import { getModelConfig } from "@/config/models";
import type { ModelId } from "@/config/models";

export class OpenAIChatClient implements LlmClient {
  private readonly modelName: string;
  private readonly temperature?: number;

  constructor(modelId?: ModelId) {
    const cfg = getModelConfig(modelId);
    if (cfg.provider !== "openai") {
      throw new Error(
        `OpenAIChatClient only supports OpenAI models, but got provider: ${cfg.provider}`,
      );
    }
    this.modelName = cfg.modelName;
    this.temperature = cfg.supports.temperature
      ? cfg.defaultParams?.temperature
      : undefined;
  }

  stream(prompt: string) {
    return streamText({
      model: openai(this.modelName),
      prompt,
      temperature: this.temperature,
    });
  }
}
