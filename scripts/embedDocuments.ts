import { getOpenAIClient } from "../src/utils/openai";
import { Chunk } from "./chunkDocuments";

export interface EmbeddedChunk extends Chunk {
  values: number[];
}

export default async function embedDocuments(
  chunks: Chunk[],
  openai = getOpenAIClient()
): Promise<EmbeddedChunk[]> {
  const embedded: EmbeddedChunk[] = [];

  for (const chunk of chunks) {
    const values = await openai.getEmbedding(chunk.text);

    embedded.push({
      ...chunk,
      values,
    });
  }

  return embedded;
}
