const DEFAULT_TIERS = [
  { key: "S", color: "#e05a4e" },
  { key: "A", color: "#e69a3c" },
  { key: "B", color: "#e6d13c" },
  { key: "C", color: "#6fbf4e" },
  { key: "D", color: "#4e9fe6" },
  { key: "F", color: "#9a8be6" },
];

function fillChips(row, items) {
  row.innerHTML = "";
  for (const x of items) {
    const s = document.createElement("span");
    s.textContent = x;
    row.append(s);
  }
}

export function initTierList(cfg) {
  const byId = Object.fromEntries(cfg.items.map(i => [i.id, i]));
  const LS_KEY = cfg.lsPrefix;

  const tiersEl = document.getElementById("tiers");
  const poolEl = document.getElementById("pool");
  const searchEl = document.getElementById("search");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbName = document.getElementById("lb-name");
  const lbSub = document.getElementById("lb-sub");
  const lbMeta = document.getElementById("lb-meta");
  const lbExtra = document.getElementById("lb-extra");
  const lbPos = document.getElementById("lb-pos");
  let tiers, pool;
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
      for (const it of cfg.items) if (!known.has(it.id) && !pool.includes(it.id)) pool.push(it.id);
    } else {
      tiers = DEFAULT_TIERS.map(t => ({ ...t, label: t.key, items: [] }));
      pool = cfg.items.map(i => i.id);
    }
  }

  function saveState() {
    localStorage.setItem(LS_KEY, JSON.stringify({ tiers, pool }));
  }

  function makeCard(id) {
    const it = byId[id];
    const meta = cfg.card(it);
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.id = id;
    el.draggable = true;
    el.title = meta.title;
    const img = document.createElement("img");
    img.src = meta.img;
    img.alt = meta.alt;
    img.draggable = false;
    const nm = document.createElement("div");
    nm.className = "nm";
    nm.textContent = meta.caption;
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

  function makeScrollBtn(dir) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "row-btn " + (dir < 0 ? "row-btn-prev" : "row-btn-next");
    b.innerHTML = dir < 0
      ? '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9.5 2L4.5 7l5 5"/></svg>'
      : '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4.5 2l5 5-5 5"/></svg>';
    b.tabIndex = -1;
    b.addEventListener("click", () => {
      const zone = b.parentElement.querySelector(".dropzone");
      zone.scrollBy({ left: dir * Math.max(160, zone.clientWidth * 0.6), behavior: "smooth" });
    });
    return b;
  }

  function updateRowBtns(row) {
    const zone = row.querySelector(".dropzone");
    const prev = row.querySelector(".row-btn-prev");
    const next = row.querySelector(".row-btn-next");
    if (!zone || !prev || !next) return;
    const maxScroll = zone.scrollWidth - zone.clientWidth;
    prev.classList.toggle("is-off", maxScroll <= 1 || zone.scrollLeft <= 1);
    next.classList.toggle("is-off", maxScroll <= 1 || zone.scrollLeft >= maxScroll - 1);
  }

  function updateAllRowBtns() {
    document.querySelectorAll(".row").forEach(updateRowBtns);
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
      zone.addEventListener("scroll", () => updateRowBtns(row), { passive: true });
      row.append(lab, makeScrollBtn(-1), zone, makeScrollBtn(1));
      tiersEl.appendChild(row);
    }
    poolEl.innerHTML = "";
    pool.forEach(id => poolEl.appendChild(makeCard(id)));
    document.getElementById("poolcount").textContent = pool.length + " шт.";
    applyFilter();
    updateAllRowBtns();
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
    cardEl.classList.remove("stamped");
    void cardEl.offsetWidth;
    cardEl.classList.add("stamped");
    if (src) syncFromDOM(src);
    syncFromDOM(dest);
    applyFilter();
  });

  searchEl.addEventListener("input", applyFilter);

  function applyFilter() {
    const q = searchEl.value.trim().toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
      const hit = !q || cfg.matches(byId[card.dataset.id], q);
      card.classList.toggle("hidden", !hit);
    });
    updateAllRowBtns();
  }

  window.addEventListener("resize", updateAllRowBtns);

  const resetDialog = document.getElementById("reset-dialog");

  function doReset() {
    tiers = DEFAULT_TIERS.map(t => ({ ...t, label: t.key, items: [] }));
    pool = cfg.items.map(i => i.id);
    render();
    saveState();
  }

  document.getElementById("reset").addEventListener("click", () => {
    document.getElementById("rd-text").textContent = cfg.resetMessage;
    resetDialog.showModal();
  });

  document.getElementById("rd-confirm").addEventListener("click", () => resetDialog.close("confirm"));
  document.getElementById("rd-cancel").addEventListener("click", () => resetDialog.close("cancel"));

  resetDialog.addEventListener("click", e => {
    if (e.target === resetDialog) resetDialog.close("cancel");
  });

  resetDialog.addEventListener("close", () => {
    if (resetDialog.returnValue === "confirm") doReset();
  });

  function renderLb() {
    const it = byId[lbList[lbIndex]];
    if (!it) return;
    const lb = cfg.lightbox(it);
    lbImg.src = lb.img;
    lbImg.alt = lb.alt;
    lbName.textContent = lb.name;
    lbSub.textContent = lb.sub;
    fillChips(lbMeta, lb.chips || []);
    lbExtra.innerHTML = "";
    for (const b of lb.blocks || []) {
      if (b.kind === "text") {
        const p = document.createElement("p");
        p.className = "lb-text";
        p.textContent = b.text;
        lbExtra.append(p);
      } else if (b.kind === "list") {
        const ul = document.createElement("ul");
        ul.className = "lb-list";
        for (const x of b.items) {
          const li = document.createElement("li");
          li.textContent = x;
          ul.append(li);
        }
        lbExtra.append(ul);
      } else if (b.kind === "chips") {
        const wrap = document.createElement("div");
        wrap.className = "lb-block";
        if (b.title) {
          const t = document.createElement("div");
          t.className = "lb-blocktitle";
          t.textContent = b.title;
          wrap.append(t);
        }
        const row = document.createElement("div");
        row.className = "chips";
        fillChips(row, b.items);
        wrap.append(row);
        lbExtra.append(wrap);
      }
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
    lbList = cont ? [...cont.get()] : cfg.items.map(i => i.id);
    if (!lbList.includes(id)) lbList = cfg.items.map(i => i.id);
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
}
