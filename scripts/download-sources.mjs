import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename } from "node:path";
import { createHash } from "node:crypto";

const boardPath = process.argv[2] || "source-private/board.json";
const outDir = process.argv[3] || "source-private/pdfs";
const manifestPath = process.argv[4] || "source-private/pdf-manifest.json";
mkdirSync(outDir, { recursive: true });

const board = JSON.parse(readFileSync(boardPath, "utf8"));
const sourceLinks = (board.links || [])
  .filter(x => /\/api\/files\/.*\.pdf(?:\?|$)/i.test(x.href || ""));
const unique = [...new Map(sourceLinks.map(x => [x.href, x])).values()];

function safeName(href, fallback) {
  const u = new URL(href);
  let n = decodeURIComponent(basename(u.pathname));
  n = n.replace(/[\/\\\0]/g, "_").trim();
  return n || fallback;
}
async function one(link, index) {
  const name = safeName(link.href, `source-${String(index+1).padStart(2,"0")}.pdf`);
  const out = `${outDir}/${name}`;
  const res = await fetch(link.href, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${name}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  return {
    index: index + 1,
    name,
    bytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
    content_type: res.headers.get("content-type") || "",
    source_url: link.href
  };
}
const results = [];
for (let i = 0; i < unique.length; i += 4) {
  const batch = unique.slice(i, i + 4);
  const got = await Promise.all(batch.map((link, j) => one(link, i + j)));
  results.push(...got);
  console.log(`downloaded ${results.length}/${unique.length}`);
}
writeFileSync(manifestPath, JSON.stringify({
  captured_at: new Date().toISOString(),
  count: results.length,
  items: results
}, null, 2) + "\n");
console.log(JSON.stringify({ count: results.length, bytes: results.reduce((s,x)=>s+x.bytes,0) }));
