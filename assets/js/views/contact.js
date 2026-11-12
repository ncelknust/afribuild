// Contact: how to reach the Net-Zero Carbon Emission Lab (NCEL), KNUST.
import { ICON, ph, ptitle } from "../ui.js";

export const NCEL = {
  name: "Net-Zero Carbon Emission Lab (NCEL)",
  about: "NCEL is a specialised research hub at KNUST that develops rigorous, science-based and data-driven solutions in decarbonisation and climate resilience.",
  web: "https://ncelknust.org", webLabel: "ncelknust.org",
  email: "ncel@knust.edu.gh",
  address: ["New Engineering Building FF1", "College of Engineering", "Kwame Nkrumah University of Science and Technology (KNUST)", "Kumasi, Ghana"],
  pi: { name: "Dr Yen Adams Sokama-Neuyam", role: "Principal investigator", email: "asokama@knust.edu.gh", phone: "+233 24 593 7358" },
};

export default async function contact(root) {
  const mail = (to, subject) => `mailto:${to}?subject=${encodeURIComponent(subject)}`;
  root.innerHTML = `<div class="wrap page">${ph({ eyebrow: "Contact", title: "Contact NCEL", lede: "AfriBuild is developed by the Net-Zero Carbon Emission Lab at the Kwame Nkrumah University of Science and Technology. Get in touch about the data, data partnerships, training or collaboration." })}
    <div class="grid c3 stretch">
      <div class="panel">${ptitle({ eyebrow: "The lab", title: NCEL.name, text: NCEL.about })}
        <dl class="kv"><dt>Website</dt><dd><a href="${NCEL.web}" target="_blank" rel="noopener">${NCEL.webLabel}</a></dd><dt>Email</dt><dd><a href="mailto:${NCEL.email}">${NCEL.email}</a></dd></dl>
        <div class="btns" style="margin-top:24px"><a class="btn sm" href="${mail(NCEL.email, "AfriBuild enquiry")}">Email NCEL</a><a class="btn sm ghost" href="${NCEL.web}" target="_blank" rel="noopener">Visit website</a></div></div>
      <div class="panel">${ptitle({ eyebrow: "Address", title: "Visit us" })}
        <address class="sm" style="font-style:normal;line-height:1.8;color:var(--ink2)">${NCEL.address.join("<br>")}</address></div>
      <div class="panel">${ptitle({ eyebrow: NCEL.pi.role, title: NCEL.pi.name })}
        <dl class="kv"><dt>Email</dt><dd><a href="mailto:${NCEL.pi.email}">${NCEL.pi.email}</a></dd><dt>Phone</dt><dd><a href="tel:${NCEL.pi.phone.replace(/\s/g, "")}">${NCEL.pi.phone}</a></dd></dl></div>
    </div>
    <section class="section">
      <div class="sh"><div><div class="eyebrow">How we can help</div><h2>Reasons to get in touch</h2></div></div>
      <div class="features">
        ${topic(ICON.book, "Questions about the data", "How a factor was derived, which tier to use, or how to cite AfriBuild.", mail(NCEL.email, "AfriBuild: question about the data"), "Ask a question")}
        ${topic(ICON.hand, "Data partnerships", "Share plant, yard or laboratory data under agreed confidentiality.", "#/contribute", "Contribute data")}
        ${topic(ICON.users, "Training and collaboration", "Workshops, joint studies, student projects and national database work.", mail(NCEL.email, "AfriBuild: training or collaboration"), "Propose a collaboration")}
        ${topic(ICON.flask, "Report an issue", "Tell us about an error, a missing study or a value that looks wrong.", mail(NCEL.email, "AfriBuild: report an issue"), "Report an issue")}
      </div>
    </section></div>`;
}
const topic = (ic, t, p, href, cta) => `<a class="feature" href="${href}"><span class="ic">${ic}</span><h3>${t}</h3><p>${p}</p><em>${cta} →</em></a>`;
