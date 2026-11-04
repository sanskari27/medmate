export const paths = {
  home: "/",
  pharmacyOwner: "/pharmacy-owner",
  stories: "/stories",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund",
} as const;

export function sitePaths() {
  return Object.values(paths);
}

export function htmlFile(urlPath: string) {
  if (urlPath === "/") return "index.html";
  return `${urlPath.replace(/^\//, "")}.html`;
}

const LEGACY_REDIRECTS: Record<string, string> = {
  "privacy-policy.html": "/privacy",
  "terms-and-conditions.html": "/terms",
  "refund-policy.html": "/refund",
};

function redirectHtml(to: string) {
  const target = JSON.stringify(to);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="canonical" href="https://www.nammamedmate.com${to}"><meta http-equiv="refresh" content="0;url=${to}"><script>location.replace(${target})</script></head><body></body></html>`;
}

export function staticFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [file, to] of Object.entries(LEGACY_REDIRECTS)) {
    files[file] = redirectHtml(to);
  }
  const urls = sitePaths()
    .map((path) => `  <url><loc>https://www.nammamedmate.com${path === "/" ? "/" : path}</loc></url>`)
    .join("\n");
  files["robots.txt"] = "User-agent: *\nAllow: /\nSitemap: https://www.nammamedmate.com/sitemap.xml\n";
  files["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return files;
}
