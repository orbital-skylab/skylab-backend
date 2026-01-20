import "dotenv/config";
import fs from "fs";
import path from "path";
import { getPineconeClient } from "../src/utils/pinecone";
import { getOpenAIClient } from "../src/utils/openai";
import { PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";
import metadata from "../docs/metadata";

const DOCS_DIR = path.join(process.cwd(), "docs");

export async function indexDocuments() {
  const pinecone = getPineconeClient();
  const openai = getOpenAIClient();

  const namespaces = fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log("Starting document indexing");
  for (const namespace of namespaces) {
    const records: PineconeRecord<RecordMetadata>[] = [];

    const namespaceDir = path.join(DOCS_DIR, namespace);
    console.log(`\nStarting indexing on namespace: ${namespace}`);

    const files = fs.readdirSync(namespaceDir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(namespaceDir, file);
      const text = fs.readFileSync(filePath, "utf-8").trim();
      const chunks = chunkText(text);
      const fullMetadata = metadata.find((m) => m.file === file);

      if (!chunks.length) {
        continue;
      }

      const batches = createChunkBatches(chunks, 7500);
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(
          `Embedding chunk batch with token length: ${batch.reduce(
            (sum, c) => sum + estimateTokenLength(c),
            0
          )} and text: ${batch
            .map((c, j) => `--- BATCH ${i} CHUNK ${j} ---\n${c}`)
            .join("\n")}`
        );

        // get embeddings for batch i
        const embeddings = await Promise.all(
          batch.map((c) => openai.getEmbedding(c))
        );

        records.push(
          ...batch.map((chunk, j) => ({
            id: `${file}::batch-${i}-chunk-${j}`,
            values: embeddings[j],
            metadata: {
              file: file,
              namespace,
              chunkIndex: i + j,
              text: chunk,
              url: fullMetadata?.url ?? "",
            },
          }))
        );
      }
    }
    if (records.length === 0) {
      continue;
    }
    await pinecone.upsertRecords(records, namespace);
    console.log(`Finished indexing on namespace: ${namespace}`);
  }
  console.log("\nDocument indexing complete");
}

const CHARS_PER_TOKEN = 6;
function estimateTokenLength(s: string) {
  return Math.ceil(s.length / CHARS_PER_TOKEN);
}

export function chunkText(
  text: string,
  maxTokens = 600,
  overlapTokens = 60
): string[] {
  const paragraphs = splitByParagraphs(text);
  const baseChunks: string[] = [];

  for (const para of paragraphs) {
    // Paragraph fits
    if (estimateTokenLength(para) <= maxTokens) {
      baseChunks.push(para);
      continue;
    }

    // Paragraph too large, split by sentences
    const sentences = splitBySentences(para);

    let current: string[] = [];
    let currentTokens = 0;

    for (const sentence of sentences) {
      const tokens = estimateTokenLength(sentence);

      // Sentence too large, hard split by characters
      if (tokens > maxTokens) {
        if (current.length) {
          baseChunks.push(current.join(" "));
          current = [];
          currentTokens = 0;
        }

        const maxChars = maxTokens * CHARS_PER_TOKEN;

        // Slice sentence into minimal number of chunks
        for (let i = 0; i < sentence.length; i += maxChars) {
          baseChunks.push(sentence.slice(i, i + maxChars));
        }

        continue;
      }

      if (currentTokens + tokens > maxTokens) {
        baseChunks.push(current.join(" "));
        current = [];
        currentTokens = 0;
      }

      current.push(sentence);
      currentTokens += tokens;
    }

    if (current.length) {
      baseChunks.push(current.join(" "));
    }
  }

  if (baseChunks.length <= 1) return baseChunks;

  const finalChunks: string[] = [];
  let previousChunk = "";

  for (const chunk of baseChunks) {
    if (!previousChunk) {
      finalChunks.push(chunk);
      previousChunk = chunk;
      continue;
    }

    const overlapText = getOverlapPortion(previousChunk, overlapTokens);
    finalChunks.push(`${overlapText}\n\n${chunk}`);
    previousChunk = chunk;
  }

  return finalChunks;
}

function getOverlapPortion(text: string, overlapTokens: number): string {
  const sentences = splitBySentences(text);

  const overlap: string[] = [];
  let tokenCount = 0;

  for (let i = sentences.length - 1; i >= 0; i--) {
    const t = estimateTokenLength(sentences[i]);
    if (tokenCount + t > overlapTokens) break;

    overlap.unshift(sentences[i]);
    tokenCount += t;
  }

  return overlap.join(" ");
}

function splitByParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n(?=#{1,6}\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitBySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function createChunkBatches(chunks: string[], maxTokens = 8000): string[][] {
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let batchTokenLength = 0;

  for (const chunk of chunks) {
    const chunkTokenLength = estimateTokenLength(chunk);

    if (chunkTokenLength > maxTokens) {
      console.warn(`Skipping oversized chunk (${chunkTokenLength} tokens)`);
      continue;
    }

    if (batchTokenLength + chunkTokenLength > maxTokens) {
      batches.push(currentBatch);
      currentBatch = [];
      batchTokenLength = 0;
    }

    currentBatch.push(chunk);
    batchTokenLength += chunkTokenLength;
  }

  if (currentBatch.length) {
    batches.push(currentBatch);
  }

  return batches;
}

indexDocuments();
