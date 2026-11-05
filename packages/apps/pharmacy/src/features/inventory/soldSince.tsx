import { useState, useRef, useEffect } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  CATEGORIES, catLabel, inr, inr2, stockOf, isLowStock, isExpiringSoon, isExpired,
  earliestBatch, monthsToExpiry, mrpOf, sellPrice, stockLabel, InvProduct, Schedule, DosageForm,
  SCHEDULE_META, stockValue, isLooseEligible, perUnitPrice, unitNoun, looseUnitsOf,
  hasLocation, matchesLocation, locationCodes, Sale, fmtDateTime, timeAgo, productBarcode,
} from "@/domain";
import { barcodeSvg, saveBarcodeSvg } from "@/lib/barcode";
import { ScheduleTag, StockPill, Thumb } from "@/components/bits";
import { IconSearch, IconEdit, IconX, IconInventory, IconUpload, IconTruck, IconCash, IconTrendDown, IconCalendar, IconMap, IconBox, IconUnlock, IconLock, IconArrowRight, IconRupee, IconTag, IconAlert, IconClock, IconReceipt, IconPin, IconRefresh, IconDownload, IconPrint } from "@/components/Icon"
import { monogramOf } from "@/components/entityIcon";
import { exportStockCsv, exportStockPdf } from "@/features/inventory/stockExport";
import { downloadMedicineTemplate, parseMedicineCsv } from "@/features/purchasing/purchaseCsv";

;

const FILTER_LABEL: Record<Filter, string> = { all: "all", alerts: "alerts", low: "low-stock", expiring: "expiring", rx: "rx-only", out: "out-of-stock", noloc: "unallocated" };

const DAY = 86400000;

type Filter = "all" | "alerts" | "low" | "expiring" | "rx" | "out" | "noloc";

const FORMS: DosageForm[] = ["Tablet", "Capsule", "Syrup", "Drops", "Injection", "Cream", "Device", "Other"];

const SCHEDS: Schedule[] = ["OTC", "H", "H1", "X"];

const GSTS = [0, 5, 12, 18];

export const soldSince = (p: InvProduct, sales: Sale[], since: number) =>
  sales.filter((s) => s.status !== "cancelled" && s.createdAt >= since).reduce((a, s) => a + s.items.filter((i) => i.productId === p.id).reduce((x, i) => x + i.qty, 0), 0);
