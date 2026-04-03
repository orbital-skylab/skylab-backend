import { OpenAI } from "openai";
import fetch from "node-fetch";
globalThis.fetch = fetch;

type Message = {
  role: MessageRole;
  content: string;
};
type MessageRole = "USER" | "ASSISTANT";
type ImageInput = {
  imageBase64: string;
};
type AudioInput = {
  audioBase64: string;
  format: "wav" | "mp3";
};
type OpenAIClientConfig = {
  model?: string;
  embeddingModel?: string;
  temperature?: number;
};
const DEFAULT_OPENAI_CONFIG = {
  model: "gpt-4.1",
  embeddingModel: "text-embedding-3-large",
  temperature: 0.7,
} as const;

export class OpenAIClient {
  private client: OpenAI;

  private readonly model: string;
  private readonly embeddingModel: string;
  private readonly temperature: number;

  constructor(config: OpenAIClientConfig = {}) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in config");
    }

    this.client = new OpenAI({ apiKey });

    this.model = config.model ?? DEFAULT_OPENAI_CONFIG.model;
    this.embeddingModel =
      config.embeddingModel ?? DEFAULT_OPENAI_CONFIG.embeddingModel;
    this.temperature = config.temperature ?? DEFAULT_OPENAI_CONFIG.temperature;
  }

  // ---------- HELPERS ----------

  private mapHistory(history: Message[]) {
    return history.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }));
  }

  private buildUserContent(
    userPrompt: string,
    context?: string,
    images?: ImageInput[],
    audio?: AudioInput
  ) {
    const userContent: any[] = [];

    // TEXT
    userContent.push({
      type: "input_text",
      text: `${
        context ? `Context:\n${context}\n\n` : ""
      }User Message: ${userPrompt}`,
    });

    // IMAGES
    images?.forEach((img) => {
      userContent.push({
        type: "input_image",
        image_url: `data:image/jpeg;base64,${img.imageBase64}`,
        detail: "auto",
      });
    });

    // AUDIO
    if (audio) {
      userContent.push({
        type: "input_audio",
        input_audio: {
          data: audio.audioBase64,
          format: audio.format,
        },
      });
    }

    return userContent;
  }

  // ---------- MAIN RESPONSE ----------

  async getResponse(
    userPrompt: string,
    systemPrompt: string,
    history: Message[] = [],
    onDelta?: (message: string) => void,
    context?: string,
    images?: ImageInput[],
    audio?: AudioInput
  ) {
    const userContent = this.buildUserContent(
      userPrompt,
      context,
      images,
      audio
    );

    const stream = await this.client.responses.create({
      model: this.model,
      temperature: this.temperature,
      stream: true,
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...this.mapHistory(history),
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    let fullResponse = "";

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        fullResponse += event.delta;
        onDelta?.(event.delta);
      }
    }

    return fullResponse;
  }

  // ---------- EMBEDDINGS ----------

  async getEmbedding(text: string) {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }

  async getEmbeddings(texts: string[]) {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  }

  // ---------- TITLE ----------

  async getTitle(content: string) {
    const response = await this.client.responses.create({
      model: this.model,
      input: [
        {
          role: "system",
          content: `
Generate a concise title for this conversation starter.
Keep it under 6 words.
Return only the title.
          `,
        },
        { role: "user", content },
      ],
      temperature: this.temperature,
      max_output_tokens: 16,
    });

    return response.output_text;
  }
}

let client: OpenAIClient | null = null;
export function getOpenAIClient() {
  if (!client) {
    client = new OpenAIClient();
  }
  return client;
}
