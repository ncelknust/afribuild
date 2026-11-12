// Emission factors: all 1,134 material-by-country cells, filterable, with a spotlight on one material.
import { esc, chem, fmt, TIERS, TIER_HEX, tierTag, BLOCS, BLOC_HEX, $, $$, ph, sh, ptitle } from "../ui.js";
import { strip, tableView } from "../viz.js";

export default async function materials(root, { data, params, sub }) {
  const S = await data.study(), C = S.countries, M = S.materials, N = S.numbers;
  const tierName = Object.fromEntries(S.tiers.map(t => [t.code, t.name]));
  let bloc = "", sort = "region", mi = params.m != null && M[+params.m] ? +params.m : 1, cell = null;
  const isosBy = () => Object.keys(C).filter(i => !bloc || C[i].bloc === bloc).sort((a, b) =>
    sort === "measured" ? (C[b].tiers.T1 - C[a].tiers.T1) || (C[a].tiers.T0 - C[b].tiers.T0) || C[a].name.localeCompare(C[b].name)
      : (BLOCS.indexOf(C[a].bloc) - BLOCS.indexOf(C[b].bloc)) || C[a].name.localeCompare(C[b].name));

  root.innerHTML = `<div class="wrap page">${ph({ sub, eyebrow: "Methods", title: "Emission factor catalogue", lede: `The catalogue holds the best open emission factor for 21 priority materials in each of 54 countries, ${fmt(N.matrix_cells)} values in all. Each value is assigned a tier that describes how it was obtained.` })}
    <div class="panel">
      <div class="label">All ${fmt(N.matrix_cells)} values by tier</div>
      <div class="meter tall">${TIERS.map(t => `<i style="width:${N.matrix_tier_pct[t]}%;background:${t === "T0" ? "repeating-linear-gradient(135deg,transparent 0 4px,#6b6158 4px 5px)" : TIER_HEX[t]}" data-tip="${t} ${esc(tierName[t])}|${N.matrix_tiers[t]} values (${N.matrix_tier_pct[t]}%)"></i>`).join("")}</div>
      <div class="legend" style="margin-top:14px">${S.tiers.map(t => `<span>${tierTag(t.code, t.name)} ${N.matrix_tiers[t.code]} (${N.matrix_tier_pct[t.code]}%)</span>`).join("")}</div>
    </div>
    <section class="section">${sh({ title: "All materials in all countries", text: "Rows are materials and columns are countries. Select a material name for its spotlight, a country code for its profile, or any cell for its value. A dot marks a cell where a local study exists but no national value has yet been extracted.",
      right: `<div class="seg" id="sort"><button data-s="region" aria-pressed="true">By region</button><button data-s="measured" aria-pressed="false">Most national data first</button></div>` })}
      <div class="chips" id="blocs" style="margin-bottom:16px"><button class="chip" data-b="" aria-pressed="true">All regions</button>${BLOCS.map(b => `<button class="chip" data-b="${b}" aria-pressed="false"><i class="d" style="background:${BLOC_HEX[b]}"></i>${b}</button>`).join("")}</div>
      <div class="panel scroll"><div class="mx" id="mx"></div></div>
    </section>
    <section class="section" id="spot"></section></div>`;

  function drawMatrix() {
    const isos = isosBy(), mx = $("#mx", root); mx.style.gridTemplateColumns = `216px repeat(${isos.length}, minmax(14px, 1fr))`;
    let h = "";
    if (sort === "region" && !bloc) { h += `<div></div>`; let k = 0; BLOCS.forEach(b => { const n = isos.filter(i => C[i].bloc === b).length; h += `<div class="bh" style="grid-column:${k + 2}/span ${n};border-color:${BLOC_HEX[b]};color:${BLOC_HEX[b]}">${b}</div>`; k += n; }); }
    h += `<div></div>` + isos.map(i => `<button class="ch" data-iso="${i}" title="${esc(C[i].name)}">${i}</button>`).join("");
    M.forEach((m, r) => {
      h += `<button class="rh ${r === mi ? "on" : ""}" data-m="${r}" title="${esc(m.name)}">${esc(m.name)}</button>`;
      h += isos.map(i => { const c = S.matrix[i][r], tr = TIERS[c[0]];
        return `<button class="c ${tr}${c[7] ? " pend" : ""}${cell && cell[0] === i && cell[1] === r ? " sel" : ""}" data-iso="${i}" data-m="${r}" data-tip="${esc(C[i].name)} · ${esc(m.name)}|${tr} ${esc(tierName[tr])}${c[1] != null ? "|" + fmt(c[1]) + " " + esc(m.unit) : "|no suitable open value"}" aria-label="${esc(C[i].name)}, ${esc(m.name)}: ${tr}"></button>`; }).join("");
    });
    mx.innerHTML = h;
  }
  function spotlight() {
    const m = M[mi], counts = Object.fromEntries(TIERS.map(t => [t, 0]));
    Object.keys(C).forEach(i => counts[TIERS[S.matrix[i][mi][0]]]++);
    const rows = Object.keys(C).map(i => ({ i, c: S.matrix[i][mi] })).sort((a, b) => a.c[0] - b.c[0] || (b.c[1] ?? -1) - (a.c[1] ?? -1) || C[a.i].name.localeCompare(C[b.i].name));
    const sel = cell ? S.matrix[cell[0]][cell[1]] : null, needs = S.needs[m.code.split("-")[0]] || [];
    $("#spot", root).innerHTML = `${sh({ eyebrow: "Material spotlight", title: esc(m.name), text: m.unit ? `Values in ${chem(m.unit)}, with 95% intervals, for every country that has one.` : "No African country has a suitable open value for this material.", right: `<div class="legend xs">${TIERS.map(t => `<span>${tierTag(t)} ${counts[t]}</span>`).join("")}</div>` })}
      <div class="grid main-aside start">
        <div class="panel">${counts.T0 === 54 ? `<div class="empty"><strong>No suitable open value in any country</strong>This is one of the clearest gaps in the catalogue.<div class="btns"><a class="btn sm" href="#/contribute?m=${mi}">Contribute data</a></div></div>` : `<div id="stripv"></div><div id="stript"></div>`}</div>
        <div class="grid">
          ${sel ? `<div class="panel">${ptitle({ eyebrow: "Selected value", title: `${esc(M[cell[1]].name)}, ${esc(C[cell[0]].name)}` })}
            <div class="readout">${sel[1] == null ? '<span class="muted">No value</span>' : fmt(sel[1])}<small>${sel[1] == null ? "" : chem(M[cell[1]].unit)}</small></div>
            <div style="margin-top:12px">${tierTag(TIERS[sel[0]], tierName[TIERS[sel[0]]])}</div>
            <dl class="kv">${sel[1] != null ? `<dt>95% interval</dt><dd>${fmt(sel[2])} to ${fmt(sel[3])}</dd>` : ""}<dt>Basis</dt><dd>${chem(sel[5])}</dd><dt>Sources</dt><dd>${esc(sel[4] || "none")}</dd></dl>
            <div class="btns" style="margin-top:20px"><a class="btn sm ghost" href="#/country/${cell[0]}?m=${cell[1]}">Country profile</a>${sel[0] ? `<a class="btn sm" href="#/contribute?iso=${cell[0]}&m=${cell[1]}">Contribute data</a>` : ""}</div></div>` : ""}
          <div class="panel">${ptitle({ eyebrow: "Data needed", title: "What a national value requires", text: "Items from the AfriBuild data-collection protocol." })}<ul class="sm">${needs.map(n => `<li>${esc(n)}</li>`).join("")}</ul>
            <div class="btns" style="margin-top:20px"><a class="btn sm" href="#/contribute?m=${mi}">Contribute data</a></div></div>
        </div></div>`;
    if (counts.T0 < 54) {
      const shown = rows.filter(r => r.c[1] != null), col = t => t === "T4" ? "#9a8670" : TIER_HEX[t];
      strip($("#stripv", root), { rows: shown.map(r => ({ label: C[r.i].name, v: r.c[1], lo: r.c[2], hi: r.c[3], color: col(TIERS[r.c[0]]), diamond: r.c[0] === 0, tip: `${C[r.i].name}|${fmt(r.c[1])} ${m.unit}|95% interval ${fmt(r.c[2])} to ${fmt(r.c[3])}|${TIERS[r.c[0]]} ${tierName[TIERS[r.c[0]]]}` })), xLabel: m.unit, labelW: 170, rowH: 20 });
      $("#stript", root).innerHTML = `<div class="legend xs" style="margin-top:12px">${["T1", "T2", "T3", "T4"].map(t => `<span><i class="sw" style="background:${col(t)}"></i>${t} ${esc(tierName[t])}</span>`).join("")}</div>` + tableView(["Country", "Tier", "Value", "Low", "High", "Basis", "Sources"], rows.map(r => [C[r.i].name, TIERS[r.c[0]], r.c[1] ?? "no value", r.c[2] ?? "", r.c[3] ?? "", r.c[5], r.c[4]]));
    }
  }
  $("#mx", root).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("ch")) { location.hash = "#/country/" + b.dataset.iso; return; }
    if (b.classList.contains("rh")) { mi = +b.dataset.m; cell = null; }
    if (b.classList.contains("c")) { mi = +b.dataset.m; cell = [b.dataset.iso, mi]; }
    drawMatrix(); spotlight(); history.replaceState(null, "", `#/materials?m=${mi}`);
    $("#spot", root).scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#blocs", root).addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; bloc = b.dataset.b; $$("#blocs .chip", root).forEach(x => x.setAttribute("aria-pressed", x === b)); drawMatrix(); });
  $("#sort", root).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; sort = b.dataset.s; $$("#sort button", root).forEach(x => x.setAttribute("aria-pressed", x === b)); drawMatrix(); });
  drawMatrix(); spotlight();
  if (params.m != null) setTimeout(() => $("#spot", root).scrollIntoView({ behavior: "smooth" }), 300);
}
