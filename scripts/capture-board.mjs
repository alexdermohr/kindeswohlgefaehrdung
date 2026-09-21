import { writeFileSync } from "node:fs";

const port = process.argv[2];
const outJson = process.argv[3];
const outText = process.argv[4];
if (!port || !outJson || !outText) {
  throw new Error("usage: node scripts/capture-board.mjs <cdp-port> <out.json> <out.txt>");
}

const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
const page = pages.find(p => p.type === "page" && p.url.includes("boards.edupool.cloud"));
if (!page) throw new Error("Edupool board target not found");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("ws open timeout")), 5000);
  ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

let id = 0;
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const req = ++id;
    const t = setTimeout(() => reject(new Error(method + " timeout")), 10000);
    const handler = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== req) return;
      ws.removeEventListener("message", handler);
      clearTimeout(t);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id: req, method, params }));
  });
}

const expression = `JSON.stringify({
  captured_at: new Date().toISOString(),
  url: location.href,
  title: document.title,
  text: document.body.innerText,
  links: Array.from(document.querySelectorAll("a"))
    .map((a, i) => ({ i, text: (a.innerText || a.textContent || "").trim(), href: a.href || "" }))
    .filter(x => x.href)
})`;
const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
const data = JSON.parse(result.result.value || "{}");
writeFileSync(outJson, JSON.stringify(data, null, 2) + "\n");
writeFileSync(outText, (data.text || "") + "\n");
console.log(JSON.stringify({ title: data.title, chars: (data.text || "").length, links: (data.links || []).length }));
ws.close();
