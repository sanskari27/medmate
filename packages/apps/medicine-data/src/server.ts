import { createServer } from "node:http";

import pg from "pg";

import { PgCatalog } from "./catalog.js";
import { corsHeaders } from "./cors.js";
import { handleHttp } from "./http.js";
import { applySchema } from "./schema.js";

const { Pool } = pg;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const pool = new Pool({
  host: required("PGHOST"),
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: required("PGDATABASE"),
  user: required("PGUSER"),
  password: required("PGPASSWORD"),
  max: 4,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (error) => {
  console.error("database pool error", error);
});

const catalog = new PgCatalog(pool);
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

function singleOrigin(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const server = createServer((req, res) => {
  const origin = singleOrigin(req.headers.origin);
  void handleHttp({ method: req.method ?? "GET", url: req.url ?? "/", origin }, catalog)
    .then((result) => {
      res.writeHead(result.status, result.headers);
      if (result.body === null) {
        res.end();
        return;
      }
      res.end(JSON.stringify(result.body));
    })
    .catch((error: unknown) => {
      console.error(error);
      if (res.headersSent) {
        res.end();
        return;
      }
      res.writeHead(500, {
        "content-type": "application/json; charset=utf-8",
        ...corsHeaders(origin),
      });
      res.end(JSON.stringify({ error: { code: "INTERNAL", message: "Request failed" } }));
    });
});

await applySchema(pool);
server.listen(port, "0.0.0.0", () => {
  console.log(`medicine-data listening on ${port}`);
});
