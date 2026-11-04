import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const serverEntry = path.join(root, "dist-server", "entry-server.js");
const manifestPath = path.join(dist, ".vite", "manifest.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const entry = Object.values(manifest).find((item) => item.isEntry);
if (!entry) throw new Error("Vite manifest has no entry");

const assets = {
  js: `/${entry.file}`,
  css: (entry.css ?? []).map((file) => `/${file}`),
};

const { renderPage, pages, staticFiles } = await import(pathToFileURL(serverEntry).href);

for (const page of pages()) {
  const html = await renderPage(page.urlPath, assets);
  const file = path.join(dist, page.file);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
  process.stdout.write(".");
}
process.stdout.write("\n");

const missing = await renderPage("/this-page-does-not-exist", assets);
await writeFile(path.join(dist, "404.html"), missing);

for (const [file, body] of Object.entries(staticFiles())) {
  const target = path.join(dist, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
}

await rm(path.join(root, "dist-server"), { recursive: true, force: true });
console.log(`prerendered ${pages().length} pages`);
