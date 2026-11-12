// Cement explorer: the study's screening equation with adjustable inputs, a breakdown, a sensitivity chart and measured comparators.
import { esc, fmt, $, $$, rangeFill, ph, ptitle, bars } from "../ui.js";
import { strip } from "../viz.js";

export default async function lab(root, { data, params, sub }) {
  const S = await data.study(), C = S.countries, Mo = S.cement_model, V = S.numbers.t2_validation;
  const iso0 = C[params.iso]?.grid ? params.iso : "GHA";
  const st = { iso: iso0, r: 0.95, q: Mo.q.mode, f: Mo.fuels[1].f, w: Mo.w.mode, g: C[iso0].grid.value };
  const PRE = [["CEM I", 0.95], ["Global average", Mo.r.mode_avg], ["Blended", 0.6]];
  const calc = s => ({ proc: s.r * Mo.process_kg_per_t_clinker, fuel: s.r * s.q * s.f, elec: s.w * s.g / 1000 });
  const sum = p => p.proc + p.fuel + p.elec;
  root.innerHTML = `<div class="wrap page">${ph({ sub, eyebrow: "Tools", title: "Cement emission factor explorer", lede: "Cement is the largest single source of embodied carbon in most African buildings. Adjust the inputs of the study's screening model within their published ranges and see how the factor responds." })}
    <div class="grid aside-main start">
      <div class="panel sticky">
        ${ptitle({ title: "Inputs" })}
        <div class="ctrl"><label for="iso">Country (sets grid intensity)</label><select id="iso">${Object.entries(C).filter(([, c]) => c.grid).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([i, c]) => `<option value="${i}" ${i === st.iso ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
        <div class="ctrl"><div class="row"><span>${esc(Mo.r.label)}</span><b id="vr"></b></div><div class="seg full" id="pre">${PRE.map(([l, v]) => `<button data-v="${v}">${l}</button>`).join("")}</div>
          <input type="range" id="r" min="${Mo.r.min}" max="${Mo.r.max}" step="0.01" value="${st.r}" aria-label="${esc(Mo.r.label)}"><div class="src">${esc(Mo.r.source)}</div></div>
        <div class="ctrl"><div class="row"><span>Kiln fuel</span><b id="vf"></b></div><div class="seg full" id="fuel">${Mo.fuels.map(f => `<button data-v="${f.f}" title="${esc(f.name)}">${esc({ "Natural gas": "Gas", "Bituminous coal": "Coal", "Petroleum coke": "Petcoke" }[f.name] || f.name)}</button>`).join("")}</div><div class="src" style="margin-top:8px">${esc(Mo.fuel_source)}</div></div>
        <div class="ctrl"><div class="row"><span>${esc(Mo.q.label)}</span><b id="vq"></b></div><input type="range" id="q" min="${Mo.q.min}" max="${Mo.q.max}" step="0.05" value="${st.q}" aria-label="${esc(Mo.q.label)}"><div class="src">${esc(Mo.q.source)}</div></div>
        <div class="ctrl"><div class="row"><span>${esc(Mo.w.label)}</span><b id="vw"></b></div><input type="range" id="w" min="${Mo.w.min}" max="${Mo.w.max}" step="1" value="${st.w}" aria-label="${esc(Mo.w.label)}"><div class="src">${esc(Mo.w.source)}</div></div>
        <div class="ctrl"><div class="row"><span>Grid intensity (g CO<sub>2</sub>e/kWh)</span><b id="vg"></b></div><input type="range" id="g" min="0" max="900" step="5" value="${st.g}" aria-label="Grid carbon intensity"><div class="src" id="gsrc"></div></div>
        <button class="btn ghost sm" id="reset" style="margin-top:24px;width:100%">Reset to study defaults</button>
      </div>
      <div class="grid">
        <div class="panel">${ptitle({ eyebrow: "Result", title: "Screening emission factor" })}<div class="readout" id="out"></div>
          <div class="meter tall" style="margin:20px 0 14px" id="split"></div><div class="legend sm" id="splitk"></div>
          <p class="mono muted" style="margin-top:20px">${esc(Mo.equation)}</p></div>
        <div class="panel">${ptitle({ title: "Sensitivity to each input", text: "Change in the factor when each input moves across its full range, with the other inputs held at your settings." })}<div id="tornado"></div></div>
        <div class="panel">${ptitle({ title: "Comparison with measured values", text: "Your setting beside the study's screen for the selected country and the three verified African values for CEM I." })}<div id="cmp"></div><p class="note">${esc(Mo.caveat)}</p></div>
      </div>
    </div></div>`;

  const ranges = ["r", "q", "w", "g"].map(id => $("#" + id, root));
  const sync = () => ranges.forEach(e => e.style.setProperty("--p", (100 * (e.value - e.min) / (e.max - e.min)) + "%"));
  ranges.forEach(e => { rangeFill(e); e.addEventListener("input", () => { st[e.id] = +e.value; draw(); }); });
  $("#pre", root).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; st.r = +b.dataset.v; $("#r", root).value = st.r; draw(); });
  $("#fuel", root).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; st.f = +b.dataset.v; draw(); });
  $("#iso", root).addEventListener("change", e => { st.iso = e.target.value; st.g = C[st.iso].grid.value; $("#g", root).value = st.g; draw(); });
  $("#reset", root).onclick = () => { Object.assign(st, { r: 0.95, q: Mo.q.mode, f: Mo.fuels[1].f, w: Mo.w.mode, g: C[st.iso].grid.value }); ["r", "q", "w", "g"].forEach(k => { $("#" + k, root).value = st[k]; }); draw(); };

  function draw() {
    sync();
    const p = calc(st), F = sum(p), c = C[st.iso];
    $("#vr", root).textContent = fmt(st.r, 2); $("#vq", root).textContent = fmt(st.q, 2); $("#vw", root).textContent = fmt(st.w, 0); $("#vg", root).textContent = fmt(st.g, 0);
    $("#vf", root).textContent = `${Mo.fuels.find(f => f.f === st.f).name}, ${st.f} kg CO₂/GJ`; $$("#fuel button", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.v === st.f));
    $$("#pre button", root).forEach(b => b.setAttribute("aria-pressed", Math.abs(+b.dataset.v - st.r) < 0.005));
    $("#gsrc", root).textContent = `${c.name}: ${fmt(c.grid.value, 0)} in ${c.grid.year} (Ember)${Math.abs(st.g - c.grid.value) > 3 ? "; adjusted" : ""}`;
    $("#out", root).innerHTML = `${fmt(F, 0)}<small>kg CO<sub>2</sub>e per tonne of cement</small>`;
    const parts = [["Calcination", p.proc, "#e8714a"], ["Kiln fuel", p.fuel, "#e9b44c"], ["Grinding electricity", p.elec, "#73b9e3"]];
    $("#split", root).innerHTML = parts.map(x => `<i style="width:${100 * x[1] / F}%;background:${x[2]}" data-tip="${x[0]}|${fmt(x[1], 0)} kg (${fmt(100 * x[1] / F, 0)}%)"></i>`).join("");
    $("#splitk", root).innerHTML = parts.map(x => `<span><i class="sw" style="background:${x[2]}"></i>${x[0]}: ${fmt(x[1], 0)} kg (${fmt(100 * x[1] / F, 0)}%)</span>`).join("");
    const sweep = [["Clinker ratio", "r", Mo.r.min, Mo.r.max], ["Kiln energy", "q", Mo.q.min, Mo.q.max], ["Kiln fuel", "f", Mo.fuels[0].f, Mo.fuels.at(-1).f], ["Electricity use", "w", Mo.w.min, Mo.w.max], ["Grid intensity", "g", 0, 900]]
      .map(([l, k, a, b]) => { const lo = sum(calc({ ...st, [k]: a })), hi = sum(calc({ ...st, [k]: b })); return { l, lo, hi, d: hi - lo }; }).sort((a, b) => b.d - a.d);
    $("#tornado", root).innerHTML = bars(sweep.map(s => ({ label: s.l, value: `${fmt(s.d, 0)} kg`, parts: [{ v: s.d, color: "#e9b44c", tip: `${s.l}|from ${fmt(s.lo, 0)} to ${fmt(s.hi, 0)} kg CO2e/t` }] })), { lw: 130, vw: 64, max: Math.max(...sweep.map(s => s.d)) }) +
      `<p class="note">Bar length: range of the factor across the input's full range.</p>`;
    const rows = [{ label: "Your setting", v: Math.round(F), color: "#f3ece3" }, ...(c.cement_screen ? [{ label: `${c.name}, study screen`, v: c.cement_screen.cem1[0], lo: c.cement_screen.cem1[1], hi: c.cement_screen.cem1[2], color: "#2a9e78" }] : []),
      ...V.map(v => ({ label: `${C[v.iso3].name}, measured`, v: v.measured, color: "#4fe0a0", diamond: true, tip: `${C[v.iso3].name}, CEM I|${v.measured} kg CO2e/t|${v.source}` }))];
    strip($("#cmp", root), { rows, xLabel: "kg CO2e per tonne of cement", labelW: 200, rowH: 32 });
  }
  draw();
}
