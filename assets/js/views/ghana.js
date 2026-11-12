// Ghana case study: clinker imports by origin, where cement-related CO2 is emitted, factors, scenarios, floors and housing.
import { dotMap } from "../map.js";
import { ICON, esc, fmt, CAT, $, $$, rangeFill, ph, sh, ptitle, kpis, bars } from "../ui.js";
import { hbars, strip, columns, tableView } from "../viz.js";

export default async function ghana(root, { data }) {
  const [S, G, A] = await Promise.all([data.study(), data.geo(), data.cat()]);
  const g = S.ghana, n = g.numbers, tot = n.cement_total_mt, origins = g.origins, col = Object.fromEntries(origins.map((o, i) => [o, CAT[i]]));
  const byY = Object.fromEntries(g.clinker.map(c => [c.year, c])), y0 = g.clinker[0].year, y1 = g.clinker.at(-1).year;
  root.innerHTML = `<div class="wrap page">${ph({ eyebrow: "Ghana case study", title: "Cement, clinker imports and housing in Ghana", lede: "Ghana produces most of its cement by grinding imported clinker. This case study traces where the clinker comes from, where the associated emissions occur, which emission factors are available, and how housing materials are changing." })}
    ${kpis([{ v: `${tot[0]} Mt`, label: `CO<sub>2</sub> a year associated with cement use (95% interval ${tot[1]} to ${tot[2]})`, cls: "b" }, { v: `${fmt(n.offshore_share_pct, 0)}%`, label: "of this emitted outside Ghana", cls: "a" }, { v: `${n.clinker_mean_last5} Mt`, label: "clinker imported a year on average, 2019 to 2024" }, { v: `${n.process_ratio_offshore_to_territorial}×`, label: "process CO<sub>2</sub> embodied in imports relative to that emitted in Ghana", cls: "c" }])}

    <section class="section">${sh({ eyebrow: "Clinker imports", title: "Origin of imported clinker, 2010 to 2024", text: "Select a year or play the sequence. Line width shows tonnes from each origin.",
      right: `<div class="play"><button id="play" aria-label="Play through the years">${ICON.play}</button><span class="yr" id="yr">${y1}</span><input type="range" id="yrs" min="${y0}" max="${y1}" value="${y1}" step="1" aria-label="Year"></div>` })}
      <div class="grid c2 stretch">
        <div class="panel" style="display:flex;align-items:center"><div id="arcmap" style="width:100%"></div></div>
        <div class="panel"><div class="label">Clinker imports in the selected year</div><div class="readout" id="ytot"></div><p class="sm muted" id="ynote" style="min-height:22px;margin-top:6px"></p>
          <div id="ybars" style="margin-top:16px"></div><div class="divider"></div><div class="label">All years</div><div id="ycols"></div><div id="ytab"></div>
          <p class="note">Source: UN Comtrade, reported net weight (HS 252310). Shares by origin are applied to the adopted annual total. Positions of origins outside Africa are approximate.</p></div>
      </div></section>

    <section class="section"><div class="grid c2 stretch">
      <div class="panel">${ptitle({ eyebrow: "Where emissions occur", title: "Cement-related CO<sub>2</sub> by source and location", text: "Mean activity for 2019 to 2024, with 95% intervals." })}
        <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap"><div class="waffle" id="waffle" role="img" aria-label="${n.offshore_share_pct} of 100 squares represent emissions outside Ghana"></div>
          <div class="legend v sm"><span><i class="sw" style="background:var(--accent2)"></i>${fmt(n.offshore_share_pct, 0)} in 100 emitted outside Ghana</span><span><i class="sw" style="background:var(--sky)"></i>${100 - n.offshore_share_pct} in 100 emitted in Ghana</span><span class="muted xs">Each square is 1% of the total</span></div></div>
        <div id="comp" style="margin-top:24px"></div></div>
      <div class="panel">${ptitle({ eyebrow: "Emission factors", title: "Cement factors available for Ghana", text: "None is measured in Ghana. The Egypt-origin value is a verified product declaration for cement made abroad; the screening values omit parts of the life cycle." })}
        <div id="ladder"></div><p class="note"><a href="#/lab?iso=GHA">Explore these inputs in the cement explorer →</a></p></div>
    </div></section>

    <section class="section">${sh({ eyebrow: "Scenarios", title: "Effect of alternative cements", text: "Demand is held at current levels. Reductions apply ratios from the literature, not measurements of Ghanaian products." })}
      <div class="grid main-aside stretch"><div class="panel"><div class="seg" id="scen" style="margin-bottom:20px">${g.scenarios.map((s, i) => `<button data-i="${i}" aria-pressed="${i === 0}">${esc(label(s.scenario))}</button>`).join("")}</div><div id="scenbars"></div></div>
        <div class="panel" id="scenread"></div></div></section>

    <section class="section"><div class="grid c2 stretch">
      <div class="panel">${ptitle({ eyebrow: "Housing", title: "Main floor material by region, 2022", text: "Share of households. Source: Ghana Demographic and Health Survey 2022." })}<div id="regions"></div><div class="legend xs" style="margin-top:14px" id="rkey"></div></div>
      <div class="panel">${ptitle({ eyebrow: "Housing deficit", title: "Embodied carbon of new housing: an illustration", text: `${g.deficit[0].dwellings_million} million dwellings, scaled from one published two-bedroom building. Not a forecast.` })}
        <div class="field"><div class="label">Dwelling size</div><div class="seg full" id="dsize">${[...new Set(g.deficit.map(d => d.floor_area_m2))].map((a, i) => `<button data-v="${a}" aria-pressed="${i === 1}">${a} m²</button>`).join("")}</div></div>
        <div class="field"><div class="label">Wall system</div><div class="seg full" id="dwall">${[...new Set(g.deficit.map(d => d.wall_system))].map((w, i) => `<button data-v="${esc(w)}" aria-pressed="${i === 1}">${esc(w[0].toUpperCase() + w.slice(1))}</button>`).join("")}</div></div>
        <div class="divider"></div><div class="readout" id="dout"></div><p class="sm muted" id="dnote" style="margin-top:10px"></p></div>
    </div></section>

    <section class="section">${sh({ eyebrow: "Facilities", title: "Cement facilities in Ghana", text: "From public company and industry information." })}
      <div class="grid c4">${A.plants.map(p => `<div class="panel"><span class="tag">${esc(p.type)}</span><h4 style="margin-top:12px">${esc(p.name)}</h4><p class="sm" style="margin-top:6px">${esc(p.public_capacity)}</p><p class="xs muted" style="margin-top:8px">${esc(p.note)} [${esc(p.source)}]</p></div>`).join("")}</div>
      <div class="btns" style="margin-top:32px"><a class="btn" href="#/country/GHA">Ghana country profile</a><a class="btn ghost" href="#/build?iso=GHA">Estimate a building in Ghana</a><a class="btn ghost" href="#/about?t=data">Download the Ghana tables</a></div></section></div>`;

  // shipments
  const dm = dotMap($("#arcmap", root), G, { r: 3.3 });
  dm.color(iso => iso === "GHA" ? "#f3ece3" : "#2c241e");
  dm.camera([-190, -490, 840, 640], 10);
  const maxPart = Math.max(...g.clinker.flatMap(c => Object.entries(c.parts).filter(([k]) => k !== "Other origins").map(([, v]) => v)));
  const yrs = []; for (let y = y0; y <= y1; y++) yrs.push(y);
  const slider = $("#yrs", root); rangeFill(slider);
  function showYear(y) {
    $("#yr", root).textContent = y; slider.value = y; slider.style.setProperty("--p", (100 * (y - y0) / (y1 - y0)) + "%");
    columns($("#ycols", root), { cats: yrs.map(v => "'" + String(v).slice(2)), series: origins.map(o => ({ name: o, color: col[o] })), data: yrs.map(v => byY[v] && !byY[v].low_confidence ? origins.map(o => byY[v].parts[o] || 0) : null), unit: "Mt", height: 150, yMax: 8, hi: yrs.indexOf(y) });
    const c = byY[y];
    if (!c || c.low_confidence) {
      dm.clearArcs(); $("#ytot", root).innerHTML = `<span class="muted">${c ? "Withheld" : "Not reported"}</span>`;
      $("#ynote", root).textContent = c ? "The 2017 record (12 Mt) is implausible and is withheld as low confidence." : "No clinker imports were reported for 2020.";
      $("#ybars", root).innerHTML = ""; return;
    }
    $("#ytot", root).innerHTML = `${fmt(c.total_mt, 2)}<small>Mt</small>`; $("#ynote", root).textContent = "";
    const parts = origins.map(o => [o, c.parts[o] || 0]).filter(p => p[1] > 0.005).sort((a, b) => b[1] - a[1]);
    $("#ybars", root).innerHTML = bars(parts.map(([o, v]) => ({ label: o, value: fmt(v, 2), parts: [{ v, color: col[o], tip: `${o}|${fmt(v, 2)} Mt` }] })), { lw: 150, vw: 48, max: c.total_mt });
    dm.arcs(parts.filter(([o, v]) => G.points[o] && v >= 0.15).map(([o, v]) => ({ from: G.points[o], w: 1.5 + 14 * v / maxPart, color: col[o], label: o })), G.points.Tema);
  }
  slider.addEventListener("input", e => { stop(); showYear(+e.target.value); });
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; $("#play", root).innerHTML = ICON.play; };
  $("#play", root).onclick = () => {
    if (timer) return stop();
    let y = +slider.value >= y1 ? y0 : +slider.value + 1; showYear(y); $("#play", root).innerHTML = ICON.pause;
    timer = setInterval(() => { y++; if (y > y1) return stop(); showYear(y); }, 1400);
  };
  $("#ytab", root).innerHTML = tableView(["Year", "Total (Mt)", ...origins], yrs.map(y => byY[y] ? [String(y), byY[y].low_confidence ? "withheld" : byY[y].total_mt, ...origins.map(o => byY[y].low_confidence ? "" : (byY[y].parts[o] ?? 0))] : [String(y), "not reported", ...origins.map(() => "")]));
  showYear(y1);

  // where emitted
  const w = $("#waffle", root); w.innerHTML = Array.from({ length: 100 }, () => "<i></i>").join("");
  const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect(); $$("i", w).forEach((el, i) => setTimeout(() => { el.style.background = i < n.offshore_share_pct ? "var(--accent2)" : "var(--sky)"; }, i * 10)); }, { threshold: .3 });
  io.observe(w);
  hbars($("#comp", root), { rows: g.components.map((c, i) => ({ label: c.name, v: c.v[0], lo: c.v[1], hi: c.v[2], color: i < 2 ? "#e8714a" : "#73b9e3" })), xLabel: "Mt CO2 a year", labelW: 190, rowH: 32 });
  const kc = { partial: "#8a7c6e", study: "#7fc49a", illustrative: "#73b9e3", measured: "#e8714a" };
  strip($("#ladder", root), { rows: g.factor_ladder.map(f => ({ label: f.name, v: f.v[0], lo: f.v[1], hi: f.v[2], color: kc[f.kind], diamond: f.kind === "measured" })), xLabel: "kg CO2e per tonne of cement", labelW: 210, rowH: 34 });

  // scenarios
  const base = g.scenarios[0];
  function scen(i) {
    const s = g.scenarios[i];
    $$("#scen button", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.i === i));
    hbars($("#scenbars", root), { rows: g.scenarios.map((x, k) => ({ label: label(x.scenario), v: x.total_mt, lo: x.total_low, hi: x.total_high, color: k === i ? "#e9b44c" : "#4a4038", tip: `${x.scenario}|${x.total_mt} Mt (95% interval ${x.total_low} to ${x.total_high})|${x.factor_kg_per_t} kg CO2e per t cement` })), xLabel: "Mt CO2 a year", labelW: 220, rowH: 34 });
    $("#scenread", root).innerHTML = `${ptitle({ eyebrow: "Selected scenario", title: esc(s.scenario) })}
      <div class="readout">${fmt(s.total_mt, 2)}<small>Mt CO<sub>2</sub> a year</small></div><p class="sm muted" style="margin-top:6px">95% interval ${s.total_low} to ${s.total_high}</p>
      <div class="divider"></div>${kpis([{ v: `${s.change_vs_current_pct > 0 ? "+" : ""}${fmt(s.change_vs_current_pct, 0)}%`, label: `relative to current cement (${fmt(base.total_mt, 2)} Mt)`, cls: s.change_vs_current_pct < 0 ? "c" : "" }])}
      <dl class="kv"><dt>Average factor</dt><dd>${s.factor_kg_per_t} kg CO<sub>2</sub>e per t cement</dd></dl>`;
  }
  $("#scen", root).addEventListener("click", e => { const b = e.target.closest("button"); if (b) scen(+b.dataset.i); });
  scen(1);

  // floors by region
  const R = g.regions.slice().sort((a, b) => b.natural_pct - a.natural_pct), F = [["natural_pct", "Earth, sand or dung", "#b0773a"], ["cement_pct", "Cement", "#9aa4aa"], ["ceramic_tile_pct", "Ceramic tile", "#73b9e3"], ["carpet_pct", "Carpet", "#e48aa8"], ["vinyl_pct", "Vinyl", "#7fc49a"]];
  $("#regions", root).innerHTML = bars(R.map(r => ({ label: r.region, value: fmt(+r.natural_pct, 0) + "%", parts: F.map(f => ({ v: +r[f[0]] || 0, color: f[2], tip: `${r.region}: ${f[1]}|${fmt(+r[f[0]] || 0, 1)}% of households` })) })), { lw: 110, vw: 40, max: 100 });
  $("#rkey", root).innerHTML = F.map(f => `<span><i class="sw" style="background:${f[2]}"></i>${f[1]}</span>`).join("") + `<span class="muted">Figure at right: earth floors</span>`;

  // deficit
  const dsel = { a: g.deficit[2].floor_area_m2, w: g.deficit[1].wall_system };
  function deficit() {
    const d = g.deficit.find(x => x.floor_area_m2 === +dsel.a && x.wall_system === dsel.w), other = g.deficit.find(x => x.floor_area_m2 === +dsel.a && x.wall_system !== dsel.w);
    $("#dout", root).innerHTML = `${fmt(d.embodied_mt, 1)}<small>Mt CO<sub>2</sub>e in total</small>`;
    $("#dnote", root).innerHTML = `${fmt(d.intensity_kg_m2, 0)} kg CO<sub>2</sub>e per m², cradle to site; equivalent to about ${fmt(d.embodied_mt / tot[0], 0)} years of Ghana's current cement-related CO<sub>2</sub>. ${other ? `With ${esc(other.wall_system)} walls: ${fmt(other.embodied_mt, 1)} Mt.` : ""} The source building study used United Kingdom material factors.`;
  }
  ["dsize", "dwall"].forEach(id => $("#" + id, root).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $$(`#${id} button`, root).forEach(x => x.setAttribute("aria-pressed", x === b)); if (id === "dsize") dsel.a = b.dataset.v; else dsel.w = b.dataset.v; deficit(); }));
  deficit();
  return () => { stop(); io.disconnect(); };
}
const label = s => s.replace(" (clinker ratio 0.60-0.80)", "").replace("All cement at clinker ratio 0.60", "Clinker ratio 0.60").replace("Current average cement", "Current cement").replace(" + gas-fired clinker supply", " + gas kilns");
