// Carbon estimator: a bill of materials multiplied by the best available factors, with a Monte Carlo interval,
// the share of the result resting on borrowed values, and the same bill evaluated in every country.
import { ICON, esc, chem, fmt, TIERS, TIER_HEX, tierTag, $, download, csvRow, ph, sh, ptitle, bars } from "../ui.js";
import { ring } from "../viz.js";

const DRAWS = 4000;
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(u) { let sp = null; return () => { if (sp !== null) { const v = sp; sp = null; return v; } const a = Math.sqrt(-2 * Math.log(u() || 1e-12)), b = 2 * Math.PI * u(); sp = a * Math.sin(b); return a * Math.cos(b); }; }
const CEMENTS = ["BIN-CEM-I", "BIN-CEM-II", "BIN-LC3"];
// an arbitrary worked example that shows how the estimator works; not a typology and not a typical dwelling
const EXAMPLE = [["BIN-CEM-II", 6], ["CON-RMX", 8], ["MAS-SCB", 30], ["MET-REB", 0.6], ["MET-CGI", 0.5], ["BIO-SAW", 1.2], ["AGG-CRU", 25], ["FIN-PNT", 0.1]];
const tcol = t => t === "T4" ? "#9a8670" : TIER_HEX[t];

export default async function build(root, { data, params, sub }) {
  const S = await data.study(), C = S.countries, M = S.materials, idx = Object.fromEntries(M.map((m, i) => [m.code, i]));
  const tierName = Object.fromEntries(S.tiers.map(t => [t.code, t.name]));
  const usable = M.filter(m => !m.process_only);
  let iso = C[params.iso] ? params.iso : "GHA";
  let lines = params.b ? params.b.split(",").map(s => s.split(":")).filter(([c]) => idx[c] != null).map(([c, q]) => ({ code: c, q: +q || 0 })) : [];
  if (params.add && idx[params.add] != null && !lines.some(l => l.code === params.add)) lines.push({ code: params.add, q: 1 });

  root.innerHTML = `<div class="wrap page">${ph({ sub, eyebrow: "Tools", title: "Embodied carbon estimator", lede: "Enter the materials and quantities of a building or building element. Each quantity is multiplied by the best available emission factor for the selected country, and each factor's uncertainty is carried into the result." })}
    <div class="grid main-aside start">
      <div class="grid">
        <div class="panel">${ptitle({ eyebrow: "Step 1", title: "Country" })}
          <div style="display:flex;gap:16px;align-items:end;flex-wrap:wrap"><div style="flex:1;min-width:220px"><label for="iso">Country of construction</label><select id="iso">${Object.entries(C).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([i, c]) => `<option value="${i}" ${i === iso ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
          <div class="btns"><button class="btn ghost sm" id="ex">Load an example</button><button class="btn ghost sm" id="clr">Clear all</button></div></div></div>
        <div class="panel">${ptitle({ eyebrow: "Step 2", title: "Add materials", text: "The colour of each item shows the tier of its factor in the selected country." })}<div class="palette" id="pal"></div></div>
        <div>${ptitle({ eyebrow: "Step 3", title: "Enter quantities", text: "Tonnes, or cubic metres for concrete." })}<div class="bom" id="bom"></div></div>
      </div>
      <div class="grid sticky">
        <div class="panel">${ptitle({ eyebrow: "Result", title: "Embodied carbon, modules A1 to A3" })}<div class="readout" id="tot"></div><p class="sm muted" id="ci" style="margin-top:6px"></p>
          <div class="divider"></div><div style="display:flex;gap:20px;align-items:center"><div id="ring"></div><div id="conf" class="sm"></div></div></div>
        <div class="panel">${ptitle({ title: "Contribution by material" })}<div id="parts"></div></div>
        <div class="btns"><button class="btn sm" id="share">${ICON.link} Copy link</button><button class="btn ghost sm" id="csv">${ICON.download} Download CSV</button></div>
      </div>
    </div>
    <section class="section" id="across"></section></div>`;

  const cell = (i, mi) => S.matrix[i][mi];
  function palette() {
    $("#pal", root).innerHTML = usable.map(m => { const r = cell(iso, idx[m.code]), t = TIERS[r[0]], on = lines.some(l => l.code === m.code);
      return `<button class="mat" data-c="${m.code}" ${on ? "disabled" : ""} data-tip="${esc(m.name)}|${t} ${esc(tierName[t])}${r[1] != null ? "|" + fmt(r[1]) + " " + esc(m.unit) : "|No suitable factor: will be listed as not counted"}"><i class="sw ${t}"></i>${esc(m.name)}<span class="plus">${on ? "✓" : "+"}</span></button>`; }).join("");
  }
  function bom() {
    if (!lines.length) { $("#bom", root).innerHTML = `<div class="empty"><strong>No materials added yet</strong>Add materials in step 2, or load the example to see how the estimator works.</div>`; return; }
    $("#bom", root).innerHTML = lines.map((l, k) => { const mi = idx[l.code], m = M[mi], r = cell(iso, mi), t = TIERS[r[0]], kg = r[1] == null ? null : l.q * r[1] * m.per_qty;
      return `<div class="line" data-k="${k}"><i class="bar4" style="background:${t === "T0" ? "transparent;border:1px dashed var(--muted)" : tcol(t)}"></i>
        <div class="nm">${esc(m.name)}<small>${tierTag(t, tierName[t])}<span>${r[1] != null ? fmt(r[1]) + " " + chem(m.unit) : "no suitable factor"}</span></small>
          ${CEMENTS.includes(l.code) ? `<select class="swap" aria-label="Cement type">${CEMENTS.map(c => `<option value="${c}" ${c === l.code ? "selected" : ""}>${esc(M[idx[c]].name)}</option>`).join("")}</select>` : ""}</div>
        <div class="q"><input type="number" min="0" step="any" value="${l.q}" aria-label="Quantity of ${esc(m.name)}"><span>${m.qty_unit === "m3" ? "m³" : "t"}</span></div>
        <div class="co">${kg == null ? '<span class="tier T0">not counted</span>' : fmt(kg / 1000, 2) + ' <span class="xs muted">t</span>'}</div>
        <button class="x" aria-label="Remove ${esc(m.name)}">×</button></div>`; }).join("");
  }
  function compute(forIso, z) {
    let tot = 0; const by = { T1: 0, T2: 0, T3: 0, T4: 0 }, gaps = [], items = [];
    lines.forEach(l => { const mi = idx[l.code], m = M[mi], r = cell(forIso, mi), t = TIERS[r[0]];
      if (!l.q) return; if (r[1] == null) { gaps.push(m.name); return; }
      const kg = l.q * r[1] * m.per_qty; tot += kg; by[t] += kg; items.push({ m, t, kg, sig: r[3] > r[2] ? Math.log(r[3] / r[2]) / 3.92 : 0 }); });
    let lo = tot, hi = tot;
    if (z && items.length) { const g = gauss(rng(20261111)), d = new Float64Array(DRAWS); for (let k = 0; k < DRAWS; k++) { let s = 0; for (const it of items) s += it.kg * Math.exp(it.sig * g()); d[k] = s; } d.sort(); lo = d[Math.floor(.025 * DRAWS)]; hi = d[Math.floor(.975 * DRAWS)]; }
    return { tot, by, gaps, items, lo, hi };
  }
  function result() {
    const R = compute(iso, true);
    $("#tot", root).innerHTML = `${fmt(R.tot / 1000, 2)}<small>t CO<sub>2</sub>e</small>`;
    $("#ci", root).innerHTML = R.items.length ? `95% interval ${fmt(R.lo / 1000, 2)} to ${fmt(R.hi / 1000, 2)} t (${DRAWS.toLocaleString("en-GB")} Monte Carlo draws)` : "Add materials to see a result.";
    const parts = ["T1", "T2", "T3", "T4"].map(t => ({ label: `${t} ${tierName[t]}`, v: R.by[t], color: tcol(t) }));
    ring($("#ring", root), { parts, center: R.tot ? fmt(100 * R.by.T1 / R.tot, 0) + "%" : "0%", sub: "national data", size: 140 });
    const borrowed = R.tot ? 100 * (R.by.T3 + R.by.T4) / R.tot : 0;
    $("#conf", root).innerHTML = `<div class="legend v xs">${parts.map(p => `<span><i class="sw" style="background:${p.color}"></i>${esc(p.label)}: ${R.tot ? fmt(100 * p.v / R.tot, 0) : 0}%</span>`).join("")}</div>
      ${R.tot ? `<p class="xs muted" style="margin-top:12px">${fmt(borrowed, 0)}% of the result uses values from other countries or defaults.${R.by.T1 ? "" : ` None uses a factor based on national data for ${esc(C[iso].name)}.`}</p>` : ""}`;
    $("#parts", root).innerHTML = (R.items.length ? bars(R.items.sort((a, b) => b.kg - a.kg).map(i => ({ label: i.m.name, value: fmt(100 * i.kg / R.tot, 0) + "%", parts: [{ v: i.kg, color: tcol(i.t), tip: `${i.m.name}|${fmt(i.kg / 1000, 2)} t CO2e` }] })), { lw: 150, vw: 44 }) : `<p class="sm muted">No materials yet.</p>`) +
      (R.gaps.length ? `<p class="note" style="color:var(--accent)">Not counted because no suitable factor exists: ${R.gaps.map(esc).join(", ")}. The total is incomplete.</p>` : "");
    across();
    history.replaceState(null, "", `#/build?iso=${iso}${lines.length ? "&b=" + lines.map(l => `${l.code}:${l.q}`).join(",") : ""}`);
  }
  function across() {
    const el = $("#across", root); if (!lines.some(l => l.q)) { el.innerHTML = ""; return; }
    const rows = Object.keys(C).map(i => ({ i, ...compute(i, false) })).sort((a, b) => b.tot - a.tot), mx = Math.max(...rows.map(r => r.tot), 1);
    const q = lines.map(l => `${l.code}:${l.q}`).join(",");
    el.innerHTML = `${sh({ eyebrow: "Comparison", title: "The same quantities in every country", text: "Each country's best available factors applied to identical quantities. Colour shows where most of each result comes from; a dashed outline means some materials could not be counted. Select a country to switch to it.",
      right: `<div class="legend xs"><span><i class="sw T1"></i>mainly national data</span><span><i class="sw T2"></i>mainly local models</span><span><i class="sw" style="background:#9a8670"></i>mainly borrowed values</span></div>` })}
      <div class="panel cols2">${rows.map(r => { const share = r.tot ? (r.by.T3 + r.by.T4) / r.tot : 1, colr = r.by.T1 / (r.tot || 1) > .5 ? TIER_HEX.T1 : share > .5 ? "#9a8670" : TIER_HEX.T2;
        return `<a class="xrow ${r.i === iso ? "on" : ""}" href="#/build?iso=${r.i}&b=${q}" data-tip="${esc(C[r.i].name)}|${fmt(r.tot / 1000, 2)} t CO2e|${fmt(100 * r.by.T1 / (r.tot || 1), 0)}% national data, ${fmt(100 * share, 0)}% borrowed${r.gaps.length ? "|not counted: " + esc(r.gaps.join(", ")) : ""}">
          <span>${esc(C[r.i].name)}</span><span class="track"><i style="width:${100 * r.tot / mx}%;background:${colr};${r.gaps.length ? "outline:1px dashed var(--muted);outline-offset:1px" : ""}"></i></span><span>${fmt(r.tot / 1000, 1)}</span></a>`; }).join("")}</div>
      <p class="note">Values in t CO<sub>2</sub>e.</p>`;
  }
  const all = () => { palette(); bom(); result(); };
  function example() { lines = EXAMPLE.map(([c, q]) => ({ code: c, q })); all(); }
  $("#pal", root).addEventListener("click", e => { const b = e.target.closest(".mat"); if (!b || b.disabled) return; lines.push({ code: b.dataset.c, q: 1 }); all(); setTimeout(() => $(`.line[data-k="${lines.length - 1}"] input`, root)?.select(), 50); });
  $("#bom", root).addEventListener("input", e => { const ln = e.target.closest(".line"); if (!ln || e.target.type !== "number") return; const l = lines[+ln.dataset.k]; l.q = Math.max(0, +e.target.value || 0);
    const mi = idx[l.code], r = cell(iso, mi); ln.querySelector(".co").innerHTML = r[1] == null ? '<span class="tier T0">not counted</span>' : fmt(l.q * r[1] * M[mi].per_qty / 1000, 2) + ' <span class="xs muted">t</span>'; result(); });
  $("#bom", root).addEventListener("change", e => { if (!e.target.classList.contains("swap")) return; const k = +e.target.closest(".line").dataset.k; if (lines.some((l, j) => j !== k && l.code === e.target.value)) { e.target.value = lines[k].code; return; } lines[k].code = e.target.value; all(); });
  $("#bom", root).addEventListener("click", e => { if (!e.target.closest(".x")) return; lines.splice(+e.target.closest(".line").dataset.k, 1); all(); });
  $("#iso", root).addEventListener("change", e => { iso = e.target.value; all(); });
  $("#ex", root).onclick = example; $("#clr", root).onclick = () => { lines = []; all(); };
  $("#share", root).onclick = async () => { try { await navigator.clipboard.writeText(location.href); $("#share", root).textContent = "Link copied"; setTimeout(() => { $("#share", root).innerHTML = `${ICON.link} Copy link`; }, 1600); } catch { prompt("Copy this link", location.href); } };
  $("#csv", root).onclick = () => {
    const R = compute(iso, true), rows = [["country", "material", "tier", "quantity", "quantity_unit", "factor", "factor_unit", "ci95_low", "ci95_high", "t_co2e", "source"]];
    lines.forEach(l => { const mi = idx[l.code], m = M[mi], r = cell(iso, mi); rows.push([C[iso].name, m.name, TIERS[r[0]], l.q, m.qty_unit, r[1] ?? "no value", m.unit, r[2] ?? "", r[3] ?? "", r[1] == null ? "" : (l.q * r[1] * m.per_qty / 1000).toFixed(3), r[4]]); });
    rows.push([], ["total_t_co2e", (R.tot / 1000).toFixed(3)], ["ci95_low_t", (R.lo / 1000).toFixed(3)], ["ci95_high_t", (R.hi / 1000).toFixed(3)], ["boundary", "A1-A3; AfriBuild catalogue v0.3.2; preliminary"]);
    download(`AfriBuild_estimate_${iso}.csv`, rows.map(csvRow).join("\n"));
  };
  all();
}
