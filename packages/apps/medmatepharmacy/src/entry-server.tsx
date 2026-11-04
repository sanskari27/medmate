import { prerender } from "react-dom/static";
import { StaticRouter } from "react-router";
import * as productDetails from "@/content/product-details";
import { setProductDetails } from "@/content/details-api";
import { App } from "@/router";

setProductDetails(productDetails);
import { htmlFile, sitePaths } from "@/paths";
import { staticFiles } from "@/lib/publish";

function Document({ url, css, js }: { url: string; css: string[]; js: string }) {
  return (
    <html lang="en-IN" className="antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1B3D29" />
        <meta name="application-name" content="MedMate" />
        <meta name="category" content="health" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" type="image/x-icon" />
        <link rel="icon" href="/icon.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" type="image/png" />
        {css.map((href) => <link key={href} rel="stylesheet" href={href} />)}
      </head>
      <body>
        <div id="root">
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </div>
        <script type="module" src={js} />
      </body>
    </html>
  );
}

async function streamToString(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let html = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
  }
  return html + decoder.decode();
}

export async function renderPage(url: string, assets: { css: string[]; js: string }) {
  const { prelude } = await prerender(<Document url={url} css={assets.css} js={assets.js} />);
  const html = await streamToString(prelude);
  return `<!DOCTYPE html>${html}`;
}

export function pages() {
  return sitePaths().map((urlPath) => ({ urlPath, file: htmlFile(urlPath) }));
}

export { staticFiles };
