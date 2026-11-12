// Documentation and downloads: method, tiers, open data, sources, data protection, citation.
import { ICON, esc, chem, fmt, tierTag, $, $$, ph } from "../ui.js";

export default async function about(root, { data, params, sub }) {
  const [S, A, man] = await Promise.all([data.study(), data.cat(), fetch("downloads/manifest.json").then(r => r.json())]);
  const N = S.numbers, Mo = S.cement_model;
  const TABS = [["method", "Method"], ["tiers", "Tiers and uncertainty"], ["data", "Downloads"], ["sources", "Sources"], ["protocol", "Data protection"], ["cite", "Citation and licence"]];
  let tab = TABS.some(t => t[0] === params.t) ? params.t : "method";
  root.innerHTML = `<div class="wrap page">${ph({ sub, eyebrow: "Methods", title: "Documentation and downloads", lede: "AfriBuild accompanies a study by the Net-Zero Carbon Emission Lab (NCEL) at KNUST: an evidence map, a preliminary emission-factor catalogue for Africa and a case study of Ghana. The study is not yet peer reviewed." })}
    <div class="seg" id="tabs" style="margin-bottom:32px">${TABS.map(([k, l]) => `<button data-t="${k}">${l}</button>`).join("")}</div><div id="body"></div></div>`;
  const body = {
    method: () => `<div class="grid c2">
      ${blk("Scope", `Emission factors cover EN 15804 modules A1 to A3: raw material supply, transport to the producer and manufacturing. Building results that include transport to site are labelled as such. Global warming potentials are IPCC AR6, 100-year. Licensed databases (ICE, ecoinvent) are cited but not republished.`)}
      ${blk("Evidence map", `Nine semantic-search queries returned ${fmt(N.prisma.identified)} records. After removing ${fmt(N.prisma.duplicates_removed)} duplicates, ${fmt(N.prisma.screened)} were screened against fixed rules and by one reviewer, and ${N.ev_n} studies were included, two of them from citation chasing. Full texts were sought for ${N.ft_attempted} studies and read for ${N.ft_read}.`)}
      ${blk("Cement screening model", `<p>The national factor is calculated as</p><p class="mono" style="margin:10px 0;color:var(--ink)">${esc(Mo.equation)}</p><p>where r is the clinker-to-cement ratio, q kiln energy (GJ/t clinker), f the kiln fuel factor (kg CO<sub>2</sub>/GJ), w electricity use (kWh/t) and g grid intensity (g/kWh). Inputs are sampled 20,000 times. ${esc(Mo.caveat)}</p>`)}
      ${blk("Consumption account", `Cement-related CO<sub>2</sub> in consumption adds, to process emissions on national territory, the clinker embodied in net imports of clinker and cement (UN Comtrade net weights), with kiln fuel and electricity from the screening model. For Africa: ${fmt(N.africa_consumption_full_mt[0], 0)} Mt a year (95% interval ${fmt(N.africa_consumption_full_mt[1], 0)} to ${fmt(N.africa_consumption_full_mt[2], 0)}).`)}
      ${blk("Data-readiness index", "Five dimensions scored from 0 to 1 using public data: housing-material data, activity data, emission-factor evidence, product declarations and grid factor. Ranks are reported as the median and the 5th to 95th percentile over 5,000 random weightings.")}
      ${blk("Limitations", `<ul><li>One search engine and single-reviewer screening; one query in French, none in Portuguese or Arabic.</li><li>The cement account covers cement only, relies on modelled territorial data, and ${N.trade_missing.length} countries reported no trade in 2021 to 2023.</li><li>Pedigree scores are assigned by tier rather than judged for each source.</li><li>Wall and roof shares are not yet verified and are not shown.</li></ul>`)}</div>`,
    tiers: () => `<div class="grid c2">${S.tiers.map(t => blk(tierTag(t.code, t.name), `${esc(t.long)}.${N.matrix_ci_factor[t.code] ? ` Typical 95% interval: the value divided or multiplied by ${N.matrix_ci_factor[t.code]}.` : ""} ${N.matrix_tiers[t.code]} values (${N.matrix_tier_pct[t.code]}%).`)).join("")}
      ${blk("From data quality to uncertainty", "Each tier carries a five-part pedigree score (reliability, completeness, and temporal, geographical and technological correlation), converted to a lognormal geometric standard deviation using the ecoinvent version 3 variance tables. The estimator carries these intervals through by Monte Carlo simulation, treating factors as independent.")}</div>`,
    data: () => `<div class="panel scroll" style="padding:8px 12px"><table><thead><tr><th>File</th><th>Contents</th><th class="r">Rows</th><th class="r">Size</th><th></th></tr></thead><tbody>${man.map(f => `<tr><td class="mono">${esc(f.file)}</td><td>${chem(f.description)}</td><td class="r">${f.rows == null ? "" : fmt(f.rows, 0)}</td><td class="r">${f.bytes < 1024 ? "under 1" : fmt(f.bytes / 1024, 0)} KB</td><td class="r"><a class="btn sm ghost" href="downloads/${encodeURIComponent(f.file)}" download aria-label="Download ${esc(f.file)}">${ICON.download}</a></td></tr>`).join("")}</tbody></table></div>
      <p class="note">Licensed CC BY 4.0 for NCEL-generated rows. Nothing has yet been deposited in a repository, so there is no persistent identifier.</p>`,
    sources: () => `<div class="panel"><label for="sq">Search the source register</label><input id="sq" type="search" placeholder="Title, publisher or note"><div class="scroll" style="margin-top:16px"><table id="st"></table></div></div>`,
    protocol: () => `<div class="grid c2">
      ${blk("What is requested", "Only what an EN 15804 inventory needs: recipes, yields, energy and fuel use, transport and origins. Nothing beyond that is requested. For informal producers, quantities are weighed and counted in the field rather than recalled.")}
      ${blk("How data are protected", "Plant-level records are stored encrypted on university systems, with access limited to named staff. Producers are identified by code. Published values are means of at least three producers unless a producer agrees in writing to be named. No data are shared with tax or regulatory authorities.")}
      ${blk("Review before publication", "Producers may review any factor derived from their data for 30 days before it is published, and may withdraw from future data collection at any time.")}
      ${blk("Ethics", "Fieldwork with informal producers requires approval from the KNUST ethics committee, informed consent in the participant's language, and compensation for participants' time.")}</div>`,
    cite: () => `<div class="grid c2">${blk("Citation", `Net-Zero Carbon Emission Lab (NCEL), KNUST (2026). <i>AfriBuild / GhaBuild-EF: building-material emission factors for Africa and Ghana</i>, catalogue version ${esc(S.meta.catalogue_version)}. Preliminary research output.`)}
      ${blk("Licence", "Data generated by NCEL: CC BY 4.0. Code: MIT. Third-party statistics remain with their publishers and are cited. Boundaries: Natural Earth, public domain; their depiction does not imply endorsement of any boundary.")}
      ${blk("Privacy", "No cookies, analytics or tracking, and no requests to other websites. Contributions are prepared on your device and sent only if you choose to email them.")}
      ${blk("Contact", `Net-Zero Carbon Emission Lab (NCEL), College of Engineering, Kwame Nkrumah University of Science and Technology, Kumasi, Ghana. <a href="#/contribute">Contribute data</a>.`)}</div>`,
  };
  function draw() {
    $$("#tabs button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.t === tab)); $("#body", root).innerHTML = body[tab]();
    if (tab === "sources") { const q = $("#sq", root), d = () => { const s = q.value.toLowerCase(); $("#st", root).innerHTML = `<thead><tr><th>ID</th><th>Year</th><th>Title</th><th>Publisher</th><th>Note</th></tr></thead><tbody>${A.sources.filter(r => !s || JSON.stringify(r).toLowerCase().includes(s)).map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.year)}</td><td>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>` : esc(r.title)}</td><td>${esc(r.publisher)}</td><td class="muted">${esc(r.note)}</td></tr>`).join("")}</tbody>`; }; q.oninput = d; d(); }
    history.replaceState(null, "", `#/about?t=${tab}`);
  }
  $("#tabs", root).addEventListener("click", e => { const b = e.target.closest("button"); if (b) { tab = b.dataset.t; draw(); } });
  draw();
}
const blk = (h, p) => `<div class="panel"><h3>${h}</h3><div class="muted sm" style="margin-top:10px;line-height:1.65">${p}</div></div>`;
