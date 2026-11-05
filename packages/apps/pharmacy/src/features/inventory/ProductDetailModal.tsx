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

import { mrpValueOf } from "./mrpValueOf";
import { soldSince } from "./soldSince";
import { lastSoldAt } from "./lastSoldAt";

;

const FILTER_LABEL: Record<Filter, string> = { all: "all", alerts: "alerts", low: "low-stock", expiring: "expiring", rx: "rx-only", out: "out-of-stock", noloc: "unallocated" };

const DAY = 86400000;

type Filter = "all" | "alerts" | "low" | "expiring" | "rx" | "out" | "noloc";

const FORMS: DosageForm[] = ["Tablet", "Capsule", "Syrup", "Drops", "Injection", "Cream", "Device", "Other"];

const SCHEDS: Schedule[] = ["OTC", "H", "H1", "X"];

const GSTS = [0, 5, 12, 18];

export function ProductDetailModal({ product: p, sales, now, onClose, onEdit, toggleOnline, toggleLoose, go }: {
  product: InvProduct; sales: Sale[]; now: number; onClose: () => void; onEdit: () => void;
  toggleOnline: (id: string) => void; toggleLoose: (id: string) => void; go: (r: any) => void;
}) {
  const stock = stockOf(p);
  const costVal = stockValue(p);
  const mrpVal = mrpValueOf(p);
  const margin = mrpVal > 0 ? Math.round(((mrpVal - costVal) / mrpVal) * 100) : 0;
  const sold30 = soldSince(p, sales, now - 30 * DAY);
  const sold90 = soldSince(p, sales, now - 90 * DAY);
  const lastAt = lastSoldAt(p, sales);
  const velocity = sold30 / 30;                       // units/day
  const cover = velocity > 0 ? Math.round(stock / velocity) : null;   // days of stock left
  const movement = sales
    .filter((s) => s.status !== "cancelled" && s.items.some((i) => i.productId === p.id))
    .sort((a, b) => b.createdAt - a.createdAt).slice(0, 12)
    .map((s) => ({ id: s.id, at: s.createdAt, qty: s.items.filter((i) => i.productId === p.id).reduce((x, i) => x + i.qty, 0), channel: s.channel }));
  const code = productBarcode(p);
  const facts: [string, React.ReactNode][] = [
    ["Manufacturer", p.manufacturer], ["Pack", p.pack], ["HSN / GST", `${p.hsn} · ${p.gst}%`],
    ["Rack location", hasLocation(p) ? <span className="pd-mono"><IconPin size={11} /> {locationCodes(p).join(" · ")}</span> : <button className="pd-pill pill-gold" style={{ cursor: "pointer", border: 0 }} onClick={() => { onClose(); go("rackmap"); }}><IconAlert size={11} /> Unallocated · assign</button>],
    ["Reorder level", `${p.reorderLevel} units`], ["Selling price", inr(sellPrice(p))],
  ];

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <div className="pd-flex" style={{ gap: 12, alignItems: "center", minWidth: 0 }}>
            <span className="em" style={{ width: 42, height: 42, borderRadius: 11, background: "var(--wash)", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}><Thumb p={p} /></span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>{p.name} <ScheduleTag schedule={p.schedule} /></h3>
              <div className="pd-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{p.composition} · {p.manufacturer} · {catLabel(p.category)}</div>
            </div>
          </div>
          <button className="pd-x" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div className="pd-modal-body">
          <div className="pd-flex" style={{ gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={onEdit}><IconEdit size={14} /> Edit product</button>
            <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => { onClose(); go("purchases"); }}><IconTruck size={14} /> Receive stock</button>
            {isLowStock(p) && <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => { onClose(); go("reorder"); }}><IconRefresh size={14} /> Reorder</button>}
            <button className={`pd-btn pd-btn-sm ${p.online ? "pd-btn-ghost" : "pd-btn-ghost"}`} onClick={() => toggleOnline(p.id)}>{p.online ? "● Online" : "○ Offline"}</button>
          </div>

          <div className="pd-card" style={{ display: "grid", gridTemplateColumns: "200px minmax(0,1fr) auto", gap: 18, alignItems: "center", padding: 14, marginBottom: 14 }}>
            <div style={{ width: 200 }} dangerouslySetInnerHTML={{ __html: barcodeSvg(code) }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="pd-mono" style={{ letterSpacing: ".12em", marginTop: 4 }}>{code}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {catLabel(p.category)} · {p.manufacturer} · {p.pack}
              </div>
            </div>
            <button className="pd-btn pd-btn-primary pd-btn-sm" style={{ whiteSpace: "nowrap" }} onClick={() => saveBarcodeSvg(code)}><IconDownload size={14} /> Save SVG</button>
          </div>

          {/* KPI tiles */}
          <div className="pd-pt-kpis" >
            <div className="k"><span className="l">In stock</span><span className="v sm">{stockLabel(p)}</span></div>
            <div className="k"><span className="l">Stock value (cost)</span><span className="v">{inr(costVal)}</span></div>
            <div className="k"><span className="l">Retail value (MRP)</span><span className="v">{inr(mrpVal)}</span></div>
            <div className="k"><span className="l">Margin</span><span className="v">{margin}<small>%</small></span></div>
            <div className="k"><span className="l">Sold · 30 days</span><span className="v">{sold30}<small> u</small></span></div>
            <div className="k"><span className="l">Sold · 90 days</span><span className="v">{sold90}<small> u</small></span></div>
            <div className="k"><span className="l">Days of cover</span><span className="v" style={cover !== null && cover <= 14 ? { color: "var(--rose)" } : undefined}>{cover === null ? "—" : cover}<small>{cover !== null ? "d" : ""}</small></span></div>
            <div className="k"><span className="l">Last sold</span><span className="v sm">{lastAt ? timeAgo(lastAt, now) : "never"}</span></div>
          </div>

          {(isLowStock(p) || stock === 0) && <div className="pd-pill pill-rose" style={{ marginBottom: 12 }}><IconAlert size={13} /> {stock === 0 ? "Out of stock — reorder now" : `Low stock — ${stock} left, reorder level ${p.reorderLevel}`}</div>}

          {/* facts */}
          <div className="pd-rack-facts" style={{ marginBottom: 14 }}>
            {facts.map(([k, v]) => <div className="f" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>)}
          </div>

          <div className="pd-grid-2">
            {/* batches */}
            <div>
              <div className="pd-pl-head" style={{ marginTop: 0 }}>Batches · stock & expiry</div>
              <div className="pd-tbl-wrap"><table className="pd-tbl">
                <thead><tr><th>Batch</th><th>Expiry</th><th className="num">Qty</th><th className="num">MRP</th><th className="num">Value</th></tr></thead>
                <tbody>
                  {p.batches.length === 0 && <tr><td colSpan={5}><div className="pd-empty" style={{ padding: 14 }}><p>No stock.</p></div></td></tr>}
                  {p.batches.map((b) => {
                    const exp = isExpired(b.expiry, now); const mo = monthsToExpiry(b.expiry, now);
                    return (
                      <tr key={b.batchNo}>
                        <td className="pd-mono" style={{ fontWeight: 700 }}>{b.batchNo || "—"}</td>
                        <td><span className={`pd-pill ${exp ? "pill-rose" : mo <= 4 ? "pill-gold" : "pill-gray"}`}>{b.expiry}{exp ? " · exp" : mo <= 4 ? ` · ${mo}mo` : ""}</span></td>
                        <td className="num" style={{ fontWeight: 700 }}>{b.qty}</td>
                        <td className="num">{inr(b.mrp)}</td>
                        <td className="num">{inr(b.qty * b.ptr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {p.batches.length > 0 && <tfoot><tr style={{ background: "var(--wash2)", fontWeight: 800 }}><td colSpan={2}>Total</td><td className="num">{stock}</td><td className="num"></td><td className="num">{inr(costVal)}</td></tr></tfoot>}
              </table></div>
              {looseUnitsOf(p) > 0 && <div className="pd-muted" style={{ fontSize: 11.5, marginTop: 6 }}><IconUnlock size={12} /> {looseUnitsOf(p)} loose {unitNoun(p)}{looseUnitsOf(p) !== 1 ? "s" : ""} from an opened strip.</div>}
            </div>

            {/* movement */}
            <div>
              <div className="pd-pl-head" style={{ marginTop: 0 }}>Recent sales <span className="pd-muted" style={{ fontWeight: 500, fontSize: 12 }}>· movement</span></div>
              <div className="pd-card" style={{ overflow: "hidden", maxHeight: 250, overflowY: "auto" }}>
                {movement.length === 0 ? <div className="pd-empty" style={{ padding: 16 }}><p>No sales recorded.</p></div> :
                  movement.map((mv) => (
                    <div className="pd-medrow" key={mv.id}>
                      <span className="em" style={{ color: "var(--rose)" }}>−</span>
                      <span className="gw"><div className="t pd-mono">{mv.id}</div><div className="s">{fmtDateTime(mv.at).split(",")[0]} · {mv.channel === "online" ? "Online" : "Counter"}</div></span>
                      <b style={{ fontSize: 13 }}>{mv.qty} u</b>
                    </div>
                  ))}
              </div>
              <p className="pd-muted" style={{ fontSize: 11, marginTop: 8 }}><IconLock size={11} /> Stock updates automatically from purchases & sales.</p>
            </div>
          </div>
        </div>
        <div className="pd-modal-foot"><button className="pd-btn pd-btn-ghost" onClick={onClose}>Close</button><button className="pd-btn pd-btn-primary" onClick={() => { onClose(); go("purchases"); }}><IconTruck size={15} /> Receive stock</button></div>
      </div>
    </div>
  );
}
