import { mrpValueOf } from "@/screens/Inventory/utils/mrpValueOf";
import { lastSoldAt } from "@/screens/Inventory/utils/lastSoldAt";
import { needsAttention } from "@/screens/Inventory/utils/needsAttention";
import { ProductDetailModal } from "@/screens/Inventory/components/ProductDetailModal";
import { ProductModal } from "@/screens/Inventory/components/ProductModal";
import { useState, useRef, useEffect } from "react";
import { usePharma } from "@/hooks";
import {
  catLabel,
  inr,
  inr2,
  stockOf,
  isLowStock,
  isExpiringSoon,
  isExpired,
  earliestBatch,
  monthsToExpiry,
  mrpOf,
  InvProduct,
  stockValue,
  isLooseEligible,
  perUnitPrice,
  unitNoun,
  hasLocation,
  matchesLocation,
  locationCodes,
} from "@/utils";
import { ScheduleTag } from "@/components/ScheduleTag";
import { StockPill } from "@/components/StockPill";
import { Thumb } from "@/components/Thumb";
import {
  IconSearch,
  IconEdit,
  IconInventory,
  IconTruck,
  IconCash,
  IconTrendDown,
  IconCalendar,
  IconBox,
  IconArrowRight,
  IconTag,
  IconAlert,
  IconClock,
  IconPin,
  IconDownload,
  IconPrint,
} from "@/components/Icon";
import { exportStockCsv, exportStockPdf } from "@/utils/calculations/stockExport";
import { downloadMedicineTemplate, parseMedicineCsv } from "@/utils/purchases";

const FILTER_LABEL: Record<Filter, string> = {
  all: "all",
  alerts: "alerts",
  low: "low-stock",
  expiring: "expiring",
  rx: "rx-only",
  out: "out-of-stock",
  noloc: "unallocated",
};

const DAY = 86400000;

// units of a product sold since a timestamp (excludes cancelled)

type Filter = "all" | "alerts" | "low" | "expiring" | "rx" | "out" | "noloc";
// high-priority for purchase (running out) or expiring soon

export default function InventoryScreen() {
  const {
    inventory,
    sales,
    profile,
    now,
    toggleOnline,
    toggleLoose,
    updateProduct,
    go,
    invFilter,
    setInvFilter,
    importMedicines,
    showFault,
    toast,
  } = usePharma();
  const medFile = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [edit, setEdit] = useState<InvProduct | null>(null);
  const [detail, setDetail] = useState<InvProduct | null>(null);

  // honour a filter requested by another screen (e.g. dashboard "Stock alerts" card)
  useEffect(() => {
    if (
      invFilter &&
      ["all", "alerts", "low", "expiring", "rx", "out", "noloc"].includes(invFilter)
    ) {
      setFilter(invFilter as Filter);
      setInvFilter(null);
    }
  }, [invFilter, setInvFilter]);

  // priority rank for the alerts view: out of stock → low → expiring; ties broken by soonest expiry
  const alertRank = (p: InvProduct) => (stockOf(p) === 0 ? 0 : isLowStock(p) ? 1 : 2);

  const list = inventory.filter((p) => {
    if (filter === "alerts" && !needsAttention(p, now)) return false;
    if (filter === "low" && !isLowStock(p)) return false;
    if (filter === "expiring" && !isExpiringSoon(p, now)) return false;
    if (filter === "rx" && p.schedule === "OTC") return false;
    if (filter === "out" && stockOf(p) > 0) return false;
    if (filter === "noloc" && hasLocation(p)) return false;
    // two-way search: by name/salt/brand OR by rack location code (e.g. "A3-12")
    if (
      q &&
      !(
        `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(q.toLowerCase()) ||
        matchesLocation(p, q)
      )
    )
      return false;
    return true;
  });
  if (filter === "alerts")
    list.sort(
      (a, b) =>
        alertRank(a) - alertRank(b) ||
        (earliestBatch(a)?.expiry ?? "9999").localeCompare(earliestBatch(b)?.expiry ?? "9999"),
    );

  const totalSkus = inventory.length;
  const totalValue = inventory.reduce((a, p) => a + stockValue(p), 0);
  const retailValue = inventory.reduce((a, p) => a + mrpValueOf(p), 0);
  const potentialMargin =
    retailValue > 0 ? Math.round(((retailValue - totalValue) / retailValue) * 100) : 0;
  const lowCount = inventory.filter(isLowStock).length;
  const expCount = inventory.filter((p) => isExpiringSoon(p, now)).length;
  const expValue = inventory
    .filter((p) => isExpiringSoon(p, now))
    .reduce((a, p) => a + stockValue(p), 0);
  const outCount = inventory.filter((p) => stockOf(p) === 0).length;
  const alertCount = inventory.filter((p) => needsAttention(p, now)).length;
  const noLocCount = inventory.filter((p) => !hasLocation(p)).length;
  // dead / non-moving: in stock but no sale in 90 days
  const deadStock = inventory.filter(
    (p) => stockOf(p) > 0 && lastSoldAt(p, sales) < now - 90 * DAY,
  );
  const deadValue = deadStock.reduce((a, p) => a + stockValue(p), 0);

  const kpiKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
  const goFilter = (f: Filter) => setFilter(f);

  return (
    <div className="pd-canvas-wide">
      <div className="pd-stats">
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={() => goFilter("all")}
          onKeyDown={kpiKey(() => goFilter("all"))}
          title="All products"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-green">
            <IconInventory size={18} />
          </div>
          <div className="lbl">Total SKUs</div>
          <div className="val">{totalSkus}</div>
          <div className="split">
            {inventory.reduce((a, p) => a + stockOf(p), 0).toLocaleString("en-IN")} units in stock
          </div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-blue">
            <IconCash size={18} />
          </div>
          <div className="lbl">Stock value (cost)</div>
          <div className="val">{inr(totalValue)}</div>
          <div className="split">≈ {potentialMargin}% margin</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconTag size={18} />
          </div>
          <div className="lbl">Retail value (MRP)</div>
          <div className="val">{inr(retailValue)}</div>
          <div className="split">potential revenue</div>
        </div>
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={() => goFilter("low")}
          onKeyDown={kpiKey(() => goFilter("low"))}
          title="Low & out of stock"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-gold">
            <IconTrendDown size={18} />
          </div>
          <div className="lbl">Low on stock</div>
          <div className="val">{lowCount}</div>
          <div className="split">{outCount} out of stock</div>
        </div>
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={() => goFilter("expiring")}
          onKeyDown={kpiKey(() => goFilter("expiring"))}
          title="Expiring soon"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-rose">
            <IconCalendar size={18} />
          </div>
          <div className="lbl">Expiring ≤ 4 mo</div>
          <div className="val">{expCount}</div>
          <div className="split">{inr(expValue)} at risk</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconClock size={18} />
          </div>
          <div className="lbl">Dead stock (90d)</div>
          <div className="val">{deadStock.length}</div>
          <div className="split">{inr(deadValue)} tied up</div>
        </div>
      </div>

      <div className="pd-toolbar">
        <div className="pd-seg pd-seg-scroll">
          {(
            [
              ["all", "All"],
              ["alerts", `Alerts${alertCount ? " · " + alertCount : ""}`],
              ["low", "Low stock"],
              ["expiring", "Expiring"],
              ["rx", "Rx-only"],
              ["out", "Out of stock"],
              ["noloc", `Unallocated${noLocCount ? " · " + noLocCount : ""}`],
            ] as [Filter, string][]
          ).map(([f, l]) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {l}
            </button>
          ))}
        </div>
        <div className="pd-spacer" />
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input
            placeholder="Search by name, salt, brand…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          className="pd-btn pd-btn-ghost pd-btn-sm"
          disabled={!list.length}
          title="Download this view as Excel (CSV)"
          onClick={() => exportStockCsv(list, FILTER_LABEL[filter], now)}
        >
          <IconDownload size={15} /> Excel
        </button>
        <button
          className="pd-btn pd-btn-ghost pd-btn-sm"
          disabled={!list.length}
          title="Download this view as PDF"
          onClick={() => exportStockPdf(list, profile, FILTER_LABEL[filter], now)}
        >
          <IconPrint size={15} /> PDF
        </button>
        <input
          ref={medFile}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = async () => {
              const parsed = parseMedicineCsv(String(r.result));
              if (!parsed.products.length) {
                showFault(parsed.errors[0] || "No medicines in that sheet");
                return;
              }
              const res = await importMedicines(parsed.products);
              if (res?.skipped.length) toast(`${res.skipped.length} already in the catalogue`);
            };
            r.readAsText(f);
            e.target.value = "";
          }}
        />
        <div className="nm-dr">
          <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => setShowMore((v) => !v)}>
            More ▾
          </button>
          {showMore && (
            <div
              className="pd-menu"
              style={{ position: "absolute", right: 0, top: "110%", zIndex: 20, minWidth: 210 }}
            >
              <button
                className="pd-menu-item"
                onClick={() => {
                  setShowMore(false);
                  go("rackmap");
                }}
              >
                Rack &amp; Locations
              </button>
              <button
                className="pd-menu-item"
                onClick={() => {
                  setShowMore(false);
                  downloadMedicineTemplate();
                }}
              >
                Sample sheet
              </button>
              <button
                className="pd-menu-item"
                onClick={() => {
                  setShowMore(false);
                  medFile.current?.click();
                }}
              >
                Import medicines
              </button>
            </div>
          )}
        </div>
        <button
          className="pd-btn pd-btn-primary pd-btn-sm"
          onClick={() => go("purchases")}
          title="Products are added by entering a distributor purchase bill"
        >
          <IconTruck size={16} /> Add stock via purchase
        </button>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Schedule</th>
                <th>Rack</th>
                <th className="num">Batches</th>
                <th>Expiry</th>
                <th>Stock</th>
                <th className="num">MRP</th>
                <th className="num">Value</th>
                <th>Loose / Online</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const b = earliestBatch(p);
                const mo = b ? monthsToExpiry(b.expiry, now) : 99;
                const exp = b ? isExpired(b.expiry, now) : false;
                return (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setDetail(p)}>
                    <td>
                      <div className="prod">
                        <span className="em">
                          <Thumb p={p} />
                        </span>
                        <span>
                          <span className="nm">{p.name}</span>
                          <div className="sub">
                            {p.composition} · {p.manufacturer}
                          </div>
                        </span>
                      </div>
                    </td>
                    <td className="nowrap">{catLabel(p.category)}</td>
                    <td>
                      <ScheduleTag schedule={p.schedule} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {hasLocation(p) ? (
                        <span className="pd-rackchip" style={{ marginLeft: 0 }}>
                          <IconPin size={11} /> {locationCodes(p).join(" · ")}
                        </span>
                      ) : (
                        <button
                          className="pd-pill pill-gold"
                          style={{ cursor: "pointer", border: 0 }}
                          title="Not assigned to a rack — click to allocate"
                          onClick={() => go("rackmap")}
                        >
                          <IconAlert size={11} /> Unallocated
                        </button>
                      )}
                    </td>
                    <td className="num">{p.batches.length}</td>
                    <td>
                      {b && (
                        <span
                          className={`pd-pill ${exp ? "pill-rose" : mo <= 4 ? "pill-gold" : "pill-gray"}`}
                        >
                          {exp ? "Expired" : b.expiry}
                        </span>
                      )}
                    </td>
                    <td>
                      <StockPill p={p} now={now} />
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {inr(mrpOf(p))}
                    </td>
                    <td className="num">{inr(stockValue(p))}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="pd-flex pd-gap6">
                        {isLooseEligible(p) ? (
                          <>
                            <button
                              className={`pd-switch${(p.looseAllowed ?? true) ? " on" : ""}`}
                              onClick={() => toggleLoose(p.id)}
                              aria-label="Toggle loose selling"
                            />
                            {(p.looseAllowed ?? true) && (
                              <span className="pd-muted" style={{ fontSize: 11 }}>
                                {inr2(perUnitPrice(p))}/{unitNoun(p)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="pd-muted" style={{ fontSize: 12 }}>
                            —
                          </span>
                        )}
                        <button
                          className={`pd-switch${p.online ? " on" : ""}`}
                          onClick={() => toggleOnline(p.id)}
                          aria-label="Toggle online"
                        />
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="pd-flex pd-gap6" style={{ justifyContent: "flex-end" }}>
                        <button className="pd-iconbtn" title="Edit" onClick={() => setEdit(p)}>
                          <IconEdit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={11}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconBox size={28} />
                      </div>
                      <p>
                        {inventory.length === 0
                          ? "No products yet — add stock by entering a distributor purchase bill."
                          : "No products match this filter."}
                      </p>
                      {inventory.length === 0 && (
                        <button
                          className="pd-btn pd-btn-primary pd-btn-sm"
                          style={{ marginTop: 10 }}
                          onClick={() => go("purchases")}
                        >
                          <IconTruck size={14} /> New purchase entry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {edit && (
        <ProductModal
          product={edit}
          onClose={() => setEdit(null)}
          onSave={async (p) => {
            const err = await updateProduct(p.id, p);
            if (!err) setEdit(null);
          }}
        />
      )}
      {detail && (
        <ProductDetailModal
          product={inventory.find((x) => x.id === detail.id) ?? detail}
          sales={sales}
          now={now}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEdit(detail);
            setDetail(null);
          }}
          toggleOnline={toggleOnline}
          toggleLoose={toggleLoose}
          go={go}
        />
      )}
    </div>
  );
}

// ── product 360° detail: stock, batches, valuation, velocity, movement ──

// ── edit product details ────────────────────────────────────────
// New products are created through the Purchases (goods-inward) flow, not here.
