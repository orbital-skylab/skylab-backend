import {
  Pinecone,
  PineconeRecord,
  RecordMetadata,
} from "@pinecone-database/pinecone";

export class PineconeClient {
  private client: Pinecone;
  private INDEX_NAME = "orbital-skylab-faq-assistant";

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY is not set in config");
    }
    this.client = new Pinecone({ apiKey });
  }

  async createIndex() {
    const existing = await this.client.listIndexes();
    if (existing.indexes?.some((i) => i.name === this.INDEX_NAME)) {
      return;
    }

    await this.client.createIndex({
      name: this.INDEX_NAME,
      dimension: 3072,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
  }

  /**
   * Upsert records into the specified namespace (replace existing records with same IDs)
   */
  async upsertRecords(
    records: PineconeRecord<RecordMetadata>[],
    namespace: string
  ) {
    if (records.length === 0) return;

    const index = this.client.index(this.INDEX_NAME).namespace(namespace);

    const MAX_RECORDS_PER_UPSERT = 100;

    const batches: PineconeRecord<RecordMetadata>[][] = [];
    for (let i = 0; i < records.length; i += MAX_RECORDS_PER_UPSERT) {
      batches.push(records.slice(i, i + MAX_RECORDS_PER_UPSERT));
    }

    await Promise.all(
      batches.map((batch) => {
        return index.upsert(batch);
      })
    );
  }

  /**
   * Query the index for top K similar vectors to the given embedding
   * @param vector The query vector
   * @param namespace Optional namespace
   * @param topK Number of results to return
   * @returns Array of matches with id, score, and metadata
   */
  async query(vector: number[], namespaces: string[], topK: number) {
    const results = await Promise.allSettled(
      namespaces.map(async (ns) => {
        const index = this.client.index(this.INDEX_NAME).namespace(ns);

        const result = await this.withTimeout(
          index.query({
            vector,
            topK,
            includeMetadata: true,
          }),
          5000
        );

        return (
          result.matches?.map((m) => ({
            id: m.id,
            score: m.score,
            metadata: m.metadata,
            namespace: ns,
          })) || []
        );
      })
    );

    const allResults = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : []
    );

    allResults.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return allResults.slice(0, topK);
  }

  async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Query timeout")), ms);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  async deleteAll() {
    const index = this.client.index(this.INDEX_NAME);
    await index.deleteAll();
  }
}

let client: PineconeClient | null = null;
export function getPineconeClient() {
  if (!client) {
    client = new PineconeClient();
  }
  return client;
}
