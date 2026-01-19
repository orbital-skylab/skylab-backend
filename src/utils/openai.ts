import { OpenAI } from "openai";

type Message = {
  role: MessageRole;
  content: string;
};
type MessageRole = "USER" | "ASSISTANT";

export class OpenAIClient {
  private client: OpenAI;
  private MODEL = "gpt-4.1";
  private EMBEDDING_MODEL = "text-embedding-3-large";
  private TEMPERATURE = 0.7;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in config");
    }
    this.client = new OpenAI({ apiKey });
  }

  async chat(
    message: string,
    systemPrompt: string,
    history: Message[] = [],
    onDelta?: (message: string) => void
  ) {
    /*
	    const inputEmbedding = await this.getEmbedding(message);
    const semanticSearchResults = await pineconeClient.query(inputEmbedding);
    const promptContext = semanticSearchResults
      .map((m) => m.metadata?.text ?? "")
      .join("\n---\n");
	*/
    const stream = await this.client.responses.create({
      model: this.MODEL,
      input: [
        {
          role: "system",
          content: `${systemPrompt}`,
        },
        ...history.map((m) => ({
          role: m.role.toLowerCase() as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user",
          content: `User Message:${message}`,
        },
      ],
      temperature: this.TEMPERATURE,
      stream: true,
    });

    let fullResponseText = "";

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        const chunk = event.delta;
        fullResponseText += chunk;
        onDelta?.(chunk);
      }
    }

    return fullResponseText;
  }

  async getEmbedding(text: string) {
    const response = await this.client.embeddings.create({
      model: this.EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  }

  async getEmbeddings(texts: string[]) {
    const response = await this.client.embeddings.create({
      model: this.EMBEDDING_MODEL,
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  }

  async getTitle(content: string) {
    const response = await this.client.responses.create({
      model: this.MODEL,
      input: [
        {
          role: "system",
          content: `
						Generate a concise title for this conversation starter.
						Keep it under 6 words.
						Do NOT include any prefixes like "Title:" or extra punctuation.
						Return only the title itself.
						`,
        },
        { role: "user", content: content },
      ],
      temperature: this.TEMPERATURE,
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
