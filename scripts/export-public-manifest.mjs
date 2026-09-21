import { readFileSync, writeFileSync } from "node:fs";

const pdfManifestPath = process.argv[2] || "source-private/pdf-manifest.json";
const transcriptManifestPath = process.argv[3] || "source-private/transcript-manifest.json";
const outPath = process.argv[4] || "quellen/manifest.csv";

const pdf = JSON.parse(readFileSync(pdfManifestPath, "utf8"));
const tr = JSON.parse(readFileSync(transcriptManifestPath, "utf8"));
const byName = new Map((tr.items || []).map(x => [x.name, x]));

function csv(v) {
  const s = String(v ?? "");
  return '"' + s.replaceAll('"', '""') + '"';
}

const rows = [
  ["index","dateiname","bytes","sha256","content_type","transkription","zeichen_ohne_leerraum","ocr_seiten"].map(csv).join(",")
];

for (const item of pdf.items || []) {
  const t = byName.get(item.name) || {};
  rows.push([
    item.index,
    item.name,
    item.bytes,
    item.sha256,
    item.content_type,
    t.method || (t.ok ? "pdftotext" : "fehlend"),
    t.non_whitespace_chars ?? "",
    t.pages_ocr ?? ""
  ].map(csv).join(","));
}

writeFileSync(outPath, rows.join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length - 1, out: outPath }));
