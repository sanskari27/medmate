import {
  earliestBatch,
  hasLocation,
  isExpiringSoon,
  isLowStock,
  matchesLocation,
  stockOf,
  stockValue,
  type Channel,
  type InvProduct,
  type Sale,
} from "@/utils";
import { lastSoldAt } from "./utils/lastSoldAt";
import { mrpValueOf } from "./utils/mrpValueOf";
import { needsAttention } from "./utils/needsAttention";
import { soldSince } from "./utils/soldSince";

export type InventoryFilter = "all" | "alerts" | "low" | "expiring" | "rx" | "out" | "noloc";

export const INVENTORY_FILTER_LABEL: Record<InventoryFilter, string> = {
  all: "all",
  alerts: "alerts",
  low: "low-stock",
  expiring: "expiring",
  rx: "rx-only",
  out: "out-of-stock",
  noloc: "unallocated",
};

const DAY = 86400000;
const FILTERS: InventoryFilter[] = ["all", "alerts", "low", "expiring", "rx", "out", "noloc"];

export function isInventoryFilter(value: string): value is InventoryFilter {
  return FILTERS.some(function same(filter) {
    return filter === value;
  });
}

export function filterInventoryProducts(
  inventory: InvProduct[],
  filter: InventoryFilter,
  query: string,
  now: number,
): InvProduct[] {
  const needle = query.trim().toLowerCase();
  const matched = inventory.filter(function matches(product) {
    if (filter === "alerts" && !needsAttention(product, now)) return false;
    if (filter === "low" && !isLowStock(product)) return false;
    if (filter === "expiring" && !isExpiringSoon(product, now)) return false;
    if (filter === "rx" && product.schedule === "OTC") return false;
    if (filter === "out" && stockOf(product) > 0) return false;
    if (filter === "noloc" && hasLocation(product)) return false;
    if (!needle) return true;
    const haystack = `${product.name} ${product.composition} ${product.manufacturer}`.toLowerCase();
    return haystack.includes(needle) || matchesLocation(product, query);
  });
  if (filter !== "alerts") return matched;
  return [...matched].sort(function byUrgency(left, right) {
    return alertRank(left) - alertRank(right) || expiryKey(left).localeCompare(expiryKey(right));
  });
}

export type InventorySnapshot = {
  totalSkus: number;
  totalUnits: number;
  totalValue: number;
  retailValue: number;
  potentialMargin: number;
  lowCount: number;
  expiringCount: number;
  expiringValue: number;
  outCount: number;
  alertCount: number;
  unallocatedCount: number;
  deadCount: number;
  deadValue: number;
};

export function inventorySnapshot(inventory: InvProduct[], sales: Sale[], now: number): InventorySnapshot {
  const deadStock = inventory.filter(function idle(product) {
    return stockOf(product) > 0 && lastSoldAt(product, sales) < now - 90 * DAY;
  });
  const expiring = inventory.filter(function soon(product) {
    return isExpiringSoon(product, now);
  });
  const retailValue = inventory.reduce(function addRetail(sum, product) {
    return sum + mrpValueOf(product);
  }, 0);
  const totalValue = inventory.reduce(function addCost(sum, product) {
    return sum + stockValue(product);
  }, 0);
  return {
    totalSkus: inventory.length,
    totalUnits: inventory.reduce(function addUnits(sum, product) {
      return sum + stockOf(product);
    }, 0),
    totalValue,
    retailValue,
    potentialMargin: retailValue > 0 ? Math.round(((retailValue - totalValue) / retailValue) * 100) : 0,
    lowCount: inventory.filter(isLowStock).length,
    expiringCount: expiring.length,
    expiringValue: expiring.reduce(function addRisk(sum, product) {
      return sum + stockValue(product);
    }, 0),
    outCount: inventory.filter(function empty(product) {
      return stockOf(product) === 0;
    }).length,
    alertCount: inventory.filter(function alert(product) {
      return needsAttention(product, now);
    }).length,
    unallocatedCount: inventory.filter(function missing(product) {
      return !hasLocation(product);
    }).length,
    deadCount: deadStock.length,
    deadValue: deadStock.reduce(function addTied(sum, product) {
      return sum + stockValue(product);
    }, 0),
  };
}

export type ExpiryTone = "rose" | "gold" | "gray";

export function expiryTone(expired: boolean, months: number): ExpiryTone {
  if (expired) return "rose";
  if (months <= 4) return "gold";
  return "gray";
}

export type ProductMovement = {
  id: string;
  at: number;
  qty: number;
  channel: Channel;
};

export type ProductInsight = {
  stock: number;
  costValue: number;
  retailValue: number;
  margin: number;
  sold30: number;
  sold90: number;
  lastSoldAt: number;
  coverDays: number | null;
  movement: ProductMovement[];
};

export function productInsight(product: InvProduct, sales: Sale[], now: number): ProductInsight {
  const stock = stockOf(product);
  const costValue = stockValue(product);
  const retailValue = mrpValueOf(product);
  const sold30 = soldSince(product, sales, now - 30 * DAY);
  const velocity = sold30 / 30;
  return {
    stock,
    costValue,
    retailValue,
    margin: retailValue > 0 ? Math.round(((retailValue - costValue) / retailValue) * 100) : 0,
    sold30,
    sold90: soldSince(product, sales, now - 90 * DAY),
    lastSoldAt: lastSoldAt(product, sales),
    coverDays: velocity > 0 ? Math.round(stock / velocity) : null,
    movement: recentMovement(product, sales),
  };
}

export function productDraftReady(name: string) {
  return name.trim().length > 0;
}

function alertRank(product: InvProduct) {
  if (stockOf(product) === 0) return 0;
  if (isLowStock(product)) return 1;
  return 2;
}

function expiryKey(product: InvProduct) {
  return earliestBatch(product)?.expiry ?? "9999";
}

function recentMovement(product: InvProduct, sales: Sale[]): ProductMovement[] {
  return sales
    .filter(function sold(sale) {
      return sale.status !== "cancelled" && sale.items.some(function ofProduct(item) {
        return item.productId === product.id;
      });
    })
    .sort(function newest(left, right) {
      return right.createdAt - left.createdAt;
    })
    .slice(0, 12)
    .map(function toMovement(sale): ProductMovement {
      return {
        id: sale.id,
        at: sale.createdAt,
        qty: sale.items.filter(function ofProduct(item) {
          return item.productId === product.id;
        }).reduce(function addQty(sum, item) {
          return sum + item.qty;
        }, 0),
        channel: sale.channel,
      };
    });
}
