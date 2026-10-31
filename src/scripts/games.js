import GAMES_RAW from "../../games.json";
import CHARS_RAW from "../../characters.json";

const GAMES = GAMES_RAW.games.map(g => ({
  id: g.id,
  code: g.code,
  name: g.name,
  short: g.short,
  year: g.year,
  platforms: g.platforms,
  description: g.description,
}));

const CHARS_BY_GAME = {};
for (const c of CHARS_RAW.characters) {
  for (const code of c.games) {
    (CHARS_BY_GAME[code] ||= []).push(c.nameRu || c.name);
  }
}

const BASE = import.meta.env.BASE_URL;
const COVER = (BASE.endsWith("/") ? BASE : BASE + "/") + "games/";

function dataHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
const VERSION = dataHash(JSON.stringify(GAMES));
const LS_KEY = "re-games-" + VERSION;

const DEFAULT_TIERS = [
  { key: "S", color: "#e05a4e" },
  { key: "A", color: "#e69a3c" },
  { key: "B", color: "#e6d13c" },
  { key: "C", color: "#6fbf4e" },
  { key: "D", color: "#4e9fe6" },
  { key: "F", color: "#9a8be6" },
];

const byId = Object.fromEntries(GAMES.map(g => [g.id, g]));
const tiersEl = document.getElementById("tiers");
const poolEl = document.getElementById("pool");
const searchEl = document.getElementById("search");
let tiers, pool;

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbName = document.getElementById("lb-name");
const lbEng = document.getElementById("lb-eng");
const lbMeta = document.getElementById("lb-meta");
const lbDesc = document.getElementById("lb-desc");
const lbChars = document.getElementById("lb-chars");
const lbPos = document.getElementById("lb-pos");
let lbList = [], lbIndex = 0;

function loadState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
  if (saved && Array.isArray(saved.tiers)) {
    tiers = saved.tiers;
    pool = saved.pool.filter(id => byId[id]);
    const known = new Set();
    tiers.forEach(t => { t.items = t.items.filter(id => byId[id]); t.items.forEach(i => known.add(i)); });
    pool = pool.filter(i => !known.has(i));
    for (const g of GAMES) if (!known.has(g.id) && !pool.includes(g.id)) pool.push(g.id);
  } else {
    tiers = DEFAULT_TIERS.map(t => ({ ...t, label: t.key, items: [] }));
    pool = GAMES.map(g => g.id);
  }
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify({ tiers, pool }));
}

function makeCard(id) {
  const g = byId[id];
  const el = document.createElement("div");
  el.className = "card";
  el.dataset.id = id;
  el.draggable = true;
  el.title = g.name + " [" + g.code + ", " + g.year + "]\n" + g.platforms;
  const img = document.createElement("img");
  img.src = COVER + id + ".jpg";
  img.alt = g.name;
  img.draggable = false;
  const nm = document.createElement("div");
  nm.className = "nm";
  nm.textContent = g.short + " · " + g.year;
  el.append(img, nm);
  el.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => el.classList.add("dragging"));
  });
  el.addEventListener("dragend", () => el.classList.remove("dragging"));
  el.addEventListener("click", () => openLightbox(id, el));
  return el;
}

function render() {
  tiersEl.innerHTML = "";
  for (const t of tiers) {
    const row = document.createElement("div");
    row.className = "row";
    const lab = document.createElement("div");
    lab.className = "label";
    lab.style.background = t.color;
    lab.textContent = t.label;
    lab.contentEditable = "plaintext-only";
    lab.spellcheck = false;
    lab.addEventListener("input", () => { t.label = lab.textContent.trim(); saveState(); });
    lab.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); lab.blur(); } });
    const zone = document.createElement("div");
    zone.className = "dropzone";
    zone.dataset.tier = t.key;
    t.items.forEach(id => zone.appendChild(makeCard(id)));
    row.append(lab, zone);
    tiersEl.appendChild(row);
  }
  poolEl.innerHTML = "";
  pool.forEach(id => poolEl.appendChild(makeCard(id)));
  document.getElementById("poolcount").textContent = pool.length + " шт.";
  applyFilter();
}

function containerOf(el) {
  if (el.closest("#pool")) return { get: () => pool, set: v => pool = v, el: poolEl, isPool: true };
  const zone = el.closest(".dropzone");
  if (!zone) return null;
  const t = tiers.find(t => t.key === zone.dataset.tier);
  return { get: () => t.items, set: v => t.items = v, el: zone, isPool: false };
}

function insertAt(container, x, y, cardEl) {
  const cards = [...container.el.querySelectorAll(".card:not(.dragging)")];
  for (const card of cards) {
    const r = card.getBoundingClientRect();
    if (x < r.left + r.width / 2) { container.el.insertBefore(cardEl, card); return; }
  }
  container.el.appendChild(cardEl);
}

function syncFromDOM(container) {
  container.set([...container.el.querySelectorAll(".card")].map(c => c.dataset.id).filter(id => byId[id]));
  if (container.isPool) document.getElementById("poolcount").textContent = pool.length + " шт.";
  saveState();
}

document.addEventListener("dragover", e => {
  const target = e.target.closest(".dropzone, #pool");
  if (!target) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  target.classList.add("dragover");
});

document.addEventListener("dragleave", e => {
  const t = e.target.closest && e.target.closest(".dropzone, #pool");
  if (t && !t.contains(e.relatedTarget)) t.classList.remove("dragover");
});

document.addEventListener("drop", e => {
  const target = e.target.closest(".dropzone, #pool");
  if (!target) return;
  e.preventDefault();
  target.classList.remove("dragover");
  const id = e.dataTransfer.getData("text/plain");
  if (!byId[id]) return;
  const cardEl = document.querySelector('.card.dragging[data-id="' + id + '"]')
    || document.querySelector('.card[data-id="' + id + '"]')
    || makeCard(id);
  const src = cardEl.parentElement ? containerOf(cardEl) : null;
  const dest = containerOf(target);
  if (!dest) return;
  insertAt(dest, e.clientX, e.clientY, cardEl);
  cardEl.classList.remove("dragging");
  if (src) syncFromDOM(src);
  syncFromDOM(dest);
  applyFilter();
});

searchEl.addEventListener("input", applyFilter);

function applyFilter() {
  const q = searchEl.value.trim().toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    const g = byId[card.dataset.id];
    const hit = !q
      || g.name.toLowerCase().includes(q)
      || g.short.toLowerCase().includes(q)
      || g.code.toLowerCase().includes(q)
      || String(g.year).includes(q);
    card.classList.toggle("hidden", !hit);
  });
}

document.getElementById("reset").addEventListener("click", () => {
  if (!confirm("Убрать все игры из линий обратно в банк?")) return;
  tiers = DEFAULT_TIERS.map(t => ({ ...t, label: t.key, items: [] }));
  pool = GAMES.map(g => g.id);
  render();
  saveState();
});

function renderLb() {
  const g = byId[lbList[lbIndex]];
  if (!g) return;
  lbImg.src = COVER + g.id + ".jpg";
  lbImg.alt = g.name;
  lbName.textContent = g.name;
  lbEng.textContent = g.code + " · " + g.year;
  lbMeta.innerHTML = "";
  for (const s of [g.platforms, (CHARS_BY_GAME[g.code] || []).length + " персонажей"]) {
    const sp = document.createElement("span");
    sp.textContent = s;
    lbMeta.append(sp);
  }
  lbDesc.textContent = g.description;
  lbChars.innerHTML = "";
  for (const nm of CHARS_BY_GAME[g.code] || []) {
    const sp = document.createElement("span");
    sp.textContent = nm;
    lbChars.append(sp);
  }
  lbPos.textContent = (lbIndex + 1) + " / " + lbList.length;
}

function showLightbox() {
  lightbox.hidden = false;
  document.body.classList.add("lb-open");
  renderLb();
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.classList.remove("lb-open");
}

function stepLb(d) {
  if (!lbList.length) return;
  lbIndex = (lbIndex + d + lbList.length) % lbList.length;
  renderLb();
}

function openLightbox(id, cardEl) {
  const cont = cardEl ? containerOf(cardEl) : null;
  lbList = cont ? [...cont.get()] : GAMES.map(g => g.id);
  if (!lbList.includes(id)) lbList = GAMES.map(g => g.id);
  lbIndex = Math.max(0, lbList.indexOf(id));
  showLightbox();
}

lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-prev").addEventListener("click", () => stepLb(-1));
document.getElementById("lb-next").addEventListener("click", () => stepLb(1));
document.addEventListener("keydown", e => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  else if (e.key === "ArrowRight") stepLb(1);
  else if (e.key === "ArrowLeft") stepLb(-1);
});

loadState();
render();
