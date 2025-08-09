import { ChatOpenAI } from "@langchain/openai";
import type { LlmClient } from "@/domain/chat/types";
import { getModelConfig } from "@/config/models";

export class OpenAIChatClient implements LlmClient {
  private readonly client: ChatOpenAI;

  constructor(modelId?: string | null) {
    const cfg = getModelConfig(modelId);
    const params: Record<string, unknown> = { model: cfg.modelName };
    if (
      cfg.supports.temperature &&
      cfg.defaultParams?.temperature !== undefined
    ) {
      params.temperature = cfg.defaultParams.temperature;
    }
    this.client = new ChatOpenAI(
      params as { model: string; temperature?: number },
    );
  }

  async stream(prompt: string): Promise<AsyncIterable<unknown>> {
    return (await this.client.stream(prompt)) as AsyncIterable<unknown>;
  }
}
