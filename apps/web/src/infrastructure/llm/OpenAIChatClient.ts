import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { LlmClient } from "@/domain/chat/types";
import { getModelConfig } from "@/config/models";

export class OpenAIChatClient implements LlmClient {
  private readonly modelName: string;
  private readonly temperature?: number;

  constructor(modelId?: string | null) {
    const cfg = getModelConfig(modelId);
    this.modelName = cfg.modelName;
    this.temperature = cfg.supports.temperature
      ? cfg.defaultParams?.temperature
      : undefined;
  }

  async stream(prompt: string) {
    return streamText({
      model: openai(this.modelName),
      prompt,
      temperature: this.temperature,
    });
  }
}
