// Country profiles: an index of 54 countries, and one profile per country.
import { silhouette } from "../map.js";
import { ICON, esc, chem, fmt, TIERS, TIER_HEX, tierTag, doi, BLOCS, BLOC_HEX, $, $$, ph, sh, ptitle, kpis } from "../ui.js";
import { radar } from "../viz.js";

const SHORT = n => n.replace(" (process only)", "").replace(" (sandcrete/concrete)", "").replace(" (unstabilised earth)", "").replace(" / calcined-clay cement", "").replace(", normal strength", "");
const shortUnit = u => (u || "").replace("kg CO2e/", "per ").replace("kg CO2/", "per ").replace("m3", "m³");

export default async function country(root, ctx) {
  const S = await ctx.data.study();
  return S.countries[ctx.params.id] ? profile(root, ctx, S) : index(root, ctx, S);
}

function index(root, { sub }, S) {
  const C = S.countries;
  root.innerHTML = `<div class="wrap page">${ph({ sub, eyebrow: "Explore", title: "Country profiles", lede: "Each profile brings together the evidence, the emission factors and the national context for one country. Select a country to open its profile." })}
    <div class="toolbar"><div class="chips" id="blocs"><button class="chip" data-b="" aria-pressed="true">All regions</button>${BLOCS.map(b => `<button class="chip" data-b="${b}" aria-pressed="false"><i class="d" style="background:${BLOC_HEX[b]}"></i>${b}</button>`).join("")}</div>
      <div style="width:260px"><input id="cq" type="search" placeholder="Filter by name" aria-label="Filter countries by name"></div></div>
    <div id="list"></div>
    <div class="legend xs" style="margin-top:24px">${S.tiers.map(t => `<span><i class="sw ${t.code}"></i>${t.code} ${esc(t.name)}</span>`).join("")}<span>Bar: the 21 materials by tier of the best available factor</span></div></div>`;
  let bloc = "";
  const draw = () => {
    const q = $("#cq", root).value.trim().toLowerCase();
    $("#list", root).innerHTML = BLOCS.filter(b => !bloc || b === bloc).map(b => {
      const items = Object.entries(C).filter(([i, c]) => c.bloc === b && (!q || c.name.toLowerCase().includes(q))).sort((x, y) => x[1].name.localeCompare(y[1].name));
      if (!items.length) return "";
      return `<section style="margin-bottom:32px"><h3 style="margin-bottom:12px;color:${BLOC_HEX[b]}">${b}</h3><div class="cgrid">${items.map(([i, c]) => `<a class="ccard" href="#/country/${i}"><b>${esc(c.name)}</b>
        <div class="meter" style="height:8px">${TIERS.map(t => c.tiers[t] ? `<i style="width:${100 * c.tiers[t] / 21}%;background:${t === "T0" ? "repeating-linear-gradient(135deg,transparent 0 3px,#6b6158 3px 4px)" : TIER_HEX[t]}"></i>` : "").join("")}</div>
        <span>${c.studies} ${c.studies === 1 ? "study" : "studies"} · readiness ${fmt(c.readiness.index, 1)}</span></a>`).join("")}</div></section>`;
    }).join("") || `<div class="empty"><strong>No country matches</strong>Clear the filter to see all 54 countries.</div>`;
  };
  $("#blocs", root).addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; bloc = b.dataset.b; $$("#blocs .chip", root).forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); });
  $("#cq", root).addEventListener("input", draw);
  draw();
}

async function profile(root, { data, params, sub }, S) {
  const G = await data.geo();
  const C = S.countries, iso = params.id, c = { ...C[iso], iso }, N = S.numbers, M = S.materials, row = S.matrix[iso];
  const tierName = Object.fromEntries(S.tiers.map(t => [t.code, t.name])), t = c.tiers, cm = c.cement, f = c.floor;
  const order = Object.keys(C).sort((a, b) => C[a].name.localeCompare(C[b].name)), k = order.indexOf(iso);
  const prev = order[(k - 1 + order.length) % order.length], next = order[(k + 1) % order.length];
  const studies = S.evidence.filter(e => e.countries.includes(iso)), ft = S.fulltext.filter(r => r.country === iso && r.value);
  const summary = `${c.studies ? `${c.studies} published ${c.studies === 1 ? "study covers" : "studies cover"} ${esc(c.name)}` : `No published study was found for ${esc(c.name)}`}; ${t.T1 ? `${t.T1} of 21 materials have an emission factor based on national data` : "none of the 21 materials yet has an emission factor based on national data"}${cm?.offshore_pct != null ? `, and an estimated ${fmt(cm.offshore_pct, 0)}% of the process CO<sub>2</sub> in its cement consumption is emitted abroad` : ""}.`;
  const courses = [[0, 6], [6, 12], [12, 18], [18, 21]];
  root.innerHTML = `<div class="wrap page">${sub}
    <div class="dnav"><a href="#/country">← All country profiles</a><div class="btns"><a class="btn sm ghost" href="#/country/${prev}">← ${esc(C[prev].name)}</a><a class="btn sm ghost" href="#/country/${next}">${esc(C[next].name)} →</a></div></div>
    <section class="dh"><div>
        <div class="eyebrow">${esc(c.bloc)} · ${fmt(c.population / 1e6, 1)} million people</div><h1>${esc(c.name)}</h1><p class="lede">${summary}</p>
        ${kpis([{ v: `${c.readiness.rank}`, label: `data-readiness rank of 54 (range ${c.readiness.rank_p5} to ${c.readiness.rank_p95})`, cls: "a" },
          { v: `${t.T1} of 21`, label: "materials with a factor from national data", cls: "c" },
          { v: `${c.studies}`, label: "studies in the evidence library" },
          { v: cm ? fmt(cm.full_kt / 1e3, 2) : "n/a", label: "Mt cement-related CO<sub>2</sub> a year", cls: "b" }])}
      </div><div>${silhouette(G, iso)}</div></section>

    <section class="section">${sh({ eyebrow: "Emission factors", title: "Best available factor for each material", text: `Each brick is one of the 21 priority materials. Colour shows the tier of the best open value for ${esc(c.name)}; dashed outlines are gaps. Select a brick for its value and source.`, right: `<div class="legend xs">${S.tiers.map(x => `<span>${tierTag(x.code, x.name)} ${t[x.code]}</span>`).join("")}</div>` })}
      <div class="grid main-aside start">
        <div class="wall" id="wall">${courses.map(([a, b], ci) => M.slice(a, b).map((m, j) => { const i = a + j, r = row[i], tr = TIERS[r[0]], col = (ci % 2 ? 2 : 1) + j * 2;
          return `<button class="brick ${tr}" style="grid-row:${ci + 1};grid-column:${col} / span 2" data-i="${i}" aria-label="${esc(m.name)}: ${tr} ${esc(tierName[tr])}"><span class="n">${esc(SHORT(m.name))}</span><span class="v">${r[1] == null ? "no value" : fmt(r[1]) + " " + shortUnit(m.unit)}</span></button>`; }).join("")).join("")}</div>
        <div class="panel" id="brick" aria-live="polite"></div>
      </div></section>

    <section class="section"><div class="grid c2 stretch">
      <div class="panel">${ptitle({ eyebrow: "Data readiness", title: "Availability of the data needed", text: `Five dimensions, each scored from 0 to 1 using public data. Index ${fmt(c.readiness.index, 2)}; median across Africa ${fmt(N.ready_median, 2)}.` })}<div id="radar" style="max-width:320px;margin:0 auto"></div></div>
      <div class="panel">${ptitle({ eyebrow: "Cement", title: "Cement-related CO<sub>2</sub> in consumption", text: cm ? `Reference year ${cm.year}. Cement only, all construction.${cm.trade_data ? "" : " No trade was reported, so imports are not counted."}` : "" })}${cm ? cementBlock(c) : `<p class="muted">No cement account is available for this country.</p>`}</div>
    </div></section>

    <section class="section"><div class="grid c2 stretch">
      <div class="panel">${ptitle({ eyebrow: "Housing", title: "Earth floors in households", text: f ? `Demographic and Health Surveys, ${f.first_year} to ${f.last_year} (${f.surveys} surveys).` : "" })}${f ? floorBlock(f) : `<p class="muted">No Demographic and Health Survey with floor materials is available for ${esc(c.name)}.</p>`}
        <p class="note">Wall and roof shares are not shown until they are verified against primary census tables.</p></div>
      <div class="panel">${ptitle({ eyebrow: "Data needs", title: "What would improve this profile", text: "Ranked from the profile's own data." })}<ol>${priorities(c).map(p => `<li class="sm">${p}</li>`).join("")}</ol>
        <div class="btns" style="margin-top:24px"><a class="btn sm" href="#/contribute?iso=${iso}">Contribute data for ${esc(c.name)}</a><a class="btn sm ghost" href="#/build?iso=${iso}">Use in the estimator</a></div></div>
    </div></section>

    ${ft.length ? `<section class="section">${sh({ eyebrow: "Full-text extraction", title: "Values read from published studies" })}<div class="panel scroll" style="padding:8px 12px"><table><thead><tr><th>Study</th><th>Material or object</th><th class="r">Value</th><th>Unit</th><th>Basis</th><th>Use</th></tr></thead><tbody>${ft.map(r => `<tr><td>${esc(r.study)} (${esc(r.year)})</td><td>${esc(r.material_or_object)}</td><td class="r">${esc(r.value)}</td><td>${chem(r.unit)}</td><td class="muted">${esc(r.basis_class)}</td><td>${r.used_in_catalogue ? tierTag(r.used_in_catalogue) : '<span class="muted">not used</span>'}</td></tr>`).join("")}</tbody></table></div></section>` : ""}

    <section class="section">${sh({ eyebrow: "Evidence", title: studies.length ? `${studies.length} ${studies.length === 1 ? "study" : "studies"}` : "No study found", right: studies.length ? `<a class="sm" href="#/evidence?iso=${iso}">Open in the evidence library →</a>` : "" })}
      ${studies.length ? `<div class="studies">${studies.map(e => `<article class="study"><div class="meta">${e.year || ""} · ${esc(e.type)}</div><h4>${esc(e.title)}</h4><div class="meta">${esc(e.authors)}. <i>${esc(e.journal)}</i>. ${doi(e.doi)}</div><div class="chips">${e.materials.map(m => `<span class="tag">${esc(m)}</span>`).join("")}${e.read ? `<span class="tag ok">full text read</span>` : ""}</div></article>`).join("")}</div>`
        : `<div class="empty"><strong>No embodied-carbon study of ${esc(c.name)}'s construction materials was found</strong>All values above are therefore taken from other countries or defaults, or are missing. The search covered ${fmt(N.prisma.identified)} records, mainly in English, so studies in other languages or unindexed reports may exist.<div class="btns"><a class="btn sm" href="#/contribute?iso=${iso}">Suggest a study</a></div></div>`}
    </section></div>`;

  radar($("#radar", root), { dims: [["housing", "Housing data"], ["activity", "Activity data"], ["evidence", "Evidence"], ["epd", "Declarations"], ["grid", "Grid factor"]].map(([key, l]) => ({ label: l, v: c.readiness[key] })), color: "#e9b44c" });
  const showBrick = i => {
    const m = M[i], r = row[i], tr = TIERS[r[0]];
    $$(".brick", root).forEach(b => b.classList.toggle("sel", +b.dataset.i === i));
    $("#brick", root).innerHTML = `${ptitle({ eyebrow: esc(c.name), title: esc(m.name) })}
      <div class="readout">${r[1] == null ? '<span class="muted">No value</span>' : fmt(r[1])}<small>${r[1] == null ? "" : chem(m.unit)}</small></div>
      <div style="margin-top:12px">${tierTag(tr, tierName[tr])}</div>
      <dl class="kv">${r[1] != null ? `<dt>95% interval</dt><dd>${fmt(r[2])} to ${fmt(r[3])}</dd>` : ""}<dt>Basis</dt><dd>${chem(r[5])}</dd><dt>Sources</dt><dd>${esc(r[4] || "none")}</dd>
      <dt>Local studies</dt><dd>${r[6] ? `${r[6]} in the evidence library${r[7] ? "; none yet gives a national value" : ""}` : "none found"}</dd></dl>
      <div class="btns" style="margin-top:20px">${tr !== "T1" ? `<a class="btn sm" href="#/contribute?iso=${iso}&m=${i}">Contribute data</a>` : ""}<a class="btn sm ghost" href="#/materials?m=${i}">Compare across Africa</a></div>`;
  };
  $("#wall", root).addEventListener("click", e => { const b = e.target.closest(".brick"); if (b) showBrick(+b.dataset.i); });
  const t1 = row.findIndex(r => r[0] === 0);
  showBrick(params.m != null ? +params.m : t1 >= 0 ? t1 : 1);
}

function cementBlock(c) {
  const cm = c.cement, terr = Math.min(cm.territorial_kt, cm.process_kt), imp = Math.max(cm.process_kt - terr, 0), fuel = Math.max(cm.full_kt - cm.process_kt, 0), tot = terr + imp + fuel || 1;
  const parts = [["Process, in the country", terr, "#73b9e3"], ["Process, in imports", imp, "#e8714a"], ["Kiln fuel and electricity", fuel, "#8a7c6e"]];
  return `<div class="readout">${fmt(cm.full_kt / 1e3, 2)}<small>Mt CO<sub>2</sub> a year (95% interval ${fmt(cm.full_low / 1e3, 2)} to ${fmt(cm.full_high / 1e3, 2)})</small></div>
    <div class="meter tall" style="margin:20px 0 12px">${parts.map(p => p[1] > 0 ? `<i style="width:${100 * p[1] / tot}%;background:${p[2]}" data-tip="${esc(p[0])}|${fmt(p[1] / 1e3, 2)} Mt"></i>` : "").join("")}</div>
    <div class="legend v sm">${parts.map(p => `<span><i class="sw" style="background:${p[2]}"></i>${p[0]}: ${fmt(100 * p[1] / tot, 0)}%</span>`).join("")}</div>
    <dl class="kv"><dt>Cement use</dt><dd>${fmt(cm.use_kg_cap, 0)} kg per person a year</dd><dt>Per person</dt><dd>${fmt(cm.co2_kg_cap, 0)} kg CO<sub>2</sub> a year</dd>
    ${c.cement_screen ? `<dt>CEM I factor</dt><dd>${fmt(c.cement_screen.cem1[0], 0)} kg CO<sub>2</sub>e/t (${fmt(c.cement_screen.cem1[1], 0)} to ${fmt(c.cement_screen.cem1[2], 0)}); screening model, likely an underestimate</dd>` : ""}</dl>
    <p class="note"><a href="#/lab?iso=${c.iso}">Explore the cement factor in the cement explorer →</a></p>`;
}
function floorBlock(f) {
  return `<div class="kpis"><div class="kpi"><b>${fmt(f.natural_first, 1)}%</b><span>of households, ${f.first_year}</span></div><div class="kpi a"><b>${fmt(f.natural_last, 1)}%</b><span>of households, ${f.last_year}</span></div></div>
    <div style="position:relative;height:28px;margin:24px 0 6px">
      <i style="position:absolute;left:0;right:0;top:12px;height:4px;border-radius:2px;background:var(--surface2)"></i>
      <i style="position:absolute;left:${Math.min(f.natural_last, f.natural_first)}%;width:${Math.abs(f.natural_first - f.natural_last)}%;top:12px;height:4px;background:var(--accent);opacity:.5"></i>
      <i style="position:absolute;left:calc(${f.natural_first}% - 8px);top:6px;width:16px;height:16px;border-radius:50%;border:2px solid var(--accent);background:var(--bg)" data-tip="${f.first_year}|${f.natural_first}%"></i>
      <i style="position:absolute;left:calc(${f.natural_last}% - 8px);top:6px;width:16px;height:16px;border-radius:50%;background:var(--accent)" data-tip="${f.last_year}|${f.natural_last}%"></i></div>
    <div class="legend xs" style="justify-content:space-between"><span>0%</span><span>open circle: first survey; filled: latest</span><span>100%</span></div>
    <p class="sm muted" style="margin-top:16px">${f.change_pp_decade != null ? `Change: ${fmt(f.change_pp_decade, 1)} percentage points per decade. ` : ""}In ${f.last_year}, cement floors ${fmt(f.cement_last, 1)}% and ceramic tile ${fmt(f.ceramic_last, 1)}%.</p>`;
}
function priorities(c) {
  const out = [], cm = c.cement;
  if (cm?.offshore_pct >= 50) out.push(`Origins of imported clinker and cement, with the fuel use and energy efficiency of the producing kilns (about ${fmt(cm.offshore_pct, 0)}% of cement process CO<sub>2</sub> is emitted there).`);
  if (cm && cm.offshore_pct == null) out.push("Trade statistics for clinker and cement, so that imports can be counted.");
  if (!c.tiers.T1) out.push("A first emission factor based on national data. Cement by grade is the largest by volume; a verified product declaration would also inform importing neighbours.");
  if (!c.studies) out.push("Published studies of local materials or buildings; none were found.");
  if (!c.readiness.epd) out.push("Verified environmental product declarations for locally sold products.");
  if (!c.floor) out.push("A household survey or census table of floor, wall and roof materials.");
  out.push("Artisanal fired brick, structural steel sections and PVC pipe, for which no African country has a suitable open value.");
  return out.slice(0, 5);
}
