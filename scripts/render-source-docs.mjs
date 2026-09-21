import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const dataPath = resolve(root, process.argv[2] || "data/sources.json");
const manifestPath = resolve(root, process.argv[3] || "quellen/manifest.csv");
const pdfOutPath = resolve(root, process.argv[4] || "quellen/pdf-quellen.md");
const bibliographyOutPath = resolve(root, process.argv[5] || "quellen/quellenverzeichnis.md");

const data = JSON.parse(readFileSync(dataPath, "utf8"));
const manifest = readFileSync(manifestPath, "utf8");

function fail(message) {
  throw new Error(message);
}

function normalize(value) {
  return String(value).normalize("NFC");
}

function manifestFileNames(csv) {
  const names = [];
  for (const line of csv.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const match = line.match(/^"[^"]+","([^"]+)"/);
    if (!match) fail(`Kann manifest.csv-Zeile nicht lesen: ${line}`);
    names.push(match[1]);
  }
  return names;
}

if (data.schemaVersion !== 1) fail("sources.json: schemaVersion muss 1 sein.");
if (!data.sourceRoot?.url || !Array.isArray(data.sources) || !data.stepSources) {
  fail("sources.json: sourceRoot, sources und stepSources sind Pflicht.");
}

const sourceIds = new Set();
const boardFileOwners = new Map();
const publicUrls = new Map();
const sourcesById = new Map();

for (const source of data.sources) {
  if (!source.id || !source.title || !source.section || !Array.isArray(source.boardFiles) || source.boardFiles.length === 0) {
    fail(`Ungültige Quelle: ${JSON.stringify(source)}`);
  }
  if (sourceIds.has(source.id)) fail(`Doppelte source id: ${source.id}`);
  sourceIds.add(source.id);
  sourcesById.set(source.id, source);

  const fileIds = new Set();
  for (const file of source.boardFiles) {
    const key = normalize(file.name);
    if (boardFileOwners.has(key)) {
      fail(`Board-Datei doppelt katalogisiert: ${file.name} (${boardFileOwners.get(key)} / ${source.id})`);
    }
    boardFileOwners.set(key, source.id);
    if (file.id) {
      if (fileIds.has(file.id)) fail(`Doppelte Board-Datei-ID ${file.id} bei ${source.id}`);
      fileIds.add(file.id);
    }
  }

  if (source.publicPdf) {
    const url = source.publicPdf.url;
    if (!/^https:\/\//.test(url)) fail(`Öffentliche PDF-URL muss HTTPS sein: ${url}`);
    if (publicUrls.has(url)) fail(`Öffentliche PDF-URL doppelt im Katalog: ${url}`);
    publicUrls.set(url, source.id);
  } else if (!source.statusNote) {
    fail(`Nicht öffentliche Quelle braucht statusNote: ${source.id}`);
  }
}

const manifestNames = manifestFileNames(manifest);
const manifestSet = new Set(manifestNames.map(normalize));
const catalogSet = new Set(boardFileOwners.keys());

const missingInCatalog = [...manifestSet].filter((name) => !catalogSet.has(name));
const extraInCatalog = [...catalogSet].filter((name) => !manifestSet.has(name));
if (missingInCatalog.length || extraInCatalog.length) {
  fail(`Board-Dateien stimmen nicht mit manifest.csv überein. Fehlend=${JSON.stringify(missingInCatalog)} extra=${JSON.stringify(extraInCatalog)}`);
}

const expectedSteps = Object.keys(data.stepSources).sort((a, b) => Number(a) - Number(b));
if (
  expectedSteps.length === 0 ||
  expectedSteps.some((step, index) => step !== String(index + 1))
) {
  fail(`stepSources muss eine lückenlose Folge ab 1 sein: ${JSON.stringify(expectedSteps)}`);
}
for (const step of expectedSteps) {
  const group = data.stepSources[step];
  if (!group?.label || !Array.isArray(group.items) || group.items.length === 0) {
    fail(`Fehlende Schrittquellen für Schritt ${step}`);
  }
  for (const item of group.items) {
    const source = sourcesById.get(item.sourceId);
    if (!source) fail(`Schritt ${step} verweist auf unbekannte Quelle ${item.sourceId}`);
    if (item.boardFileIds) {
      const fileIds = new Set(source.boardFiles.map((file) => file.id).filter(Boolean));
      for (const fileId of item.boardFileIds) {
        if (!fileIds.has(fileId)) {
          fail(`Schritt ${step} verweist auf unbekannte Board-Datei-ID ${fileId} bei ${item.sourceId}`);
        }
      }
    }
  }
}
for (const step of Object.keys(data.stepSources)) {
  if (!expectedSteps.includes(step)) fail(`Unerwarteter Schritt in stepSources: ${step}`);
}

const libraryGroupIds = new Set((data.libraryGroups || []).map((group) => group.id));
for (const source of data.sources) {
  if (source.libraryGroup && !libraryGroupIds.has(source.libraryGroup)) {
    fail(`Unbekannte libraryGroup ${source.libraryGroup} bei ${source.id}`);
  }
}

const publicBoardFileCount = data.sources
  .filter((source) => source.publicPdf)
  .reduce((sum, source) => sum + source.boardFiles.length, 0);
const unavailableBoardFileCount = manifestSet.size - publicBoardFileCount;

function mdCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function fileLabel(file) {
  return file.pages ? `${file.name} — ${file.pages}` : file.name;
}

const pdfLines = [
  "# Öffentliche PDF-Links der Board-Quellen",
  "",
  "<!-- GENERATED FROM data/sources.json. NICHT MANUELL BEARBEITEN. -->",
  "",
  "Stand: 21.09.2026.",
  "",
  "Dieser Bericht wird aus `data/sources.json` erzeugt. Der Katalog ist die einzige gepflegte Wahrheit für Board-Dateien, öffentliche PDF-URLs, Status und Schrittzuordnung.",
  "",
  "## Oberquelle",
  "",
  `[${data.sourceRoot.title}](${data.sourceRoot.url}) — ${data.sourceRoot.description}`,
  "",
  "Ein öffentlicher PDF-Link bedeutet nicht automatisch eine freie Lizenz. Verlinkt wird nur auf bestehende öffentliche Fassungen; lokal gesicherte Board-Auszüge werden nicht erneut veröffentlicht.",
  ""
];

const sections = [];
for (const source of data.sources) {
  if (!sections.includes(source.section)) sections.push(source.section);
}
for (const section of sections) {
  pdfLines.push(`## ${section}`, "", "| Board-Datei | Quelle | Öffentliche PDF-Fassung / Status |", "|---|---|---|");
  for (const source of data.sources.filter((item) => item.section === section)) {
    const status = source.publicPdf
      ? `[${source.publicPdf.label}](${source.publicPdf.url})${source.statusNote ? ` — ${source.statusNote}` : ""}`
      : source.statusNote;
    for (const file of source.boardFiles) {
      pdfLines.push(`| ${mdCell(fileLabel(file))} | ${mdCell(source.title)} | ${mdCell(status)} |`);
    }
  }
  pdfLines.push("");
}

pdfLines.push(
  "## Zusammenfassung",
  "",
  `- ${manifestSet.size} eindeutige Board-PDF-Dateien insgesamt.`,
  `- ${publicBoardFileCount} Board-Dateien sind einer live geprüften öffentlichen PDF-Gesamt- oder Originalfassung zugeordnet.`,
  `- Diese Zuordnungen führen auf ${publicUrls.size} unterschiedliche öffentliche Direkt-PDF-URLs.`,
  `- Für ${unavailableBoardFileCount} Board-Dateien wird bewusst kein funktionierender öffentlicher Direkt-PDF-Link behauptet.`,
  "",
  "Die vollständige technische Dateiliste mit SHA-256-Prüfsummen steht in [manifest.csv](manifest.csv).",
  ""
);

const bibliographyLines = [
  "# Quellenverzeichnis des Boards",
  "",
  "<!-- GENERATED FROM data/sources.json. NICHT MANUELL BEARBEITEN. -->",
  "",
  `**Oberquelle:** [${data.sourceRoot.title}](${data.sourceRoot.url})`,
  "",
  "Die Originaldateien werden aus Rechte- und Freigabegründen nicht öffentlich in dieses Repository kopiert. Öffentliche PDF-Fassungen sind — soweit belastbar vorhanden — im selben Katalog verknüpft.",
  ""
];

let number = 0;
for (const section of sections) {
  bibliographyLines.push(`## ${section}`, "");
  for (const source of data.sources.filter((item) => item.section === section)) {
    number += 1;
    bibliographyLines.push(`${number}. **${source.title}.** ${source.citation}`);
    for (const file of source.boardFiles) {
      bibliographyLines.push(`   - Board-Datei: \`${file.name}\`${file.pages ? ` — ${file.pages}` : ""}`);
    }
    if (source.publicPdf) {
      bibliographyLines.push(`   - Öffentliche Fassung: [${source.publicPdf.label}](${source.publicPdf.url})`);
    } else {
      bibliographyLines.push(`   - Öffentlicher PDF-Status: ${source.statusNote}`);
    }
    if (source.statusNote && source.publicPdf) {
      bibliographyLines.push(`   - Zuordnungshinweis: ${source.statusNote}`);
    }
    bibliographyLines.push("");
  }
}

bibliographyLines.push(
  "## Technische Nachvollziehbarkeit",
  "",
  `Der Katalog deckt exakt ${manifestSet.size} eindeutige Board-PDF-Dateien ab. Die technische Identität der lokal geladenen Dateien wird separat in manifest.csv über Dateiname, Bytezahl und SHA-256 festgehalten.`,
  ""
);

writeFileSync(pdfOutPath, pdfLines.join("\n"));
writeFileSync(bibliographyOutPath, bibliographyLines.join("\n"));

console.log(JSON.stringify({
  sources: data.sources.length,
  board_files: manifestSet.size,
  public_pdf_urls: publicUrls.size,
  public_board_files: publicBoardFileCount,
  unavailable_board_files: unavailableBoardFileCount,
  steps: expectedSteps.length,
  outputs: [pdfOutPath, bibliographyOutPath]
}));
