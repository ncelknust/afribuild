// Evidence library: where the studies are, how the literature has grown, and a searchable list of every study.
import { esc, fmt, doi, BLOCS, BLOC_HEX, CAT, RAMPS, $, ph, sh, ptitle, kpis } from "../ui.js";
import { columns, tableView } from "../viz.js";

const SHORT = { "Cement and clinker": "Cement", "SCMs, calcined clay, geopolymer": "SCMs, calcined clay", "Concrete and mortar": "Concrete", "Cement blocks (sandcrete, concrete block)": "Cement blocks",
  "Fired clay brick": "Fired brick", "Earth (adobe, CEB, rammed, laterite)": "Earth", "Steel and metal roofing": "Steel, roofing", "Aluminium and glass": "Aluminium, glass",
  "Timber, bamboo and bio-based": "Timber, bio-based", "Ceramics, tiles and finishes": "Tiles, finishes", "Aggregates and sand": "Aggregates", "Recycled and waste-derived": "Recycled" };
const tshort = t => t.replace(" (industry, stock, flow)", "").replace(", inventory or emission-factor set", " or factor set").replace(" or bibliometric", "");
const heat = n => n === 0 ? "" : RAMPS.mint(0.3 + Math.min(1, Math.log(n + 1) / Math.log(9)) * 0.7);

export default async function evidence(root, { data, params, sub }) {
  const S = await data.study(), N = S.numbers, C = S.countries, FAM = S.ev_families, E = S.evidence;
  const types = N.ev_types.map(t => t[0]);
  let q = params.q || "", bloc = "", type = "", fam = null, iso = C[params.iso] ? params.iso : null, readOnly = false;
  const isos = Object.keys(C).filter(i => C[i].studies > 0).sort((a, b) => C[b].studies - C[a].studies);
  root.innerHTML = `<div class="wrap page">${ph({ sub, eyebrow: "Methods", title: "Evidence library", lede: `Studies of the embodied carbon of construction materials or buildings in African countries, identified by a systematic search of ${fmt(N.prisma.identified)} records. Each study is coded by country, material and study type.` })}
    ${kpis([{ count: N.ev_n, label: "studies included", cls: "a" }, { count: N.ev_countries_with_study, label: "countries with at least one study" }, { v: `${Math.round(100 * N.ev_cells_filled / N.ev_cells_total)}%`, label: "of country and material combinations studied", cls: "b" }, { v: `${N.ft_read}`, label: `studies read in full; ${N.ft_foreign_factors} of these use foreign factors`, cls: "c" }])}
    <section class="section"><div class="grid main-aside start">
      <div class="panel">${ptitle({ title: "Where the studies are", text: "The countries with at least one study, by material family. Select a cell to filter the list below." })}
        <div class="legend xs" style="margin-bottom:12px">${[1, 2, 3, 5, 8].map(n => `<span><i class="sw" style="background:${heat(n)}"></i>${n}${n === 8 ? " or more" : ""}</span>`).join("")}<span><i class="sw" style="background:var(--surface2)"></i>none</span></div>
        <div class="scroll"><div class="heat" id="heat"></div></div></div>
      <div class="panel">${ptitle({ title: "Studies by year", text: `${N.ev_since_2022_pct}% were published from 2022 onward. The 2026 figure covers January to early November.` })}<div id="years"></div>
        <div class="legend v xs" style="margin-top:12px">${types.map((t, i) => `<span><i class="sw" style="background:${CAT[i]}"></i>${esc(tshort(t))}</span>`).join("")}</div><div id="yt"></div></div>
    </div></section>
    <section class="section" id="lib">${sh({ title: "All studies", text: "Search and filter the library. Tags link to country profiles." })}
      <div class="panel filters">
        <div><label for="q">Search</label><input id="q" type="search" placeholder="Title, author, country or material" value="${esc(q)}"></div>
        <div><label for="fb">Region</label><select id="fb"><option value="">All regions</option>${BLOCS.map(b => `<option>${b}</option>`).join("")}</select></div>
        <div><label for="ft">Study type</label><select id="ft"><option value="">All types</option>${types.map(t => `<option value="${esc(t)}">${esc(tshort(t))}</option>`).join("")}</select></div>
        <label class="check"><input type="checkbox" id="fr"> Read in full only</label>
      </div>
      <div class="sh" style="margin:20px 0 16px"><div id="count" class="sm muted"></div></div>
      <div class="studies" id="cards"></div></section></div>`;

  function drawHeat() {
    const el = $("#heat", root); el.style.gridTemplateColumns = `140px repeat(${FAM.length}, minmax(30px,1fr)) 40px`;
    let h = `<div></div>${FAM.map(f => `<div class="vh">${esc(SHORT[f] || f)}</div>`).join("")}<div class="vh" style="color:var(--ink)">All</div>`;
    isos.forEach(i => {
      h += `<div class="h"><i class="sw" style="background:${BLOC_HEX[C[i].bloc]};width:8px;height:8px"></i>${esc(C[i].name)}</div>`;
      h += S.ev_matrix[i].map((n, j) => `<button class="c ${n ? "" : "z"} ${iso === i && fam === j ? "sel" : ""}" ${n ? `style="background:${heat(n)}"` : ""} data-iso="${i}" data-f="${j}" data-tip="${esc(C[i].name)} · ${esc(FAM[j])}|${n} ${n === 1 ? "study" : "studies"}">${n || ""}</button>`).join("");
      h += `<button class="c ${iso === i && fam === null ? "sel" : ""}" style="background:transparent;color:var(--ink)" data-iso="${i}" data-f="" data-tip="${esc(C[i].name)}|all ${C[i].studies} studies">${C[i].studies}</button>`;
    });
    el.innerHTML = h;
  }
  function list() {
    const s = q.trim().toLowerCase();
    const rows = E.filter(e => (!bloc || e.blocs.includes(bloc)) && (!type || e.type === type) && (!readOnly || e.read) &&
      (!iso || (e.countries.includes(iso) && (fam === null || e.materials.includes(FAM[fam])))) &&
      (!s || [e.title, e.authors, e.journal, ...e.materials, ...e.countries.map(i => C[i]?.name || i)].join(" ").toLowerCase().includes(s)));
    const sel = iso ? `${C[iso].name}${fam !== null ? ", " + FAM[fam] : ""}` : "";
    $("#count", root).innerHTML = `Showing <b style="color:var(--ink)">${rows.length}</b> of ${E.length} studies${sel ? ` for <b style="color:var(--accent)">${esc(sel)}</b> <button class="chip" id="clr" style="margin-left:10px;height:28px">Clear selection ×</button>` : ""}`;
    $("#cards", root).innerHTML = rows.length ? rows.map(e => `<article class="study">
      <div class="meta">${e.year || "n.d."} · ${esc(tshort(e.type))}</div><h4>${esc(e.title)}</h4>
      <div class="meta">${esc(e.authors.length > 110 ? e.authors.slice(0, 108) + "…" : e.authors)}. <i>${esc(e.journal)}</i>. ${doi(e.doi)}</div>
      <div class="chips">${e.countries.map(i => `<a class="tag" href="#/country/${i}">${esc(C[i]?.name || i)}</a>`).join("")}${e.materials.map(m => `<span class="tag">${esc(SHORT[m] || m)}</span>`).join("")}${e.read ? `<span class="tag ok" title="${esc(e.basis)}">read in full</span>` : ""}</div></article>`).join("")
      : `<div class="empty" style="grid-column:1/-1"><strong>No study matches these filters</strong>For a country and material combination this indicates a gap in the evidence.<div class="btns"><a class="btn sm" href="#/contribute${iso ? "?iso=" + iso : ""}">Suggest a study</a></div></div>`;
    const c = $("#clr", root); if (c) c.onclick = () => { iso = null; fam = null; drawHeat(); list(); };
  }
  $("#heat", root).addEventListener("click", e => { const b = e.target.closest("button[data-iso]"); if (!b) return; iso = b.dataset.iso; fam = b.dataset.f === "" ? null : +b.dataset.f; drawHeat(); list(); $("#lib", root).scrollIntoView({ behavior: "smooth" }); });
  $("#q", root).addEventListener("input", e => { q = e.target.value; list(); });
  $("#fb", root).addEventListener("change", e => { bloc = e.target.value; list(); });
  $("#ft", root).addEventListener("change", e => { type = e.target.value; list(); });
  $("#fr", root).addEventListener("change", e => { readOnly = e.target.checked; list(); });
  const years = []; for (let y = 2008; y <= 2026; y++) years.push(y);
  const dat = years.map(y => types.map(t => E.filter(e => e.year === y && e.type === t).length));
  columns($("#years", root), { cats: years.map(y => "'" + String(y).slice(2)), series: types.map((t, i) => ({ name: tshort(t), color: CAT[i] })), data: dat, unit: "studies", height: 200, yMax: 25 });
  $("#yt", root).innerHTML = tableView(["Year", ...types.map(tshort)], years.map((y, i) => [String(y), ...dat[i]]));
  drawHeat(); list();
  if (iso || q) setTimeout(() => $("#lib", root).scrollIntoView({ behavior: "smooth" }), 250);
}
