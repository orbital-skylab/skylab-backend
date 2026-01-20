import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import ical from "ical.js";

const DOCS_DIR = path.join(process.cwd(), "docs");

/**
 * process PDFs recursively
 */
async function parsePdfs(dir: string): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await parsePdfs(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".pdf")) {
      continue;
    }

    const baseName = path.basename(entry.name, ".pdf");
    const txtPath = path.join(dir, `${baseName}.txt`);
    const mdPath = path.join(dir, `${baseName}.md`);

    // Skip if txt or md already exists
    if (fs.existsSync(txtPath) || fs.existsSync(mdPath)) {
      console.log(`Skipping ${entry.name} (txt/md exists)`);
      continue;
    }

    try {
      console.log(`Converting ${entry.name} → ${baseName}.txt`);

      const buffer = fs.readFileSync(fullPath);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();

      fs.writeFileSync(txtPath, result.text.trim(), "utf-8");
    } catch (err) {
      console.error(`Failed to convert ${entry.name}`, err);
    }
  }
}

async function parseIcs(dir: string): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await parseIcs(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".ics")) {
      continue;
    }

    const baseName = path.basename(entry.name, ".ics");
    const txtPath = path.join(dir, `${baseName}.txt`);
    const mdPath = path.join(dir, `${baseName}.md`);

    // Skip if already converted
    if (fs.existsSync(txtPath) || fs.existsSync(mdPath)) {
      console.log(`Skipping ${entry.name} (txt/md exists)`);
      continue;
    }

    try {
      console.log(`Converting ${entry.name} → ${baseName}.txt`);

      const raw = fs.readFileSync(fullPath, "utf-8");

      // Parse ICS → jCal
      const jcalData = ical.parse(raw);

      // Create VCALENDAR component
      const vcalendar = new ical.Component(jcalData);

      // Extract VEVENT components
      const vevents = vcalendar.getAllSubcomponents("vevent");

      const lines: string[] = [];

      for (const vevent of vevents) {
        const event = new ical.Event(vevent);

        lines.push(`Event: ${event.summary || "Untitled event"}`);
        lines.push(
          `Start: ${event.startDate?.toJSDate().toLocaleString("en-SG", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Singapore",
          })}`
        );
        lines.push(
          `End: ${event.endDate?.toJSDate().toLocaleString("en-SG", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Singapore",
          })}`
        );
        if (event.location) {
          lines.push(`Location: ${event.location}`);
        }
        if (event.description) {
          lines.push(`Description: ${event.description}`);
        }
        lines.push("");
      }

      fs.writeFileSync(txtPath, lines.join("\n"), "utf-8");
      console.log(`✅ Wrote ${baseName}.txt`);
    } catch (err) {
      console.error(`❌ Failed to convert ${entry.name}`, err);
    }
  }
}

async function main() {
  console.log("Parsing Orbital Documentation");
  await parsePdfs(DOCS_DIR);
  await parseIcs(DOCS_DIR);
  console.log("Finished parsing Orbital Documentation");
}

main();
