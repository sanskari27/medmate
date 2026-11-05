import type { RangeLite } from "@/utils/calculations/reportCatalog";

export const inRange = (ts: number, r: RangeLite) => ts >= r.from && ts <= r.to;
