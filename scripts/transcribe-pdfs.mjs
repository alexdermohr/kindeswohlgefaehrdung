import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, parse } from "node:path";

const manifestPath = process.argv[2] || "source-private/pdf-manifest.json";
const pdfDir = process.argv[3] || "source-private/pdfs";
const outDir = process.argv[4] || "source-private/transcripts";
const outManifest = process.argv[5] || "source-private/transcript-manifest.json";
mkdirSync(outDir, { recursive: true });

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const results = [];
for (const item of manifest.items || []) {
  const input = join(pdfDir, item.name);
  const textName = parse(item.name).name + ".txt";
  const output = join(outDir, textName);
  const r = spawnSync("pdftotext", ["-layout", "-enc", "UTF-8", input, output], { encoding: "utf8" });
  if (r.status !== 0) {
    results.push({ name: item.name, text_name: textName, ok: false, error: (r.stderr || "").trim() });
    continue;
  }
  const text = readFileSync(output, "utf8");
  results.push({
    name: item.name,
    text_name: textName,
    ok: true,
    chars: text.length,
    non_whitespace_chars: text.replace(/\s/g, "").length,
    lines: text.split(/\r?\n/).length,
    bytes: statSync(output).size
  });
  console.log(`transcribed ${results.length}/${manifest.items.length}: ${item.name}`);
}
writeFileSync(outManifest, JSON.stringify({
  created_at: new Date().toISOString(),
  count: results.length,
  ok: results.filter(x => x.ok).length,
  low_text: results.filter(x => x.ok && x.non_whitespace_chars < 200).map(x => x.name),
  items: results
}, null, 2) + "\n");
console.log(JSON.stringify({ count: results.length, ok: results.filter(x=>x.ok).length, low_text: results.filter(x=>x.ok && x.non_whitespace_chars < 200).length }));
