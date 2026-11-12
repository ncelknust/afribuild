// Contribute: priority data needs, the status of any value, and a contribution prepared on the user's device.
import { esc, chem, fmt, TIERS, tierTag, $, $$, download, ph, sh, ptitle } from "../ui.js";

const CONTACT = "ncel@knust.edu.gh";
export default async function contribute(root, { data, params }) {
  const S = await data.study(), C = S.countries, M = S.materials, tierName = Object.fromEntries(S.tiers.map(t => [t.code, t.name]));
  const idx = Object.fromEntries(M.map((m, i) => [m.code, i]));
  let iso = C[params.iso] ? params.iso : "GHA", mi = params.m != null && M[+params.m] ? +params.m : idx["BIN-CEM-II"];
  const allGap = M.map((m, i) => i).filter(i => Object.keys(C).every(c => S.matrix[c][i][0] === 4));
  const bigCement = Object.entries(C).filter(([i, c]) => c.cement && S.matrix[i][idx["BIN-CEM-I"]][0] !== 0).sort((a, b) => b[1].cement.full_kt - a[1].cement.full_kt).slice(0, 2);
  const wanted = [
    ...bigCement.map(([i, c]) => ({ iso: i, m: idx["BIN-CEM-I"], t: `Cement, ${c.name}`, d: `About ${fmt(c.cement.full_kt / 1e3, 1)} Mt CO2 a year in cement use; no factor from national data.` })),
    ...allGap.map(i => ({ iso, m: i, t: M[i].name, d: "No suitable open value in any of the 54 countries." })),
    { iso: "GHA", m: idx["MAS-SCB"], t: "Sandcrete block, Ghana", d: "The most common walling material in new Ghanaian housing; the current value uses United Kingdom factors." },
  ];
  root.innerHTML = `<div class="wrap page">${ph({ eyebrow: "Contribute", title: "Contribute data", lede: "Producers, laboratories, researchers and public agencies hold data that can replace borrowed values with national ones. Select a material and country to see what is needed, then prepare a contribution. Nothing is sent until you choose to send it." })}
    <section>${sh({ eyebrow: "Priority data needs", title: "Where new data would help most", text: "From the catalogue: the two largest cement users without a national factor, the three materials with no value in any country, and a key Ghanaian material." })}
      <div class="grid c3">${wanted.map(w => `<button class="panel" style="text-align:left;font:inherit;color:inherit;cursor:pointer" data-iso="${w.iso}" data-m="${w.m}"><h3>${esc(w.t)}</h3><p class="sm muted" style="margin-top:8px">${chem(w.d)}</p><p class="sm" style="margin-top:12px;color:var(--accent);font-weight:600">Select →</p></button>`).join("")}</div></section>

    <section class="section" id="form">${sh({ eyebrow: "Contribution", title: "Prepare a contribution" })}
      <div class="grid main-aside start">
        <div class="panel">
          ${ptitle({ eyebrow: "Step 1", title: "Material and country" })}
          <div class="grid c2"><div><label for="ciso">Country</label><select id="ciso">${Object.entries(C).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([i, c]) => `<option value="${i}">${esc(c.name)}</option>`).join("")}</select></div>
            <div><label for="cm">Material</label><select id="cm">${M.map((m, i) => `<option value="${i}">${esc(m.name)}</option>`).join("")}</select></div></div>
          <div id="status" style="margin-top:16px"></div>
          <div class="divider"></div>
          ${ptitle({ eyebrow: "Step 2", title: "The data you hold" })}
          <div id="needs"></div>
          <div class="grid c2" style="margin-top:20px">
            <div><label for="role">You are</label><select id="role"><option>Producer or manufacturer</option><option>Laboratory or research institute</option><option>University researcher or student</option><option>Government or standards body</option><option>Consultant or practitioner</option><option>Other</option></select></div>
            <div><label for="kind">Type of data</label><select id="kind"><option>Measured at a plant, yard or kiln</option><option>Published study or thesis</option><option>Environmental product declaration</option><option>Official statistics</option><option>Other</option></select></div>
            <div><label for="val">Value (optional)</label><input id="val" inputmode="decimal" placeholder="for example 0.041"></div>
            <div><label for="unit">Unit</label><input id="unit"></div>
            <div><label for="yr">Year of the data</label><input id="yr" inputmode="numeric" placeholder="for example 2025"></div>
            <div><label for="bd">System boundary</label><select id="bd"><option>A1 to A3 (cradle to gate)</option><option>A1 to A4 or A5</option><option>Not sure</option></select></div>
          </div>
          <div class="field" style="margin-top:16px"><label for="src">Source, DOI or link (optional)</label><input id="src" placeholder="doi:… or https://…"></div>
          <div class="field"><label for="note">Description</label><textarea id="note" rows="4" placeholder="What was measured, where, over what period, and how many producers it covers."></textarea></div>
          <div class="divider"></div>
          ${ptitle({ eyebrow: "Step 3", title: "Your details (optional)" })}
          <div class="grid c2"><div><label for="nm">Name</label><input id="nm" autocomplete="name"></div><div><label for="org">Organisation</label><input id="org" autocomplete="organization"></div></div>
          <label class="check" style="margin-top:20px"><input type="checkbox" id="ok"> I agree that NCEL may use these data in the open catalogue at the level of aggregation agreed with me, with acknowledgement, and may contact me about them.</label>
        </div>
        <div class="grid sticky">
          <div class="panel">${ptitle({ title: "Preview" })}<pre id="prev" class="mono" style="white-space:pre-wrap;color:var(--ink2);max-height:320px;overflow:auto;margin:0;line-height:1.5"></pre></div>
          <div class="btns"><button class="btn" id="dl" style="flex:1">Download file</button><a class="btn ghost" id="mail" href="#" style="flex:1">Email NCEL</a></div>
          <p class="note" style="margin-top:0">Download the file, then attach it to an email to the Net-Zero Carbon Emission Lab (${CONTACT}). Plant-level data are published only at the level of aggregation you agree, and never with names unless you ask. <a href="#/about?t=protocol">How data are protected</a>.</p>
        </div></div></section></div>`;

  const F = id => $("#" + id, root);
  function status() {
    const r = S.matrix[iso][mi], m = M[mi], t = TIERS[r[0]];
    F("status").innerHTML = `<div class="panel" style="background:var(--bg)"><div class="label">Current value for ${esc(m.name.toLowerCase())} in ${esc(C[iso].name)}</div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:4px">${tierTag(t, tierName[t])}<span>${r[1] == null ? "no value" : fmt(r[1]) + " " + chem(m.unit)}</span></div>
      <p class="xs muted" style="margin-top:8px">${chem(r[5])}</p></div>`;
    const needs = S.needs[m.code.split("-")[0]] || [];
    F("needs").innerHTML = `<div class="label">Select the items you can provide</div>` + needs.map(n => `<label class="check"><input type="checkbox" class="nd" value="${esc(n)}"> ${esc(n)}</label>`).join("");
    F("unit").value = m.unit || ""; F("ciso").value = iso; F("cm").value = mi; preview();
  }
  function payload() {
    const m = M[mi], r = S.matrix[iso][mi];
    return { app: "AfriBuild", catalogue_version: S.meta.catalogue_version, prepared: new Date().toISOString().slice(0, 10),
      gap: { country: C[iso].name, iso3: iso, material: m.name, material_code: m.code, current_tier: TIERS[r[0]], current_value: r[1], current_unit: m.unit },
      contribution: { contributor_role: F("role").value, data_type: F("kind").value, items_available: $$(".nd", root).filter(x => x.checked).map(x => x.value),
        value: F("val").value || null, unit: F("unit").value || null, year: F("yr").value || null, boundary: F("bd").value, source: F("src").value || null, description: F("note").value || null },
      contact: { name: F("nm").value || null, organisation: F("org").value || null }, consent: F("ok").checked };
  }
  function preview() {
    const p = payload(); F("prev").textContent = JSON.stringify(p, null, 2);
    const subj = `AfriBuild data: ${M[mi].name}, ${C[iso].name}`, body = `Dear NCEL team,\n\nI would like to contribute data on ${M[mi].name} in ${C[iso].name} (currently ${p.gap.current_tier}).\n\nType of data: ${p.contribution.data_type}\nItems: ${p.contribution.items_available.join("; ") || "see the attached file"}\n\nThe file prepared in AfriBuild is attached.\n\n${p.contact.name || ""}${p.contact.organisation ? ", " + p.contact.organisation : ""}`;
    F("mail").href = `mailto:${CONTACT}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    F("dl").disabled = !p.consent; F("dl").title = p.consent ? "" : "Tick the consent box first";
  }
  root.addEventListener("input", e => { if (e.target.closest("#form")) preview(); });
  root.addEventListener("change", e => { if (e.target.id === "ciso") { iso = e.target.value; status(); } else if (e.target.id === "cm") { mi = +e.target.value; status(); } else preview(); });
  $$("button[data-iso]", root).forEach(b => b.onclick = () => { iso = b.dataset.iso; mi = +b.dataset.m; status(); F("form").scrollIntoView({ behavior: "smooth" }); });
  F("dl").onclick = () => { const p = payload(); if (!p.consent) return; download(`AfriBuild_contribution_${iso}_${M[mi].code}.json`, JSON.stringify(p, null, 2), "application/json"); };
  status();
  if (params.iso || params.m != null) setTimeout(() => F("form").scrollIntoView({ behavior: "smooth" }), 250);
}
