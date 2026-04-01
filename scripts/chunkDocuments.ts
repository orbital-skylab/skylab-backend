import crypto from "crypto";

export interface Chunk {
  id: string;
  text: string;
  file: string; //filename
  namespace: string;
  batch: number;
  url: string;
}

/**
 * Chunks a document text into smaller pieces and creates structured chunk objects.
 *
 * @param text - The document text to be chunked
 * @param file - The source file name or identifier
 * @param namespace - The namespace for organizing the chunks
 * @param url - The URL associated with the document
 * @returns An array of Chunk objects containing the chunked text with metadata
 *
 * @example
 * ```typescript
 * const chunks = chunkDocuments(documentText, "document.txt", "docs", "https://example.com");
 * ```
 */
export default function chunkDocuments(
  text: string,
  file: string,
  namespace: string,
  url: string
): Chunk[] {
  const chunks = chunkText(text);
  if (!chunks.length) return [];

  const batches = createChunkBatches(chunks, 7500);
  const results: Chunk[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    for (let j = 0; j < batch.length; j++) {
      const textChunk = batch[j];
      results.push({
        id: `${file}::${hashChunk(textChunk)}`,
        text: textChunk,
        file,
        namespace,
        batch: i,
        url,
      });
    }
  }

  return results;
}

/**
 * @function chunkText
 * Chunks text into smaller segments with token-based size limits and optional overlap.
 *
 * @param text - The text to be chunked
 * @param maxTokens - Maximum number of tokens per chunk (default: 600)
 * @param overlapTokens - Number of tokens to overlap between consecutive chunks (default: 60)
 * @returns An array of text chunks, each respecting the token limit with overlap applied
 *
 * @remarks
 * The function employs a hierarchical splitting strategy:
 * 1. First splits text by paragraphs
 * 2. If a paragraph exceeds maxTokens, splits by sentences
 * 3. If a sentence exceeds maxTokens, performs hard character-based splitting
 *
 * Chunks are then merged with overlap regions to maintain context continuity.
 */
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

/**
 * Extracts the overlap portion of text by collecting sentences from the end
 * until the total token count reaches or exceeds the specified overlap limit.
 *
 * @param text - The input text to extract overlap from
 * @param overlapTokens - The maximum number of tokens to include in the overlap
 * @returns A string containing the sentences that form the overlap portion
 */
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

/**
 * Splits text into paragraphs based on multiple blank lines or markdown headers.
 *
 * Splits the input text by:
 * - Two or more consecutive newlines, or
 * - A newline followed by a markdown heading (1-6 hash symbols)
 *
 * @param text - The text to split into paragraphs
 * @returns An array of trimmed, non-empty paragraph strings
 *
 * @example
 * ```
 * const text = "First paragraph\n\nSecond paragraph\n# Header\nThird paragraph";
 * const paragraphs = splitByParagraphs(text);
 * // Returns: ["First paragraph", "Second paragraph", "# Header", "Third paragraph"]
 * ```
 */
function splitByParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n(?=#{1,6}\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Splits a text string into an array of sentences.
 *
 * Uses a regular expression with a positive lookbehind to split on whitespace
 * that follows sentence-ending punctuation marks (period, exclamation mark, or question mark).
 * Each sentence is trimmed of leading/trailing whitespace, and empty strings are filtered out.
 *
 * @param text - The text to split into sentences
 * @returns An array of trimmed sentences
 *
 * @example
 * ```typescript
 * const sentences = splitBySentences("Hello world! How are you? I'm fine.");
 * // Returns: ["Hello world!", "How are you?", "I'm fine."]
 * ```
 */
function splitBySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @function createChunkBatches
 * Groups an array of text chunks into batches based on a maximum token limit.
 *
 * @param chunks - Array of text chunks to be batched
 * @param maxTokens - Maximum number of tokens allowed per batch (default: 8000)
 * @returns A 2D array where each sub-array represents a batch of chunks that don't exceed maxTokens
 *
 * @remarks
 * - Chunks exceeding maxTokens are skipped with a warning logged to console
 * - Each batch will not exceed the specified maxTokens limit
 * - The function uses estimateTokenLength to calculate token counts for each chunk
 */
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

const CHARS_PER_TOKEN = 6;
/**
 * Estimates the token length of a given string.
 * @param s - The string to estimate token length for.
 * @returns The estimated number of tokens, rounded up to the nearest integer.
 */
function estimateTokenLength(s: string) {
  return Math.ceil(s.length / CHARS_PER_TOKEN);
}

/**
 * Generates a SHA-256 hash of the provided text.
 * @param text - The text content to hash
 * @returns The hexadecimal representation of the SHA-256 hash
 */
function hashChunk(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
