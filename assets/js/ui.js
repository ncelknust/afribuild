// Shared helpers: formatting, icons, tooltip, reveal-on-scroll, count-up, colour scales.
export const TIERS = ["T1", "T2", "T3", "T4", "T0"];
export const TIER_HEX = { T1: "#4fe0a0", T2: "#2a9e78", T3: "#d9a441", T4: "#5d4f3f", T0: "#2a2420" };
export const BLOCS = ["North Africa", "West Africa", "Central Africa", "East Africa", "Southern Africa"];
export const BLOC_HEX = { "North Africa": "#e9b44c", "West Africa": "#4fbf8f", "Central Africa": "#e48aa8", "East Africa": "#73b9e3", "Southern Africa": "#e8714a" };
export const CAT = ["#73b9e3", "#e9b44c", "#4fbf8f", "#e48aa8", "#a89cf0", "#e8714a", "#8c8279"];

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const chem = s => esc(s).replace(/CO2e/g, "CO<sub>2</sub>e").replace(/CO2/g, "CO<sub>2</sub>").replace(/\bm3\b/g, "m<sup>3</sup>").replace(/\bm2\b/g, "m<sup>2</sup>");
export function fmt(v, d) {
  if (v === null || v === undefined || Number.isNaN(+v)) return "n/a";
  const a = Math.abs(v), nd = d !== undefined ? d : a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.1 ? 3 : 4;
  return Number(v).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: nd });
}
export const pct = (v, d = 0) => fmt(v, d) + "%";
export const tierTag = (t, name) => `<span class="tier ${t}">${t}${name ? " · " + esc(name) : ""}</span>`;
export const doi = d => d ? `<a href="https://doi.org/${encodeURI(d)}" target="_blank" rel="noopener">doi:${esc(d)}</a>` : "";
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const P = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  logo: `<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ef8a5f"/><stop offset="1" stop-color="#c24f2a"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#lgm)"/><path d="M10 21.5 24 10l14 11.5" fill="none" stroke="#fff4e8" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><g fill="#fff4e8"><rect x="12" y="24.5" width="11" height="6" rx="1.4"/><rect x="25" y="24.5" width="11" height="6" rx="1.4"/><rect x="12" y="32.5" width="5" height="6" rx="1.4"/><rect x="31" y="32.5" width="5" height="6" rx="1.4"/></g><rect x="19" y="32.5" width="10" height="6" rx="1.4" fill="#4fe0a0"/></svg>`,
  search: `<svg viewBox="0 0 24 24" ${P}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  map: `<svg viewBox="0 0 24 24" ${P}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" ${P}><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>`,
  brick: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 12h18M9 5v7M15 12v7"/></svg>`,
  book: `<svg viewBox="0 0 24 24" ${P}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/></svg>`,
  flask: `<svg viewBox="0 0 24 24" ${P}><path d="M9 3h6M10 3v6L4.5 18.5A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/></svg>`,
  build: `<svg viewBox="0 0 24 24" ${P}><path d="M3 21h18M5 21V10l7-6 7 6v11"/><path d="M9 21v-6h6v6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" ${P}><path d="M12 5v14M5 12h14"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" ${P}><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z"/></svg>`,
  ship: `<svg viewBox="0 0 24 24" ${P}><path d="M3 17c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><path d="M5 14 4 9h16l-1 5M8 9V5h8v4"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" ${P}><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" ${P}><path d="M4 11 12 4l8 7v9H4v-9Z"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" ${P}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" ${P}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" ${P}><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/></svg>`,
  download: `<svg viewBox="0 0 24 24" ${P}><path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/></svg>`,
  link: `<svg viewBox="0 0 24 24" ${P}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`,
  users: `<svg viewBox="0 0 24 24" ${P}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>`,
};

// tooltip: any element with data-tip (use | for line breaks; first line bold)
let tipEl;
export function initTips() {
  tipEl = document.createElement("div"); tipEl.className = "tip"; tipEl.setAttribute("role", "status"); document.body.appendChild(tipEl);
  const show = (t, x, y) => {
    const parts = String(t.getAttribute("data-tip")).split("|");
    tipEl.innerHTML = `<b>${chem(parts[0])}</b>${parts.slice(1).map(chem).join("<br>")}`; tipEl.classList.add("on");
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = clamp(x + 14, 6, innerWidth - w - 6) + "px";
    tipEl.style.top = (y + h + 24 > innerHeight ? y - h - 12 : y + 16) + "px";
  };
  document.addEventListener("pointermove", e => { const t = e.target.closest?.("[data-tip]"); if (t) show(t, e.clientX, e.clientY); else tipEl.classList.remove("on"); });
  document.addEventListener("focusin", e => { const t = e.target.closest?.("[data-tip]"); if (t) { const r = t.getBoundingClientRect(); show(t, r.left + r.width / 2, r.bottom); } });
  document.addEventListener("focusout", () => tipEl.classList.remove("on"));
  addEventListener("scroll", () => tipEl.classList.remove("on"), { passive: true });
}
export const hideTip = () => tipEl && tipEl.classList.remove("on");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export function countUp(root = document) {
  $$("[data-count]", root).forEach(el => {
    const end = parseFloat(el.dataset.count), d = +(el.dataset.dec || 0), suf = el.dataset.suf || "", pre = el.dataset.pre || "";
    if (reduced) { el.textContent = pre + fmt(end, d) + suf; return; }
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), dur = 1300;
      const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + fmt(end * e, d) + suf; if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: .4 });
    io.observe(el);
  });
}
export function reveal(root = document) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  $$(".reveal", root).forEach(el => io.observe(el));
}
export function rangeFill(input) {
  const set = () => input.style.setProperty("--p", (100 * (input.value - input.min) / (input.max - input.min)) + "%");
  input.addEventListener("input", set); set();
}

// colour scales (sequential, one hue family, dark to bright on a dark ground)
const lerp = (a, b, t) => a + (b - a) * t;
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbHex(r) { return "#" + r.map(v => Math.round(v).toString(16).padStart(2, "0")).join(""); }
export function ramp(stops) {
  const S = stops.map(hexRgb);
  return t => { t = clamp(t, 0, 1) * (S.length - 1); const i = Math.min(S.length - 2, Math.floor(t)), f = t - i; return rgbHex(S[i].map((v, k) => lerp(v, S[i + 1][k], f))); };
}
export const RAMPS = {
  ember: ramp(["#2b211b", "#5a3322", "#9c4a2b", "#e8714a", "#ffc9a3"]),
  ochre: ramp(["#2a241a", "#5c4925", "#9a7a33", "#e9b44c", "#ffe2a1"]),
  mint: ramp(["#1d2a24", "#1f4d3d", "#2a9e78", "#4fe0a0", "#c8ffe6"]),
  sky: ramp(["#1b232a", "#244459", "#3f7ea6", "#73b9e3", "#d4efff"]),
};
export const NODATA = "#474b50";   // cool neutral grey, distinct in hue from every warm scale

export function download(name, text, type = "text/csv") {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export const csvRow = r => r.map(v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",");

// ---- page components (the only way views build headers, figures and bar lists)
export const ph = ({ eyebrow = "", title, lede = "", sub = "" }) =>
  `<header class="ph">${sub}${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}<h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}</header>`;
export const sh = ({ eyebrow = "", title, text = "", right = "" }) =>
  `<div class="sh"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}<h2>${title}</h2>${text ? `<p class="sub">${text}</p>` : ""}</div>${right ? `<div>${right}</div>` : ""}</div>`;
export const ptitle = ({ eyebrow = "", title, text = "" }) =>
  `<div class="ptitle">${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}<h3>${title}</h3>${text ? `<p>${text}</p>` : ""}</div>`;
// kpis: [{v, label, cls, count, dec, suf}]
export const kpis = list => `<div class="kpis">${list.map(k => `<div class="kpi ${k.cls || ""}"><b ${k.count != null ? `data-count="${k.count}" data-dec="${k.dec || 0}" data-suf="${k.suf || ""}"` : ""}>${k.count != null ? "0" : k.v}</b><span>${k.label}</span></div>`).join("")}</div>`;
// bars: [{label, parts:[{v,color,tip}], max, value}], options {lw, vw}
export const bars = (rows, { lw = 140, vw = 56, max } = {}) => {
  const M = max || Math.max(...rows.map(r => r.parts.reduce((a, p) => a + p.v, 0)), 1e-9);
  return `<div class="bars" style="--lw:${lw}px;--vw:${vw}px">${rows.map(r => `<div class="bar"><span title="${esc(r.label)}">${esc(r.label)}</span><span class="track ${r.tall ? "tall" : ""}">${r.parts.map(p => `<i style="width:${100 * p.v / M}%;background:${p.color}" ${p.tip ? `data-tip="${esc(p.tip)}"` : ""}></i>`).join("")}</span><span>${r.value ?? ""}</span></div>`).join("")}</div>`;
};
