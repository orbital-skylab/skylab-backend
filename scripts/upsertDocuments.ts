import { EmbeddedChunk } from "./embedDocuments";
import { getPineconeClient } from "../src/utils/pinecone";
import { PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

export default async function upsertDocuments(
  embeddedChunks: EmbeddedChunk[],
  namespace: string,
  pinecone = getPineconeClient()
) {
  if (!embeddedChunks.length) return;

  const records: PineconeRecord<RecordMetadata>[] = embeddedChunks.map(
    (chunk) => ({
      id: chunk.id,
      values: chunk.values,
      metadata: {
        file: chunk.file,
        namespace: chunk.namespace,
        batch: chunk.batch,
        text: chunk.text,
        url: chunk.url,
      },
    })
  );

  await pinecone.upsertRecords(records, namespace);
}
