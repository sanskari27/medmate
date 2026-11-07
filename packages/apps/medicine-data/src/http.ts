import { corsHeaders, isAllowedOrigin } from "./cors.js";
import { parseLimit, parseSearchText } from "./query.js";
import type { Catalog } from "./types.js";

export type HttpResult = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(status: number, body: unknown, extra: Record<string, string> = {}): HttpResult {
  return { status, headers: { ...JSON_HEADERS, ...extra }, body };
}

function notFoundError(extra: Record<string, string>): HttpResult {
  return json(404, { error: { code: "NOT_FOUND", message: "Not found" } }, extra);
}

export async function handleHttp(
  request: { method: string; url: string; origin?: string },
  catalog: Catalog,
): Promise<HttpResult> {
  const origin = request.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return json(403, { error: { code: "FORBIDDEN", message: "Origin is not allowed" } });
  }
  const allow = corsHeaders(origin);
  const method = request.method.toUpperCase();
  let url: URL;
  try {
    url = new URL(request.url, "http://medicine-data.local");
  } catch {
    return notFoundError(allow);
  }

  if (method === "OPTIONS") {
    return { status: 204, headers: allow, body: null };
  }
  if (method !== "GET") {
    return json(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method is not allowed" } }, allow);
  }

  if (url.pathname === "/health") {
    return json(200, { status: "ok" }, allow);
  }

  if (url.pathname === "/api/search") {
    const query = parseSearchText(url.searchParams.get("q"));
    if (typeof query !== "string") {
      return json(400, { error: { code: "BAD_REQUEST", message: query.error } }, allow);
    }
    const limit = parseLimit(url.searchParams.get("limit"));
    if (typeof limit !== "number") {
      return json(400, { error: { code: "BAD_REQUEST", message: limit.error } }, allow);
    }
    const [drug, fmcg] = await Promise.all([
      catalog.searchDrugs(query, limit),
      catalog.searchFmcg(query, limit),
    ]);
    return json(200, { drug, fmcg }, allow);
  }

  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch) {
    let productId: string;
    try {
      productId = decodeURIComponent(productMatch[1]);
    } catch {
      return json(400, { error: { code: "BAD_REQUEST", message: "product id is not valid" } }, allow);
    }
    if (!productId) {
      return notFoundError(allow);
    }
    const [drug, fmcg] = await Promise.all([
      catalog.findDrug(productId),
      catalog.findFmcg(productId),
    ]);
    const body = { drug: drug ? [drug] : [], fmcg: fmcg ? [fmcg] : [] };
    if (!drug && !fmcg) {
      return json(404, body, allow);
    }
    return json(200, body, allow);
  }

  return notFoundError(allow);
}
