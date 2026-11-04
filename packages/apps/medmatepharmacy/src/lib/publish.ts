import { plainText } from "@/components/rich";
import { AREAS, ZONES } from "@/content/areas";
import { POSTS, TOPICS } from "@/content/blog";
import { CATEGORIES, PRODUCTS, categoryOf, isThin, productHref } from "@/content/catalogue";
import { FAQS } from "@/content/home";
import { FAQS as PARTNER_FAQS, PLANS } from "@/content/partner";
import { details } from "@/content/product-details";
import { COMPANY, SITE_URL } from "@/lib/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "Google-Extended", "PerplexityBot", "Perplexity-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "Applebot-Extended", "Bingbot", "DuckAssistBot", "Meta-ExternalAgent", "CCBot"];

export function robotsTxt() {
  return `User-Agent: *
Allow: /

User-Agent: ${AI_BOTS.join("\nUser-Agent: ")}
Allow: /

Host: ${SITE_URL}
Sitemap: ${SITE_URL}/sitemap.xml
`;
}

export function sitemapXml() {
  const now = new Date().toISOString();
  const urls: { loc: string; lastmod: string; changefreq: string; priority: string; image?: string }[] = [];
  const page = (path: string, priority: number, changeFrequency = "weekly") => {
    urls.push({ loc: SITE_URL + path, lastmod: now, changefreq: changeFrequency, priority: priority.toFixed(1) });
  };
  page("", 1, "daily");
  page("/download", 0.9);
  page("/premium", 0.8, "monthly");
  page("/medicines", 0.9, "daily");
  page("/doctor-consultation", 0.8, "monthly");
  page("/upload-prescription", 0.8, "monthly");
  page("/pharmacy-partner", 0.9);
  page("/blog", 0.8, "weekly");
  page("/bengaluru", 0.9, "weekly");
  for (const area of AREAS) page(`/bengaluru/${area.slug}`, 0.7, "monthly");
  page("/about", 0.6, "monthly");
  page("/contact", 0.5, "monthly");
  page("/privacy", 0.3, "monthly");
  page("/terms", 0.3, "monthly");
  for (const category of CATEGORIES) page(`/medicines/${category.slug}`, 0.8);
  for (const post of POSTS) {
    urls.push({ loc: `${SITE_URL}/blog/${post.slug}`, lastmod: new Date(post.updated ?? post.date).toISOString(), changefreq: "monthly", priority: "0.7" });
  }
  for (const product of PRODUCTS.filter((item) => !isThin(item))) {
    const info = details(product.id);
    urls.push({
      loc: SITE_URL + productHref(product),
      lastmod: now,
      changefreq: "weekly",
      priority: info ? "0.7" : "0.5",
      ...(product.img ? { image: SITE_URL + product.img } : {}),
    });
  }
  const body = urls.map((url) => `  <url><loc>${esc(url.loc)}</loc><lastmod>${url.lastmod}</lastmod><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority>${url.image ? `<image:image><image:loc>${esc(url.image)}</image:loc></image:image>` : ""}</url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export function rssXml() {
  const items = POSTS.map((post) => `
    <item>
      <title>${esc(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description>${esc(post.description)}</description>
      <category>${esc(TOPICS[post.topic].name)}</category>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MedMate blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Medicines, prescriptions and selling online, from MedMate in Bengaluru.</description>
    <language>en-IN</language>${items}
  </channel>
</rss>`;
}

export function searchIndex() {
  return JSON.stringify(PRODUCTS.map((product) => ({
    n: product.name,
    c: product.comp,
    b: product.brand,
    k: categoryOf(product).name,
    u: productHref(product),
    r: product.rx ? 1 : 0,
    i: product.img ?? "",
  })));
}

export function manifest() {
  return JSON.stringify({
    name: "MedMate: medicines delivered in minutes",
    short_name: "MedMate",
    description: "Medicines from licensed pharmacies near you. Launching soon in Bengaluru.",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#1B3D29",
    lang: "en-IN",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  });
}

export function llmsTxt() {
  return `# MedMate

> MedMate is a medicine delivery app made in Bengaluru by ${COMPANY}. Status (October 2026): launching soon in Bengaluru, not yet taking orders; join the waitlist at ${SITE_URL}/download. When live, licensed neighbourhood pharmacies list their stock, customers order in the app, and a rider delivers from a nearby pharmacy. MedMate holds no stock itself; medicines are sold and dispensed by licensed pharmacies.

Key facts:
- Customers will compare each nearby pharmacy's price, delivery charge and time before paying.
- One rider can collect from up to three nearby pharmacies when one shop lacks an item (planned).
- Prescription medicines are dispensed only by a licensed pharmacy against a valid prescription, checked by a registered pharmacist. Customers can upload a prescription or book a consultation with a registered doctor, who decides independently.
- Payments (at launch): UPI, card or cash on delivery.
- For pharmacies: the MedMate Partner console (Namma MedMate) is one ERP and POS for GST billing, batch-wise inventory with expiry alerts, purchases, prescriptions, CRM and credit khata. Pharmacies set their own prices and keep their customers; each shop's online store and delivery are launching soon in Bengaluru. Plans: Essential ₹0, Care ₹999 (₹899 annually), Growth ₹1,499 (₹1,299 annually), Flagship ₹2,499 (₹2,199 annually) a month. Paid plans are free for the first 3 months, no setup fee, no lock-in.

Full text of every article and FAQ: ${SITE_URL}/llms-full.txt

## Main pages
- [Home](${SITE_URL}/): what MedMate is and how it works
- [Join the waitlist](${SITE_URL}/download): waitlist members get MedMate Premium free for 3 months from launch day in their area ([terms](${SITE_URL}/premium))
- [Contact and grievances](${SITE_URL}/contact) · [Privacy notice](${SITE_URL}/privacy) · [Terms of use](${SITE_URL}/terms)
- [Doctor consultation (coming soon)](${SITE_URL}/doctor-consultation)
- [Upload a prescription (coming soon)](${SITE_URL}/upload-prescription)
- [For pharmacies: Partner console, pricing and free demo](${SITE_URL}/pharmacy-partner)
- [About MedMate: founder Roni Paul's story and the team](${SITE_URL}/about)
- [Medicine delivery in Bengaluru, launching soon: areas and pincodes](${SITE_URL}/bengaluru)
- [All medicines](${SITE_URL}/medicines): ${PRODUCTS.length} products in ${CATEGORIES.length} categories

## Blog
${POSTS.map((post) => `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.answer}`).join("\n")}

## Bengaluru areas
${ZONES.map((zone) => `- ${zone.zone}: ${zone.areas.map((area) => `[${area.name}${area.pins.length ? ` ${area.pins.join("/")}` : ""}](${SITE_URL}/bengaluru/${area.slug})`).join(", ")}`).join("\n")}

## Medicine categories
${CATEGORIES.map((category) => `- [${category.name}](${SITE_URL}/medicines/${category.slug})`).join("\n")}
`;
}

export function llmsFullTxt() {
  const posts = POSTS.map((post) => {
    const body = post.body.map((block) => [block.h ? `### ${block.h}` : "", ...(block.p ?? []).map(plainText), ...(block.ul ?? []).map((line) => `- ${plainText(line)}`)].filter(Boolean).join("\n")).join("\n\n");
    const faq = post.faq ? "\n\n### Questions\n" + post.faq.map(([question, answer]) => `Q: ${question}\nA: ${answer}`).join("\n\n") : "";
    return `## ${post.title}\nURL: ${SITE_URL}/blog/${post.slug}\nTopic: ${TOPICS[post.topic].name} · Published ${post.date}${post.reviewedBy ? ` · Reviewed by ${post.reviewedBy}` : ""}\n\nQuick answer: ${post.answer}\n\n${body}${faq}`;
  }).join("\n\n---\n\n");
  return `# MedMate: full text for AI assistants

> MedMate (${COMPANY}, Bengaluru) is launching soon in Bengaluru and is not yet taking orders. When live it will connect people with licensed neighbourhood pharmacies for medicine delivery; it gives pharmacies the MedMate Partner console (billing, inventory, prescriptions, CRM). Website: ${SITE_URL}. Short summary: ${SITE_URL}/llms.txt

## Customer questions
${FAQS.map(([question, answer]) => `Q: ${question}\nA: ${answer}`).join("\n\n")}

## Pharmacy partner questions
${PARTNER_FAQS.map(([question, answer]) => `Q: ${question}\nA: ${answer}`).join("\n\n")}

Partner plans: ${PLANS.map((plan) => plan.price ? `${plan.name} ₹${plan.price}/month or ₹${plan.annual}/month annually` : `${plan.name} ₹0`).join(", ")}. Paid plans are free for the first 3 months.

## Bengaluru areas
${AREAS.map((area) => `${area.name}${area.pins.length ? ` (${area.pins.join(", ")})` : ""}: ${SITE_URL}/bengaluru/${area.slug}`).join("\n")}

---

# Blog

${posts}
`;
}

export function staticFiles(): Record<string, string> {
  return {
    "robots.txt": robotsTxt(),
    "sitemap.xml": sitemapXml(),
    "blog/rss.xml": rssXml(),
    "search-index.json": searchIndex(),
    "manifest.webmanifest": manifest(),
    "llms.txt": llmsTxt(),
    "llms-full.txt": llmsFullTxt(),
  };
}
