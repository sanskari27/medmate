import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "dist");
const port = Number(process.argv[3] ?? 3201);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

function fileFor(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  let rel = clean === "/" ? "index.html" : clean.replace(/^\//, "");
  if (rel.endsWith("/")) rel += "index.html";
  else if (!path.extname(rel)) rel += ".html";
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) return null;
  return file;
}

http.createServer((req, res) => {
  const file = fileFor(req.url ?? "/");
  const found = file && fs.existsSync(file) && fs.statSync(file).isFile();
  const target = found ? file : path.join(root, "404.html");
  res.statusCode = found ? 200 : 404;
  res.setHeader("content-type", types[path.extname(target)] ?? "application/octet-stream");
  fs.createReadStream(target).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`serving ${root} at http://127.0.0.1:${port}`);
});
