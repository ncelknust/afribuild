// Continent explorer: zoomable vector map, indicator dock and a country sheet.
import { polyMap } from "../map.js";
import { ICON, esc, chem, fmt, RAMPS, NODATA, TIERS, tierTag, $, $$ } from "../ui.js";

export const LAYERS = [
  { id: "readiness", ic: ICON.chart, t: "Data readiness", d: "Availability of the data needed to account for building carbon, 0 to 1", f: RAMPS.ochre, max: 1, get: c => c.readiness.index, fmt: v => fmt(v, 2), ticks: ["0", "0.5", "1"] },
  { id: "measured", ic: ICON.brick, t: "Measured factors", d: "Materials, of 21, with a factor measured with national data", f: RAMPS.mint, max: 5, get: c => c.tiers.T1 || null, fmt: v => `${v} of 21`, ticks: ["1", "3", "5+"], zero: "none measured" },
  { id: "studies", ic: ICON.book, t: "Published studies", d: "Embodied-carbon studies of the country's materials or buildings", f: RAMPS.mint, max: 20, log: true, get: c => c.studies || null, fmt: v => `${v} ${v === 1 ? "study" : "studies"}`, ticks: ["1", "5", "20"], zero: "no study" },
  { id: "offshore", ic: ICON.ship, t: "Cement CO2 emitted abroad", d: "Share of cement process CO2 in consumption emitted where imports are produced", f: RAMPS.ember, max: 100, get: c => c.cement?.offshore_pct ?? null, fmt: v => fmt(v, 0) + "%", ticks: ["0%", "50%", "100%"], zero: "no trade data" },
  { id: "cementcap", ic: ICON.build, t: "Cement CO2 per person", d: "Cement-related CO2 embodied in consumption, kg per person per year", f: RAMPS.ember, max: 250, get: c => c.cement?.co2_kg_cap || null, fmt: v => fmt(v, 0) + " kg", ticks: ["0", "125", "250+"] },
  { id: "grid", ic: ICON.bolt, t: "Grid carbon", d: "Carbon intensity of electricity, g CO2e per kWh, life-cycle basis", f: RAMPS.sky, max: 900, get: c => c.grid?.value ?? null, fmt: v => fmt(v, 0) + " g/kWh", ticks: ["0", "450", "900"] },
  { id: "floors", ic: ICON.home, t: "Earth floors", d: "Households with earth, sand or dung floors, latest survey", f: RAMPS.ochre, max: 100, get: c => c.floor?.natural_last ?? null, fmt: v => fmt(v, 1) + "%", ticks: ["0%", "50%", "100%"], zero: "no survey" },
];
export function layerColour(L, v) {
  if (v === null || v === undefined) return NODATA;
  const t = L.log ? Math.log(v + 1) / Math.log(L.max + 1) : v / L.max;
  return L.f(0.12 + Math.min(1, Math.max(0, t)) * 0.88);
}

export default async function explore(root, { data, params, sub }) {
  const [S, G] = await Promise.all([data.study(), data.geo()]);
  const C = S.countries, tierName = Object.fromEntries(S.tiers.map(t => [t.code, t.name]));
  let L = LAYERS.find(l => l.id === params.layer) || LAYERS[0], sel = C[params.iso] ? params.iso : null;
  root.innerHTML = `<div class="explore">
    <aside class="side" aria-label="Map indicators">
      ${sub}<div class="eyebrow">Explore</div><h1>Explore by country</h1><p class="sub">Choose an indicator, then select a country on the map or from the list. Drag to pan; scroll or use the buttons to zoom.</p>
      <div class="field" style="margin-top:20px"><label for="jump">Go to a country</label>
      <select id="jump"><option value="">Select a country</option>${Object.entries(C).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([i, c]) => `<option value="${i}">${esc(c.name)}</option>`).join("")}</select></div>
      <div class="layers">${LAYERS.map(l => `<button class="layer" data-l="${l.id}" aria-pressed="${l === L}"><span class="ic">${l.ic}</span><span><b>${chem(l.t)}</b><small>${chem(l.d)}</small></span></button>`).join("")}</div>
    </aside>
    <div class="mapwrap" id="mw">
      <div class="maptools"><button id="zin" aria-label="Zoom in">+</button><button id="zout" aria-label="Zoom out">−</button><button id="zre" aria-label="Reset view">${ICON.reset}</button></div>
      <div class="ramp" id="ramp"></div>
      <div class="sheet" id="sheet" aria-live="polite"></div>
    </div></div>`;
  const tipEl = document.querySelector(".tip");
  const map = polyMap($("#mw", root), G, {
    onPick: iso => pick(iso, true),
    tip: (iso, e) => { const c = C[iso]; if (!c) return; const v = L.get(c); e.target.setAttribute("data-tip", `${c.name}|${v == null ? (L.zero || "no data") : L.fmt(v)}`); },
  });
  function paint() {
    map.fill(iso => C[iso] ? layerColour(L, L.get(C[iso])) : NODATA);
    const stops = [0, .25, .5, .75, 1].map(t => L.f(0.12 + t * 0.88)).map(c => `<i style="background:${c}"></i>`).join("");
    $("#ramp", root).innerHTML = `<div class="t">${chem(L.t)}</div><div class="scale">${stops}</div><div class="ticks">${L.ticks.map(x => `<span>${esc(x)}</span>`).join("")}</div>
      <div class="legend"><span><i class="sw" style="background:${NODATA}"></i>${esc(L.zero || "no data")}</span></div>`;
    $$(".layer", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.l === L.id));
    if (sel) sheet(sel);
  }
  function sheet(iso) {
    const c = C[iso], t = c.tiers, row = S.matrix[iso], v = L.get(c);
    $("#sheet", root).innerHTML = `<button class="close" aria-label="Close">×</button>
      <div class="eyebrow">${esc(c.bloc)}</div><h2>${esc(c.name)}</h2><p class="muted sm" style="margin-top:4px">${fmt(c.population / 1e6, 1)} million people</p>
      <div class="kpis" style="margin-top:20px"><div class="kpi a"><b>${v == null ? "n/a" : L.fmt(v)}</b><span>${chem(L.t)}${v == null ? ": " + esc(L.zero || "no data") : ""}</span></div></div>
      <div class="divider"></div>
      <div class="label">Best available emission factor for each of 21 materials</div>
      <div class="minitiers">${row.map((r, i) => `<i class="sw ${TIERS[r[0]]}" style="width:auto;height:16px" data-tip="${esc(S.materials[i].name)}|${TIERS[r[0]]} ${esc(tierName[TIERS[r[0]]])}${r[1] != null ? "|" + fmt(r[1]) + " " + esc(S.materials[i].unit) : ""}"></i>`).join("")}</div>
      <div class="tiercount">${TIERS.map(k => `<span>${tierTag(k)}<b>${t[k]}</b></span>`).join("")}</div>
      <dl class="kv">
        <dt>Data readiness</dt><dd>${fmt(c.readiness.index, 2)} (rank ${c.readiness.rank} of 54)</dd>
        <dt>Studies</dt><dd>${c.studies}</dd>
        <dt>Cement CO<sub>2</sub></dt><dd>${c.cement ? fmt(c.cement.full_kt / 1e3, 2) + " Mt a year" : "n/a"}</dd>
        <dt>Emitted abroad</dt><dd>${c.cement?.offshore_pct != null ? fmt(c.cement.offshore_pct, 0) + "% of cement process CO<sub>2</sub>" : "no trade data"}</dd>
        <dt>Grid</dt><dd>${c.grid ? fmt(c.grid.value, 0) + " g CO<sub>2</sub>e/kWh" : "n/a"}</dd>
      </dl>
      <div class="btns" style="margin-top:20px"><a class="btn sm" href="#/country/${iso}">Open country profile</a><a class="btn sm ghost" href="#/build?iso=${iso}">Estimate here</a></div>`;
    $("#sheet", root).classList.add("open");
    $("#sheet .close", root).onclick = () => { sel = null; map.select(null); $("#sheet", root).classList.remove("open"); map.reset(); };
  }
  function pick(iso, zoom) {
    if (!C[iso]) return; sel = iso; map.select(iso); sheet(iso); $("#jump", root).value = iso;
    if (zoom) { const b = G.shapes[iso].bbox, size = Math.max(b[2] - b[0], b[3] - b[1]), wide = innerWidth > 900; map.zoomTo(iso, size < 40 ? 3.2 : size < 120 ? 1.6 : 0.8, wide ? 0.2 : 0); }
    history.replaceState(null, "", `#/explore?layer=${L.id}&iso=${iso}`);
  }
  $$(".layer", root).forEach(b => b.onclick = () => { L = LAYERS.find(l => l.id === b.dataset.l); paint(); history.replaceState(null, "", `#/explore?layer=${L.id}${sel ? "&iso=" + sel : ""}`); });
  $("#jump", root).onchange = e => e.target.value && pick(e.target.value, true);
  $("#zin", root).onclick = () => map.zoom(0.7); $("#zout", root).onclick = () => map.zoom(1.4); $("#zre", root).onclick = () => map.reset();
  setTimeout(() => { map.relayout(); map.reset(); paint(); if (sel) pick(sel, true); }, 30);
  document.querySelector("footer").style.display = "none";
  return () => { document.querySelector("footer").style.display = ""; };
}
