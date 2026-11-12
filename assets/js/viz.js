// Dark-theme SVG charts sized to their container. Every mark has a tooltip (data-tip); callers add table views.
import { esc, fmt } from "./ui.js";

const reg = new Map(); let tm;
addEventListener("resize", () => { clearTimeout(tm); tm = setTimeout(() => { for (const [el, [f, a]] of reg) el.isConnected ? f(el, a) : reg.delete(el); }, 160); });
const W = el => Math.max(300, Math.round(el.clientWidth || el.parentElement?.clientWidth || 640));
export function niceTicks(max, n = 5) {
  if (!(max > 0)) return [0, 1];
  const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag, out = [];
  for (let v = 0; v < max + step * 0.999; v += step) out.push(+v.toPrecision(12));
  return out;
}
const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "start"}" class="${o.c || ""}" ${o.m ? 'dominant-baseline="middle"' : ""}>${esc(s)}</text>`;
function mount(el, f, a, svg) { reg.set(el, [f, a]); el.classList.add("viz"); el.innerHTML = svg; }

// horizontal bars with optional 95% whiskers. rows: [{label, v, lo, hi, color, tip}]
export function hbars(el, a) {
  const { rows, xLabel = "", labelW = 180, rowH = 30, max } = a, w = W(el), m = { l: Math.min(labelW, w * 0.42), r: 56, t: 4, b: 34 };
  const H = m.t + m.b + rows.length * rowH, pw = w - m.l - m.r;
  const ticks = niceTicks(max || Math.max(...rows.map(r => Math.max(r.hi ?? r.v, r.v)), 0)), top = ticks.at(-1), x = v => m.l + v / top * pw;
  let s = `<svg viewBox="0 0 ${w} ${H}" role="img" aria-label="${esc(xLabel)}">`;
  ticks.forEach(k => { s += `<line class="gl" x1="${x(k)}" x2="${x(k)}" y1="${m.t}" y2="${H - m.b}"/>` + t(x(k), H - m.b + 16, fmt(k), { a: "middle" }); });
  rows.forEach((r, i) => {
    const y = m.t + i * rowH, cy = y + rowH / 2;
    s += t(m.l - 10, cy, r.label, { a: "end", m: 1, c: "lab" });
    s += `<rect class="grow" style="animation-delay:${i * 60}ms" x="${m.l}" y="${y + 6}" width="${Math.max(x(r.v) - m.l, 1.5)}" height="${rowH - 12}" rx="4" fill="${r.color}" tabindex="0" data-tip="${esc(r.tip || `${r.label}|${fmt(r.v)}${r.lo != null && r.hi !== r.lo ? ` (95% interval ${fmt(r.lo)} to ${fmt(r.hi)})` : ""}`)}"/>`;
    let end = x(r.v);
    if (r.lo != null && r.hi != null && r.hi > r.lo) { s += `<path d="M${x(r.lo)} ${cy}H${x(r.hi)}M${x(r.lo)} ${cy - 5}v10M${x(r.hi)} ${cy - 5}v10" stroke="#f4ede4" stroke-opacity=".75" stroke-width="1.3" fill="none"/>`; end = x(r.hi); }
    s += t(end + 8, cy, r.vl ?? fmt(r.v), { m: 1, c: "val" });
  });
  s += `<line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/>` + t(m.l + pw / 2, H - 4, xLabel, { a: "middle" }) + "</svg>";
  mount(el, hbars, a, s);
}

// dots with interval lines. rows: [{label, v, lo, hi, color, diamond, tip}]
export function strip(el, a) {
  const { rows, xLabel = "", labelW = 180, rowH = 24, refs = [] } = a, w = W(el), m = { l: Math.min(labelW, w * 0.42), r: 60, t: 6, b: 34 };
  const H = m.t + m.b + rows.length * rowH, pw = w - m.l - m.r;
  const ticks = niceTicks(Math.max(...rows.flatMap(r => [r.hi ?? 0, r.v ?? 0]), ...refs.map(r => r.v))), top = ticks.at(-1), x = v => m.l + v / top * pw;
  let s = `<svg viewBox="0 0 ${w} ${H}" role="img" aria-label="${esc(xLabel)}">`;
  ticks.forEach(k => { s += `<line class="gl" x1="${x(k)}" x2="${x(k)}" y1="${m.t}" y2="${H - m.b}"/>` + t(x(k), H - m.b + 16, fmt(k), { a: "middle" }); });
  refs.forEach(r => { s += `<line x1="${x(r.v)}" x2="${x(r.v)}" y1="${m.t}" y2="${H - m.b}" stroke="${r.color}" stroke-dasharray="4 4" stroke-width="1.4"/>` + t(x(r.v) + 5, m.t + 10, r.label, { c: "lab" }); });
  rows.forEach((r, i) => {
    const cy = m.t + i * rowH + rowH / 2; s += t(m.l - 10, cy, r.label, { a: "end", m: 1, c: "lab" });
    if (r.v == null) { s += t(m.l + 6, cy, r.empty || "gap: no admissible value", { m: 1 }); return; }
    if (r.lo != null && r.hi > r.lo) s += `<line x1="${x(r.lo)}" x2="${x(r.hi)}" y1="${cy}" y2="${cy}" stroke="${r.color}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`;
    s += r.diamond ? `<path d="M${x(r.v)} ${cy - 7}l7 7-7 7-7-7z" fill="${r.color}"/>` : `<circle cx="${x(r.v)}" cy="${cy}" r="5.5" fill="${r.color}" stroke="#0e0c0a" stroke-width="1.5"/>`;
    s += `<rect x="${m.l}" y="${cy - rowH / 2}" width="${pw + m.r}" height="${rowH}" fill="transparent" tabindex="0" data-tip="${esc(r.tip || `${r.label}|${fmt(r.v)}${r.lo != null ? ` (${fmt(r.lo)} to ${fmt(r.hi)})` : ""}`)}"/>`;
    s += t(x(Math.max(r.hi ?? r.v, r.v)) + 10, cy, fmt(r.v), { m: 1, c: "val" });
  });
  s += t(m.l + pw / 2, H - 4, xLabel, { a: "middle" }) + "</svg>";
  mount(el, strip, a, s);
}

// vertical stacked columns. cats; series [{name,color}]; data[i][j] or null (no bar); notes {cat:"text"}
export function columns(el, a) {
  const { cats, series, data, yLabel = "", unit = "", notes = {}, height = 300, yMax, hi = -1 } = a, w = W(el), m = { l: 46, r: 8, t: 10, b: 30 };
  const tot = data.map(d => d ? d.reduce((p, q) => p + (q || 0), 0) : 0), ticks = niceTicks(yMax || Math.max(...tot)), top = ticks.at(-1);
  const pw = w - m.l - m.r, ph = height - m.t - m.b, bw = pw / cats.length, y = v => m.t + ph - v / top * ph;
  let s = `<svg viewBox="0 0 ${w} ${height}" role="img" aria-label="${esc(yLabel)}">`;
  ticks.forEach(k => { s += `<line class="gl" x1="${m.l}" x2="${w - m.r}" y1="${y(k)}" y2="${y(k)}"/>` + t(m.l - 8, y(k), fmt(k), { a: "end", m: 1 }); });
  cats.forEach((c, i) => {
    const cx = m.l + bw * (i + .5), bwid = Math.min(40, bw * .7); let acc = 0;
    if (data[i]) series.forEach((se, j) => {
      const v = data[i][j] || 0; if (v <= 0) return; const y1 = y(acc + v), h = y(acc) - y1; acc += v;
      s += `<rect class="rise" style="animation-delay:${i * 30}ms;opacity:${hi < 0 || hi === i ? 1 : .35}" x="${cx - bwid / 2}" y="${y1}" width="${bwid}" height="${Math.max(h - 1.5, .8)}" rx="2" fill="${se.color}" tabindex="0" data-tip="${esc(`${c} · ${se.name}|${fmt(v)} ${unit}|total ${fmt(tot[i])} ${unit}`)}"/>`;
    });
    if (notes[c]) s += t(cx, y(0) - 8, notes[c], { a: "middle" });
    if (w > 560 || i % 2 === 0) s += t(cx, height - m.b + 17, c, { a: "middle", c: hi === i ? "val" : "lab" });
  });
  s += `<line class="axis" x1="${m.l}" x2="${w - m.r}" y1="${y(0)}" y2="${y(0)}"/></svg>`;
  mount(el, columns, a, s);
}

// radar for five 0..1 dimensions. dims [{label, v}]
export function radar(el, a) {
  const { dims, color = "#e9b44c", size = 280 } = a, c = size / 2, R = size / 2 - 52, n = dims.length;
  const pt = (i, r) => [c + r * Math.sin(2 * Math.PI * i / n), c - r * Math.cos(2 * Math.PI * i / n)];
  let s = `<svg viewBox="0 0 ${size} ${size}" class="radar" role="img" aria-label="Data readiness by dimension">`;
  [0.25, 0.5, 0.75, 1].forEach(k => { s += `<polygon points="${dims.map((_, i) => pt(i, R * k).join(",")).join(" ")}" fill="none" stroke="rgba(255,236,214,${k === 1 ? .22 : .08})"/>`; });
  dims.forEach((d, i) => { const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 26); s += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="rgba(255,236,214,.08)"/>` + `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" class="lab" style="font-size:11px">${esc(d.label)}</text>`; });
  s += `<polygon points="${dims.map((d, i) => pt(i, R * Math.max(d.v, .02)).join(",")).join(" ")}" fill="${color}" fill-opacity=".28" stroke="${color}" stroke-width="2"/>`;
  dims.forEach((d, i) => { const [x, y] = pt(i, R * Math.max(d.v, .02)); s += `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}" tabindex="0" data-tip="${esc(d.label + "|" + fmt(d.v, 2) + " of 1")}"/>`; });
  el.classList.add("viz"); el.innerHTML = s + "</svg>";
}

// donut ring of parts [{label, v, color}]
export function ring(el, a) {
  const { parts, center = "", sub = "", size = 170 } = a, c = size / 2, r = size / 2 - 12, tot = parts.reduce((p, q) => p + q.v, 0) || 1, C = 2 * Math.PI * r;
  let off = 0, s = `<svg viewBox="0 0 ${size} ${size}" class="ring" role="img" aria-label="${esc(center + " " + sub)}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(255,236,214,.08)" stroke-width="14"/>`;
  parts.forEach(p => { const L = C * p.v / tot; if (L > 0) s += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${p.color}" stroke-width="14" stroke-dasharray="${Math.max(L - 2, .5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${c} ${c})" data-tip="${esc(p.label + "|" + fmt(100 * p.v / tot, 0) + "%")}" style="transition:all .6s"/>`; off += L; });
  s += `<text x="${c}" y="${c - 4}" text-anchor="middle" style="font:600 28px var(--serif);fill:var(--ink)">${esc(center)}</text><text x="${c}" y="${c + 18}" text-anchor="middle" style="font-size:11px">${esc(sub)}</text></svg>`;
  el.classList.add("viz"); el.innerHTML = s;
}

export function tableView(headers, rows, label = "View as table") {
  return `<details class="tv"><summary>${label}</summary><div class="scroll"><table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td${typeof c === "number" ? ' class="r"' : ""}>${typeof c === "number" ? fmt(c) : esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}
