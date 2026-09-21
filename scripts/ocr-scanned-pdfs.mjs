import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, mkdtempSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, parse } from "node:path";
import { tmpdir } from "node:os";

const manifestPath = process.argv[2] || "source-private/transcript-manifest.json";
const pdfDir = process.argv[3] || "source-private/pdfs";
const outDir = process.argv[4] || "source-private/transcripts";
const threshold = Number(process.argv[5] || "200");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
mkdirSync(outDir, { recursive: true });

for (const item of manifest.items || []) {
  if (!item.ok || (item.non_whitespace_chars ?? 0) >= threshold) {
    item.method = item.method || "pdftotext";
    continue;
  }

  const input = join(pdfDir, item.name);
  const work = mkdtempSync(join(tmpdir(), "kwg-ocr-"));
  const prefix = join(work, "page");
  const render = spawnSync("pdftoppm", ["-jpeg", "-r", "220", input, prefix], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  if (render.status !== 0) {
    item.ocr_ok = false;
    item.ocr_error = (render.stderr || "").trim();
    rmSync(work, { recursive: true, force: true });
    continue;
  }

  const images = readdirSync(work)
    .filter(n => /^page-\d+\.jpg$/i.test(n))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const pages = [];
  let failed = null;
  for (let i = 0; i < images.length; i++) {
    const img = join(work, images[i]);
    const r = spawnSync("tesseract", [img, "stdout", "-l", "deu+eng", "--psm", "3"], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024
    });
    if (r.status !== 0) {
      failed = (r.stderr || "").trim() || `tesseract exit ${r.status}`;
      break;
    }
    pages.push(`===== SEITE ${i + 1} =====\n\n${r.stdout.trim()}\n`);
  }

  if (failed) {
    item.ocr_ok = false;
    item.ocr_error = failed;
  } else {
    const output = join(outDir, item.text_name || (parse(item.name).name + ".txt"));
    const text = pages.join("\n");
    writeFileSync(output, text + "\n");
    item.ok = true;
    item.ocr_ok = true;
    item.method = "tesseract-deu+eng";
    item.pages_ocr = pages.length;
    item.chars = text.length;
    item.non_whitespace_chars = text.replace(/\s/g, "").length;
    item.lines = text.split(/\r?\n/).length;
    console.log(`ocr ${item.name}: pages=${pages.length} chars=${item.chars}`);
  }

  rmSync(work, { recursive: true, force: true });
}

manifest.low_text = (manifest.items || [])
  .filter(x => x.ok && (x.non_whitespace_chars ?? 0) < threshold)
  .map(x => x.name);
manifest.ocr_completed_at = new Date().toISOString();
manifest.ocr_language = "deu+eng";
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({
  count: manifest.items.length,
  ocr_ok: manifest.items.filter(x => x.ocr_ok).length,
  low_text: manifest.low_text.length
}));
