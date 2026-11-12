// Vector map engine. Geometry comes pre-projected from data/geo.json (plate carree, units of 0.1 degree,
// y pointing down). Two renderers: a polygon map with smooth zoom and pan, and a dot-matrix map for the story.
import { esc } from "./ui.js";
const NS = "http://www.w3.org/2000/svg";
export const AFRICA = [-190, -390, 730, 750];   // x, y, w, h

function animateViewBox(svg, from, to, ms = 700, done) {
  const t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
  const step = t => {
    const k = Math.min(1, (t - t0) / ms), e = ease(k), v = from.map((a, i) => a + (to[i] - a) * e);
    svg.setAttribute("viewBox", v.join(" ")); if (k < 1) requestAnimationFrame(step); else done && done();
  };
  requestAnimationFrame(step);
}
function fitBox(b, svg, pad = 0.12) {
  const r = svg.getBoundingClientRect(), aspect = (r.width || 4) / (r.height || 3);
  let [x0, y0, x1, y1] = b, w = x1 - x0, h = y1 - y0; w *= 1 + pad * 2; h *= 1 + pad * 2;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (w / h > aspect) h = w / aspect; else w = h * aspect;
  return [cx - w / 2, cy - h / 2, w, h];
}

// ---- polygon map with zoom, pan, hover and selection
export function polyMap(host, geo, { onPick, tip, labels = false } = {}) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Map of Africa");
  svg.innerHTML = `<defs><filter id="softglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g class="land"></g><g class="over"></g>`;
  host.prepend(svg);
  const land = svg.querySelector(".land"), paths = {};
  for (const [iso, s] of Object.entries(geo.shapes)) {
    if (iso === "ESH") continue;
    const p = document.createElementNS(NS, "path"); p.setAttribute("d", s.d); p.setAttribute("class", "country"); p.dataset.iso = iso;
    p.setAttribute("tabindex", "0"); p.setAttribute("role", "button"); p.setAttribute("aria-label", s.name);
    land.appendChild(p); paths[iso] = p;
  }
  let vb = fitBox([AFRICA[0], AFRICA[1], AFRICA[0] + AFRICA[2], AFRICA[1] + AFRICA[3]], svg, 0.02), home = vb.slice();
  svg.setAttribute("viewBox", vb.join(" "));
  const relayout = () => { home = fitBox([AFRICA[0], AFRICA[1], AFRICA[0] + AFRICA[2], AFRICA[1] + AFRICA[3]], svg, 0.02); };
  // interaction
  let drag = null, moved = false;
  svg.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, vb: vb.slice() }; moved = false; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", e => {
    if (!drag) { const t = e.target.closest?.(".country"); if (t && tip) tip(t.dataset.iso, e); return; }
    const r = svg.getBoundingClientRect(), dx = (e.clientX - drag.x) * vb[2] / r.width, dy = (e.clientY - drag.y) * vb[3] / r.height;
    if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) { moved = true; svg.classList.add("dragging"); }
    if (moved) { vb = [drag.vb[0] - dx, drag.vb[1] - dy, vb[2], vb[3]]; svg.setAttribute("viewBox", vb.join(" ")); }
  });
  svg.addEventListener("pointerup", e => {
    svg.classList.remove("dragging");
    if (!moved) { const t = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".country"); if (t && onPick) onPick(t.dataset.iso); }
    drag = null;
  });
  svg.addEventListener("keydown", e => { const t = e.target.closest?.(".country"); if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPick && onPick(t.dataset.iso); } });
  svg.addEventListener("wheel", e => {
    e.preventDefault(); const r = svg.getBoundingClientRect(), k = Math.exp(e.deltaY * 0.0015);
    const mx = vb[0] + (e.clientX - r.left) / r.width * vb[2], my = vb[1] + (e.clientY - r.top) / r.height * vb[3];
    const w = Math.min(Math.max(vb[2] * k, 40), home[2] * 1.6), h = w * vb[3] / vb[2];
    vb = [mx - (mx - vb[0]) * w / vb[2], my - (my - vb[1]) * h / vb[3], w, h]; svg.setAttribute("viewBox", vb.join(" "));
  }, { passive: false });
  const api = {
    svg, paths,
    fill(fn) { for (const [iso, p] of Object.entries(paths)) p.style.fill = fn(iso); },
    select(iso) { for (const [k, p] of Object.entries(paths)) p.classList.toggle("sel", k === iso); if (iso && paths[iso]) paths[iso].parentNode.appendChild(paths[iso]); },
    zoomTo(iso, pad = 0.6, shift = 0) { const s = geo.shapes[iso]; if (!s) return; const to = fitBox(s.bbox, svg, pad); to[0] += to[2] * shift; animateViewBox(svg, vb, to, 750); vb = to; },
    zoom(k) { const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2, w = vb[2] * k, h = vb[3] * k, to = [cx - w / 2, cy - h / 2, w, h]; animateViewBox(svg, vb, to, 350); vb = to; },
    reset() { relayout(); animateViewBox(svg, vb, home, 700); vb = home.slice(); },
    relayout,
  };
  addEventListener("resize", () => { relayout(); });
  return api;
}

// ---- dot-matrix map (story). Returns an api to recolour dots, draw arcs and move the camera.
export function dotMap(host, geo, { r = 3.1 } = {}) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", AFRICA.join(" ")); svg.setAttribute("class", "dotmap"); svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Map of Africa drawn as dots, coloured by the indicator described in the text");
  svg.innerHTML = `<defs><radialGradient id="dmglow"><stop offset="0" stop-color="#e8714a" stop-opacity=".35"/><stop offset="1" stop-color="#e8714a" stop-opacity="0"/></radialGradient></defs><g class="dots"></g><g class="arcs"></g><g class="pts"></g>`;
  host.appendChild(svg);
  const g = svg.querySelector(".dots"), frag = document.createDocumentFragment(), byIso = {};
  geo.dots.forEach(([x, y, iso], i) => {
    const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r);
    c.style.fill = "#3a3029"; c.style.transitionDelay = ((x - AFRICA[0]) / AFRICA[2] * 380 + (i % 7) * 12) + "ms";
    frag.appendChild(c); (byIso[iso] = byIso[iso] || []).push(c);
  });
  g.appendChild(frag);
  let vb = AFRICA.slice();
  return {
    svg,
    color(fn) { for (const [iso, cs] of Object.entries(byIso)) { const v = fn(iso); cs.forEach(c => { c.style.fill = v; }); } },
    camera(to, ms = 1100) { animateViewBox(svg, vb, to, ms); vb = to.slice(); },
    clearArcs() { svg.querySelector(".arcs").innerHTML = ""; svg.querySelector(".pts").innerHTML = ""; },
    arcs(list, dest) {   // list: [{from:[x,y], w, color, label}]
      const A = svg.querySelector(".arcs"), Pg = svg.querySelector(".pts"); A.innerHTML = ""; Pg.innerHTML = "";
      list.forEach((a, i) => {
        const [x0, y0] = a.from, [x1, y1] = dest, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
        let nx = -dy / len, ny = dx / len; if (ny > 0) { nx = -nx; ny = -ny; }   // perpendicular that bows upwards
        const cx = mx + nx * len * 0.3, cy = my + ny * len * 0.3;
        const p = document.createElementNS(NS, "path"); p.setAttribute("d", `M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`);
        p.setAttribute("class", "arc draw"); p.style.stroke = a.color; p.style.strokeWidth = a.w; p.style.opacity = .9;
        A.appendChild(p); const L = p.getTotalLength(); p.style.setProperty("--len", L); p.style.animationDelay = (i * 140) + "ms";
        Pg.insertAdjacentHTML("beforeend", `<circle cx="${x0}" cy="${y0}" r="7" fill="${a.color}"/><text x="${x0}" y="${y0 - 14}" text-anchor="middle" fill="#f4ede4" font-size="17" font-family="system-ui,sans-serif">${esc(a.label)}</text>`);
      });
      Pg.insertAdjacentHTML("beforeend", `<circle cx="${dest[0]}" cy="${dest[1]}" r="40" fill="url(#dmglow)"/><circle cx="${dest[0]}" cy="${dest[1]}" r="8" fill="#f4ede4"/><text x="${dest[0] + 14}" y="${dest[1] + 26}" fill="#f4ede4" font-size="18" font-weight="600" font-family="system-ui,sans-serif">Tema</text>`);
    },
  };
}

// small silhouette for a country
export function silhouette(geo, iso) {
  const s = geo.shapes[iso]; if (!s) return "";
  const [x0, y0, x1, y1] = s.bbox, pad = Math.max(x1 - x0, y1 - y0) * 0.08;
  return `<svg class="silhouette" viewBox="${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><linearGradient id="silfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8714a" stop-opacity=".55"/><stop offset="1" stop-color="#e9b44c" stop-opacity=".12"/></linearGradient></defs>
    <path d="${s.d}"/></svg>`;
}
