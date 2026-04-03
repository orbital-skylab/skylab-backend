import fs from "fs";
import path from "path";
import metadata from "../docs/metadata";
import chunkDocuments from "./chunkDocuments";
import embedDocuments from "./embedDocuments";
import upsertDocuments from "./upsertDocuments";
import dotenv from "dotenv";
dotenv.config();

const DOCS_DIR = path.join(process.cwd(), "docs");

export default async function ingestDocuments() {
  const namespaces = fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log("Starting document ingestion");

  for (const namespace of namespaces) {
    console.log(`\nIndexing namespace: ${namespace}`);

    const namespaceDir = path.join(DOCS_DIR, namespace);
    const files = fs.readdirSync(namespaceDir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(namespaceDir, file);
      const text = fs.readFileSync(filePath, "utf-8").trim();
      const meta = metadata.find((m) => m.file === file);

      const chunks = chunkDocuments(text, file, namespace, meta?.url ?? "");

      const embedded = await embedDocuments(chunks);
      await upsertDocuments(embedded, namespace);
    }

    console.log(`Finished namespace: ${namespace}`);
  }

  console.log("\nDocument ingestion complete");
}

ingestDocuments();
