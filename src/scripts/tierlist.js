import RAW from "../../characters.json";

const CHARACTERS = RAW.characters.map(c => ({
  id: c.id,
  name: c.name,
  nameRu: c.nameRu || c.name,
  games: c.games.join("/"),
  attacks: c.attacks || [],
}));

const BASE = import.meta.env.BASE_URL;
const AVATAR = (BASE.endsWith("/") ? BASE : BASE + "/") + "avatars/";

function dataHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
const VERSION = dataHash(JSON.stringify(CHARACTERS));
const LS_KEY = "re-tierlist-" + VERSION;

const DEFAULT_TIERS = [
  { key: "S", color: "#e05a4e" },
  { key: "A", color: "#e69a3c" },
  { key: "B", color: "#e6d13c" },
  { key: "C", color: "#6fbf4e" },
  { key: "D", color: "#4e9fe6" },
  { key: "F", color: "#9a8be6" },
];

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
const tiersEl = document.getElementById("tiers");
const poolEl = document.getElementById("pool");
const searchEl = document.getElementById("search");
let tiers, pool;

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbName = document.getElementById("lb-name");
const lbEng = document.getElementById("lb-eng");
const lbGames = document.getElementById("lb-games");
const lbAttacks = document.getElementById("lb-attacks");
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
    for (const c of CHARACTERS) if (!known.has(c.id) && !pool.includes(c.id)) pool.push(c.id);
  } else {
    tiers = DEFAULT_TIERS.map(t => ({ ...t, label: t.key, items: [] }));
    pool = CHARACTERS.map(c => c.id);
  }
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify({ tiers, pool }));
}

function makeCard(id) {
  const c = byId[id];
  const el = document.createElement("div");
  el.className = "card";
  el.dataset.id = id;
  el.draggable = true;
  el.title = c.nameRu + "  [" + c.games + "]\n" + c.attacks.join("\n");
  const img = document.createElement("img");
  img.src = AVATAR + id + ".png";
  img.alt = c.nameRu;
  img.draggable = false;
  const nm = document.createElement("div");
  nm.className = "nm";
  nm.textContent = c.nameRu;
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
    const c = byId[card.dataset.id];
    const hit = !q || c.nameRu.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.games.toLowerCase().includes(q);
    card.classList.toggle("hidden", !hit);
  });
}

document.getElementById("reset").addEventListener("click", () => {
  if (!confirm("Убрать всех из линий обратно в банк?")) return;
  tiers = DEFAULT_TIERS.map(t => ({ ...t, label: t.key, items: [] }));
  pool = CHARACTERS.map(c => c.id);
  render();
  saveState();
});

function renderLb() {
  const c = byId[lbList[lbIndex]];
  if (!c) return;
  lbImg.src = AVATAR + c.id + ".png";
  lbImg.alt = c.nameRu;
  lbName.textContent = c.nameRu;
  lbEng.textContent = c.name;
  lbGames.innerHTML = "";
  for (const g of c.games.split("/")) {
    const s = document.createElement("span");
    s.textContent = g;
    lbGames.append(s);
  }
  lbAttacks.innerHTML = "";
  for (const a of c.attacks) {
    const li = document.createElement("li");
    li.textContent = a;
    lbAttacks.append(li);
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
  lbList = cont ? [...cont.get()] : CHARACTERS.map(c => c.id);
  if (!lbList.includes(id)) lbList = CHARACTERS.map(c => c.id);
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
