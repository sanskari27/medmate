export function parseSearchText(raw: string | null): string | { error: string } {
  const query = (raw ?? "").trim();
  if (query.length < 2 || query.length > 80) {
    return { error: "q must be 2 to 80 characters" };
  }
  return query;
}

export function parseLimit(raw: string | null): number | { error: string } {
  if (raw === null || raw.trim() === "") {
    return 20;
  }
  if (!/^\d+$/.test(raw.trim())) {
    return { error: "limit must be a whole number" };
  }
  const value = Number(raw.trim());
  if (value < 1) {
    return { error: "limit must be a whole number" };
  }
  return Math.min(value, 50);
}

export function parseProductIds(raw: string | null): string[] | { error: string } {
  const pieces = (raw ?? "").split(",");
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const piece of pieces) {
    const id = piece.trim();
    if (!id || seen.has(id)) continue;
    if (id.length > 80) return { error: "ids must contain 1 to 200 product ids" };
    seen.add(id);
    ids.push(id);
  }
  if (ids.length < 1 || ids.length > 200) {
    return { error: "ids must contain 1 to 200 product ids" };
  }
  return ids;
}

export function containsPattern(query: string): string {
  const escaped = query.replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}
