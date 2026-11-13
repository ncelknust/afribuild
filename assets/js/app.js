// AfriBuild single-page application: router, shell, command palette and data loading.
import { ICON, esc, initTips, hideTip, countUp, reveal, $ } from "./ui.js";

// Navigation follows the workflow: understand, explore, examine the data, apply the tools, contribute.
const NAV = [
  { label: "Explore", href: "#/explore", views: ["explore", "country"], sub: [["#/explore", "Map", "explore"], ["#/country", "Country profiles", "country"]] },
  { label: "Tools", href: "#/build", views: ["build", "lab"], sub: [["#/build", "Carbon estimator", "build"], ["#/lab", "Cement explorer", "lab"]] },
  { label: "Methods", href: "#/materials", views: ["materials", "evidence", "about"], sub: [["#/materials", "Emission factors", "materials"], ["#/evidence", "Evidence library", "evidence"], ["#/about", "Documentation and downloads", "about"]] },
  { label: `<span class="long">Ghana case study</span><span class="short">Ghana</span>`, href: "#/ghana", views: ["ghana"] },
  { label: "Contribute", href: "#/contribute", views: ["contribute"] },
  { label: "Contact", href: "#/contact", views: ["contact"] },
];
const VIEWS = { "": "home", home: "home", explore: "explore", country: "country", materials: "materials", evidence: "evidence", about: "about", build: "build", lab: "lab", ghana: "ghana", contribute: "contribute", contact: "contact" };
const PAGES = [["#/", "Home"], ["#/explore", "Map"], ["#/country", "Country profiles"], ["#/materials", "Emission factors"], ["#/evidence", "Evidence library"], ["#/about", "Documentation and downloads"], ["#/build", "Carbon estimator"], ["#/lab", "Cement explorer"], ["#/ghana", "Ghana case study"], ["#/contribute", "Contribute data"], ["#/contact", "Contact NCEL"]];
function subnav(view) {
  const g = NAV.find(n => n.views.includes(view));
  return g && g.sub ? `<nav class="subnav" aria-label="${esc(g.label)}">${g.sub.map(([h, l, v]) => `<a href="${h}" ${v === view ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</nav>` : "";
}

const cache = {};
const get = p => cache[p] || (cache[p] = fetch(p).then(r => { if (!r.ok) throw new Error(`Could not load ${p} (${r.status})`); return r.json(); }));
export const data = { study: () => get("data/study.json"), geo: () => get("data/geo.json"), cat: () => get("data/afribuild.json") };

function shell() {
  document.body.insertAdjacentHTML("afterbegin", `<button class="skip" id="skip">Skip to content</button>
  <header class="top"><div class="wrap">
    <a class="brand" href="#/" aria-label="AfriBuild home">${ICON.logo}<span class="bn"><b>AfriBuild</b><small>Building materials carbon atlas</small></span></a>
    <nav class="nav" aria-label="Main">${NAV.map(n => `<a href="${n.href}" data-v="${n.views.join(" ")}">${n.label}</a>`).join("")}</nav>
    <a class="by" href="#/about?t=cite" title="Developed by the Net-Zero Carbon Emission Lab (NCEL), KNUST"><span>by</span><b>NCEL</b><span class="dot">·</span><b>KNUST</b></a>
    <button class="kbtn" id="openCmd" aria-label="Search countries, materials and studies">${ICON.search}<span class="lbl">Search</span><kbd>⌘K</kbd></button>
  </div></header>
  <div class="cmd" id="cmd" role="dialog" aria-modal="true" aria-label="Search"><div class="box"><input id="cmdq" placeholder="Search a country, material, study or page" autocomplete="off"><ul id="cmdl" role="listbox"></ul></div></div>`);
  document.body.insertAdjacentHTML("beforeend", `<footer><div class="wrap">
    <div class="fcredit"><a class="brand" href="#/">${ICON.logo}<span class="bn"><b>AfriBuild</b><small>Building materials carbon atlas</small></span></a>
      <p>Developed by the <b>Net-Zero Carbon Emission Lab (NCEL)</b>, College of Engineering, Kwame Nkrumah University of Science and Technology (KNUST), Kumasi, Ghana.</p>
      <p class="xs">Preliminary research output, catalogue v0.3.2. The underlying study is not yet peer reviewed.</p></div>
    <div><h4>Methods</h4><ul><li><a href="#/materials">Emission factors</a></li><li><a href="#/evidence">Evidence library</a></li><li><a href="#/about?t=method">Documentation</a></li><li><a href="#/about?t=data">Downloads</a></li></ul></div>
    <div><h4>Contact</h4><ul><li><a href="#/contact">Contact NCEL</a></li><li><a href="mailto:ncel@knust.edu.gh">ncel@knust.edu.gh</a></li><li><a href="https://ncelknust.org" target="_blank" rel="noopener">ncelknust.org</a></li><li><a href="#/contribute">Contribute data</a></li></ul>
      <p class="xs" style="margin-top:16px"><a href="#/about?t=cite">Citation and licence</a> · <a href="#/about?t=protocol">Data protection</a><br>No cookies, tracking or third-party requests.</p></div>
  </div></footer>`);
}

let cleanup = null, current = "";
async function route() {
  const h = location.hash.replace(/^#\/?/, ""), [path, qs] = h.split("?"), parts = path.split("/").filter(Boolean);
  const key = parts[0] || "home", view = VIEWS[key] || "home", params = Object.fromEntries(new URLSearchParams(qs || "")); params.id = parts[1];
  document.querySelectorAll(".nav a").forEach(a => { if (a.dataset.v.split(" ").includes(view)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  hideTip();
  // While the next view loads, keep the footer out of sight and show a quiet loading state if it takes a moment.
  const main = $("#app"), body = document.body;
  body.classList.add("loading"); main.setAttribute("aria-busy", "true");
  main.innerHTML = "";
  if (!params.keep) scrollTo(0, 0);
  const sig = h; current = sig;
  const wait = setTimeout(() => { if (current === sig && !main.firstChild) main.innerHTML = `<div class="loader" role="status"><span></span>Loading</div>`; }, 150);
  try {
    const mod = await import(`./views/${view}.js`);
    if (current !== sig) return;
    main.innerHTML = "";
    const out = await mod.default(main, { data, params, sub: subnav(view), go: p => { location.hash = p; } });
    if (current !== sig) { if (typeof out === "function") try { out(); } catch (e) { console.error(e); } return; }
    cleanup = typeof out === "function" ? out : null;
    countUp(main); reveal(main);
    const titled = main.querySelector("h1"); document.title = view === "home" ? "AfriBuild · Building materials carbon atlas" : (titled ? titled.textContent.trim().slice(0, 60) + " · " : "") + "AfriBuild";
  } catch (e) {
    console.error(e);
    if (current !== sig) return;
    main.innerHTML = `<div class="wrap page"><div class="panel"><h2>Something did not load</h2><p class="muted">${esc(e.message)}. AfriBuild must be served over http (for example <code>make serve</code>); it cannot run from a file:// address.</p></div></div>`;
  } finally {
    clearTimeout(wait);
  }
  if (current !== sig) return;
  if (!params.keep) scrollTo(0, 0);
  main.removeAttribute("aria-busy"); body.classList.remove("loading");
  if (!prefetched) { prefetched = true; setTimeout(prefetch, 1200); }
}

// After the first page is on screen, fetch the other pages and the data in the background so later pages open at once.
let prefetched = false;
function prefetch() {
  const run = () => {
    data.study().catch(() => {}); data.geo().catch(() => {}); data.cat().catch(() => {});
    [...new Set(Object.values(VIEWS))].forEach(v => import(`./views/${v}.js`).catch(() => {}));
  };
  "requestIdleCallback" in window ? requestIdleCallback(run, { timeout: 3000 }) : run();
}

// command palette
async function palette() {
  const box = $("#cmd"), q = $("#cmdq"), list = $("#cmdl");
  let items = null, act = 0;
  const build = async () => {
    const S = await data.study();
    items = [
      ...PAGES.map(([h, l]) => ({ t: l, k: "Page", h })),
      ...Object.entries(S.countries).map(([iso, c]) => ({ t: c.name, k: "Country", h: "#/country/" + iso, s: iso })),
      ...S.materials.map((m, i) => ({ t: m.name, k: "Material", h: "#/materials?m=" + i })),
      ...S.evidence.map((e, i) => ({ t: e.title, k: `Study · ${e.year || ""}`, h: "#/evidence?q=" + encodeURIComponent(e.title.slice(0, 40)) })),
    ];
  };
  const draw = () => {
    const s = q.value.trim().toLowerCase();
    const hits = (items || []).filter(i => !s || (i.t + " " + (i.s || "")).toLowerCase().includes(s)).sort((a, b) => (a.k === "Study") - (b.k === "Study")).slice(0, 40);
    act = Math.min(act, Math.max(hits.length - 1, 0));
    list.innerHTML = hits.map((i, k) => `<li><a href="${i.h}" class="${k === act ? "act" : ""}" role="option">${esc(i.t.length > 80 ? i.t.slice(0, 78) + "…" : i.t)}<span>${esc(i.k)}</span></a></li>`).join("") || `<li class="muted" style="padding:12px">Nothing found.</li>`;
  };
  const open = async () => { if (!items) await build(); box.classList.add("open"); q.value = ""; act = 0; draw(); q.focus(); };
  const close = () => box.classList.remove("open");
  $("#openCmd").addEventListener("click", open);
  addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); box.classList.contains("open") ? close() : open(); }
    else if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    else if (e.key === "Escape") close();
  });
  q.addEventListener("input", () => { act = 0; draw(); });
  q.addEventListener("keydown", e => {
    const links = list.querySelectorAll("a");
    if (e.key === "ArrowDown") { act = Math.min(act + 1, links.length - 1); draw(); e.preventDefault(); }
    if (e.key === "ArrowUp") { act = Math.max(act - 1, 0); draw(); e.preventDefault(); }
    if (e.key === "Enter" && links[act]) { location.hash = links[act].getAttribute("href"); close(); }
  });
  box.addEventListener("click", e => { if (e.target === box || e.target.closest("a")) close(); });
}

shell(); initTips(); palette();
$("#skip").addEventListener("click", () => $("#app").focus());
addEventListener("hashchange", route); route();
