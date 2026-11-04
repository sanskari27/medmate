import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { metaFor } from "@/content/meta";
import { htmlFile, sitePaths, staticFiles } from "@/paths";
import { SITE_URL } from "@/lib/site";
import { App } from "@/router";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderPage(url: string, assets: { css: string[]; js: string }) {
  const path = url.split("?")[0] || "/";
  const meta = metaFor(path);
  const canonicalPath = path === "/" ? "/" : path;
  const body = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
  const styles = assets.css
    .map((href) => `<link rel="stylesheet" href="${href}">`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="application-name" content="Namma MedMate" />
    <meta name="author" content="Medmate India Technology Private Limited" />
    <link rel="canonical" href="${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}" />
    <link rel="shortcut icon" href="/namma-pharmacy/favicon.ico" />
    <link rel="icon" href="/namma-pharmacy/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/namma-pharmacy/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="/namma-pharmacy/apple-icon.png" sizes="180x180" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
    <link href="${FONTS}" rel="stylesheet" />
    ${styles}
  </head>
  <body>
    <div id="root">${body}</div>
    <script type="module" src="${assets.js}"></script>
  </body>
</html>`;
}

export function pages() {
  return sitePaths().map((urlPath) => ({ urlPath, file: htmlFile(urlPath) }));
}

export { staticFiles };
