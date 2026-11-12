// Home: what AfriBuild lets you do, why it matters, how it works, who it is for, and how to get in touch.
import { dotMap } from "../map.js";
import { ICON, esc, fmt, RAMPS, NODATA, $, $$, TIER_HEX, kpis, sh } from "../ui.js";

const sub = s => s.replace(/CO2e/g, "CO<sub>2</sub>e").replace(/CO2/g, "CO<sub>2</sub>");

export default async function home(root, { data }) {
  const [S, G] = await Promise.all([data.study(), data.geo()]);
  const N = S.numbers, C = S.countries, gn = S.ghana.numbers;
  const maxCap = Math.max(...Object.values(C).map(c => c.cement?.co2_kg_cap || 0));

  const INSIGHTS = [
    { fig: `${N.matrix_tier_pct.T1}%`, text: "of emission factors for African building materials are based on national data",
      color: iso => { const t = C[iso]?.tiers; return !t ? NODATA : t.T1 ? TIER_HEX.T1 : "#4b4036"; },
      legend: `<span><i class="sw T1"></i>at least one national factor</span><span><i class="sw" style="background:#4b4036"></i>none</span>`, link: "#/materials" },
    { fig: `${N.ev_countries_zero} of 54`, text: "countries have no published study on the carbon of their building materials",
      color: iso => { const n = C[iso]?.studies || 0; return n ? RAMPS.mint(0.3 + Math.min(1, Math.log(n + 1) / Math.log(21)) * 0.7) : NODATA; },
      legend: ramp("Published studies", RAMPS.mint, "1", "20", "none"), link: "#/evidence" },
    { fig: `${fmt(N.grid_ratio_max_min, 0)}×`, text: "difference in grid carbon intensity between countries, which borrowed factors do not capture",
      color: iso => { const v = C[iso]?.grid?.value; return v ? RAMPS.sky(0.15 + v / 900 * 0.85) : NODATA; },
      legend: ramp("Grid intensity, g CO2e/kWh", RAMPS.sky, "0", "900"), link: "#/explore?layer=grid" },
    { fig: `${N.n_majority_offshore} of 54`, text: "countries import most of the cement emissions they consume, so national inventories do not show them",
      color: iso => { const v = C[iso]?.cement?.offshore_pct; return v == null ? NODATA : RAMPS.ember(0.12 + v / 100 * 0.88); },
      legend: ramp("Share of cement process CO2 emitted abroad", RAMPS.ember, "0%", "100%", "no trade data"), link: "#/explore?layer=offshore" },
  ];

  root.innerHTML = `<div class="wrap">
  <section class="hero">
    <div>
      <h1>The carbon atlas of<br>African building materials</h1>
      <p class="lede">Estimate embodied carbon with the best available emission factors for up to 21 materials in 54 countries, each showing its source and uncertainty.</p>
      <div class="btns"><a class="btn" href="#/build">${ICON.build} Estimate embodied carbon</a><a class="btn ghost" href="#/explore">${ICON.map} Explore countries</a></div>
      ${kpis([{ count: 54, label: "countries" }, { count: 21, label: "materials", cls: "a" }, { count: N.matrix_cells, label: "rated factors", cls: "c" }, { count: N.ev_n, label: "studies", cls: "b" }])}
    </div>
    <div class="hero-map"><div id="heroMap"></div><div class="legend hero-key xs" id="heroKey"></div></div>
  </section>

  <section class="section">${sh({ eyebrow: "What you can do", title: "Tools for every stage of a project" })}
    <div class="features">
      ${feature("#/build", ICON.build, "Estimate embodied carbon", "Enter a bill of materials and get a result with its uncertainty, for any African country.", "Open the estimator")}
      ${feature("#/materials", ICON.brick, "Find emission factors", "Look up the best available factor for 21 materials, with its data quality, interval and source.", "Browse factors")}
      ${feature("#/country", ICON.globe, "Check any country", "See a country's evidence, emission factors, cement emissions and housing materials in one profile.", "View country profiles")}
      ${feature("#/lab", ICON.flask, "Compare cement options", "See how clinker ratio, kiln fuel and electricity change the carbon of a tonne of cement.", "Open the cement explorer")}
    </div>
  </section>

  <section class="section">${sh({ eyebrow: "Why it matters", title: "Most building carbon in Africa is estimated with borrowed numbers", text: "Select a fact to see it on the map." })}
    <div class="why">
      <div class="insights" role="tablist" aria-label="Facts">${INSIGHTS.map((x, i) => `<button class="insight" role="tab" data-i="${i}" aria-selected="${i === 0}"><b>${x.fig}</b><span>${sub(x.text)}</span></button>`).join("")}</div>
      <div class="panel why-map"><div id="whyMap"></div><div class="legend xs" id="whyKey"></div><a class="sm" id="whyLink" href="#">See the details →</a></div>
    </div>
  </section>

  <section class="section">${sh({ eyebrow: "How it works", title: "Three steps to a credible estimate" })}
    <div class="howto">
      ${step(1, "Choose the country", "Every value adapts to the country of construction: its grid, its cement supply and the evidence available.")}
      ${step(2, "Check the data quality", "Each emission factor carries a tier, from measured with national data to missing, and a 95% interval.")}
      ${step(3, "Estimate and report", "Results show their uncertainty and how much rests on borrowed values. Download them or share a link.")}
    </div>
    <div class="btns" style="margin-top:24px"><a class="btn" href="#/build">Start an estimate</a></div>
  </section>

  <section class="section"><div class="highlight">
    <div><div class="eyebrow">Ghana case study</div><h2>Where the carbon in Ghana's cement is emitted</h2>
      <p class="sub">Ghana grinds mostly imported clinker. An estimated ${fmt(gn.offshore_share_pct, 0)}% of the ${gn.cement_total_mt[0]} Mt CO<sub>2</sub> a year associated with its cement use is emitted in the countries that produce the clinker.</p>
      <div class="btns" style="margin-top:20px"><a class="btn ghost" href="#/ghana">Read the case study</a></div></div>
    <div class="kpis"><div class="kpi b"><b>${fmt(gn.offshore_share_pct, 0)}%</b><span>emitted outside Ghana</span></div><div class="kpi a"><b>${gn.clinker_mean_last5} Mt</b><span>clinker imported a year</span></div></div>
  </div></section>

  <section class="section">${sh({ eyebrow: "Who it is for", title: "Built for the people who shape African buildings" })}
    <div class="grid c3">
      ${who("Designers and engineers", "Compare materials with factors for the country of construction, and report results with their uncertainty.")}
      ${who("Governments and standards bodies", "See what a national database of building-material emission factors needs and where data are missing.")}
      ${who("Researchers, producers and funders", "Find where new measurements would improve the data most, and contribute your own.")}
    </div>
  </section>

  <section class="section" style="margin-bottom:72px"><div class="band">
    <div><h2>Work with us</h2><p class="sub">Questions about the data, data partnerships, training or collaboration: contact the Net-Zero Carbon Emission Lab at KNUST.</p></div>
    <div class="btns"><a class="btn" href="#/contact">Contact us</a><a class="btn ghost" href="#/contribute">Contribute data</a></div>
  </div></section></div>`;

  const hero = dotMap($("#heroMap", root), G, { r: 3.2 });
  setTimeout(() => hero.color(iso => { const v = C[iso]?.cement?.co2_kg_cap; return v ? RAMPS.ember(0.15 + Math.min(1, v / maxCap) * 0.85) : NODATA; }), 60);
  $("#heroKey", root).innerHTML = ramp("Cement-related CO2 per person", RAMPS.ember, "low", "high", "no data");

  const why = dotMap($("#whyMap", root), G, { r: 3.2 });
  const pick = i => {
    const x = INSIGHTS[i];
    $$(".insight", root).forEach(b => b.setAttribute("aria-selected", +b.dataset.i === i));
    why.color(x.color); $("#whyKey", root).innerHTML = x.legend; $("#whyLink", root).href = x.link;
  };
  $(".insights", root).addEventListener("click", e => { const b = e.target.closest(".insight"); if (b) pick(+b.dataset.i); });
  setTimeout(() => pick(0), 60);
}

function ramp(title, f, lo, hi, none) {
  const stops = [0, .25, .5, .75, 1].map(t => f(0.15 + t * 0.85)).join(",");
  return `<span><span>${sub(esc(title))}</span></span><span>${esc(lo)}<i style="display:inline-block;width:96px;height:8px;border-radius:4px;background:linear-gradient(90deg,${stops})"></i>${esc(hi)}</span>${none ? `<span><i class="sw" style="background:${NODATA}"></i>${esc(none)}</span>` : ""}`;
}
const feature = (h, ic, t, p, cta) => `<a class="feature" href="${h}"><span class="ic">${ic}</span><h3>${t}</h3><p>${p}</p><em>${cta} →</em></a>`;
const step = (n, t, p) => `<div class="hstep"><span class="no">${n}</span><h3>${t}</h3><p>${p}</p></div>`;
const who = (t, p) => `<div class="panel"><h3>${t}</h3><p class="muted sm" style="margin-top:8px">${p}</p></div>`;
