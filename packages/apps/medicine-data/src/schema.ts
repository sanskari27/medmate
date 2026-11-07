import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Db } from "./types.js";

const FILES = ["drug-master-schema.sql", "otc-fmcg-master-schema.sql"];

export function schemaDirectory(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../schema");
}

export async function applySchema(db: Db, directory = schemaDirectory()): Promise<void> {
  for (const name of FILES) {
    const sql = await readFile(path.join(directory, name), "utf8");
    await db.query(sql);
  }
}
