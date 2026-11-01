const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9224;
const OUT = "C:/+Twitch/sapa/resident-evil/.impeccable/review/";
const BASE = "http://localhost:4321/resident-evil-tierlist/";
const { spawn } = await import("node:child_process");
const { writeFile, rm } = await import("node:fs/promises");
const { mkdtempSync } = await import("node:fs");
const { join } = await import("node:path");
const { tmpdir } = await import("node:os");

const profile = mkdtempSync(join(tmpdir(), "edge-cdp-"));
const edge = spawn(EDGE, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--force-device-scale-factor=1",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--window-size=1440,900",
  "about:blank",
], { stdio: "ignore" });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, msgId = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const evaluate = async expr => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
};
const shot = async name => {
  const r = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(OUT + name, Buffer.from(r.data, "base64"));
};

try {
  let targets;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      if (targets.some(t => t.type === "page")) break;
    } catch (e) {}
  }
  const page = targets.find(t => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).resolve(m.result); pending.delete(m.id); }
    if (m.method === "Page.loadEventFired") ws._loaded = true;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: BASE });
  for (let i = 0; i < 40 && !ws._loaded; i++) await sleep(250);
  await sleep(1200);

  await evaluate(`(() => {
    const zones = document.querySelectorAll('.dropzone');
    const pool = document.getElementById('pool');
    const ids = [...pool.querySelectorAll('.card')].slice(0, 3).map(c => c.dataset.id);
    ids.forEach((id, i) => {
      const card = pool.querySelector('.card[data-id="' + id + '"]');
      const dt = new DataTransfer();
      card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      zones[0].dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt, cancelable: true }));
      zones[0].dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt, cancelable: true }));
      card.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
      card.classList.remove('dragging');
    });
    document.querySelectorAll('.row .card').forEach(c => c.classList.remove('dragging'));
  })()`);
  await sleep(300);

  await evaluate(`document.getElementById('reset').click()`);
  await sleep(500);
  const dialogState = await evaluate(`({ open: document.getElementById('reset-dialog').open, text: document.getElementById('rd-text').textContent })`);
  await shot("dialog-open.png");

  await evaluate(`document.getElementById('rd-confirm').click()`);
  await sleep(500);
  const after = await evaluate(`({
    dialogOpen: document.getElementById('reset-dialog').open,
    inTiers: document.querySelectorAll('.row .card').length,
    count: document.getElementById('poolcount').textContent
  })`);
  await shot("after-reset.png");
  console.log("DIALOG", JSON.stringify(dialogState));
  console.log("AFTER", JSON.stringify(after));
  await rm(profile, { recursive: true, force: true }).catch(() => {});
} finally {
  edge.kill();
  process.exit(0);
}
