import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import type { LlmClient } from "@chatbot-rag/domain/chat";
import { getModelConfig } from "@/config/models";
import type { ModelId } from "@/config/models";

export class GeminiChatClient implements LlmClient {
  private readonly modelName: string;
  private readonly temperature?: number;

  constructor(modelId?: ModelId) {
    const cfg = getModelConfig(modelId);
    if (cfg.provider !== "google") {
      throw new Error(
        `GeminiChatClient only supports Google models, but got provider: ${cfg.provider}`,
      );
    }
    this.modelName = cfg.modelName;
    this.temperature = cfg.supports.temperature
      ? cfg.defaultParams?.temperature
      : undefined;
  }

  stream(prompt: string) {
    return streamText({
      model: google(this.modelName),
      prompt,
      temperature: this.temperature,
    });
  }
}
