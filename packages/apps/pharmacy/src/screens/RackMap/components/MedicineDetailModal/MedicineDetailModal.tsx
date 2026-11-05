import {
  InvProduct,
  stockOf,
  hasLocation,
  locationCodes,
  inr,
  inr2,
  stockValue,
  looseUnitsOf,
  monthsToExpiry,
  isExpired,
  catLabel,
  unitNoun,
  stockLabel,
} from "@/utils";
import { Thumb } from "@/components/Thumb";
import { ScheduleTag } from "@/components/ScheduleTag";
import { IconX, IconPin, IconBox, IconUnlock, IconReceipt, IconTag } from "@/components/Icon";

export function MedicineDetailModal({
  p,
  now,
  onClose,
}: {
  p: InvProduct;
  now: number;
  onClose: () => void;
}) {
  const mrpValue = p.batches.reduce((a, b) => a + b.qty * b.mrp, 0);
  const buyValue = stockValue(p);
  const totalQty = stockOf(p);
  const facts: [string, React.ReactNode][] = [
    ["Composition / salt", p.composition],
    ["Manufacturer", p.manufacturer],
    ["Pack", p.pack],
    ["Category", catLabel(p.category)],
    ["Form", p.form],
    ["HSN", p.hsn],
    ["GST", `${p.gst}%`],
    [
      "Rack location",
      hasLocation(p) ? <span className="pd-mono">{locationCodes(p).join(" · ")}</span> : "—",
    ],
    ["Reorder level", `${p.reorderLevel} units`],
  ];
  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3 className="pd-flex" style={{ gap: 10, alignItems: "center" }}>
            <span
              className="em"
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--wash)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              <Thumb p={p} />
            </span>
            {p.name}{" "}
            {hasLocation(p) && (
              <span className="pd-rackchip">
                <IconPin size={11} /> {p.rack}
              </span>
            )}{" "}
            <ScheduleTag schedule={p.schedule} />
          </h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          {/* value summary */}
          <div className="pd-stats" style={{ marginBottom: 16 }}>
            <div className="pd-stat">
              <div className="ic ic-green">
                <IconBox size={18} />
              </div>
              <div className="lbl">In stock</div>
              <div className="val" style={{ fontSize: 18 }}>
                {stockLabel(p)}
              </div>
              <div className="split">total units</div>
            </div>
            <div className="pd-stat">
              <div className="ic ic-gold">
                <IconUnlock size={18} />
              </div>
              <div className="lbl">Loose {unitNoun(p)}s</div>
              <div className="val" style={{ fontSize: 18 }}>
                {looseUnitsOf(p)}
              </div>
              <div className="split">opened strips</div>
            </div>
            <div className="pd-stat">
              <div className="ic ic-blue">
                <IconReceipt size={18} />
              </div>
              <div className="lbl">Purchase value (cost)</div>
              <div className="val" style={{ fontSize: 18 }}>
                {inr(buyValue)}
              </div>
              <div className="split">what you paid</div>
            </div>
            <div className="pd-stat">
              <div className="ic ic-rose">
                <IconTag size={18} />
              </div>
              <div className="lbl">MRP value</div>
              <div className="val" style={{ fontSize: 18 }}>
                {inr(mrpValue)}
              </div>
              <div className="split">retail value</div>
            </div>
          </div>

          {/* details grid */}
          <div className="pd-rack-facts">
            {facts.map(([k, v]) => (
              <div className="f" key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </div>
            ))}
          </div>

          {/* batch table */}
          <b style={{ fontSize: 13, display: "block", margin: "16px 0 8px" }}>
            Batches · stock, expiry & value
          </b>
          <div className="pd-tbl-wrap">
            <table className="pd-tbl">
              <thead>
                <tr>
                  <th>Batch no.</th>
                  <th>Expiry</th>
                  <th className="num">Qty</th>
                  <th className="num">MRP</th>
                  <th className="num">Purchase / PTR</th>
                  <th className="num">MRP value</th>
                  <th className="num">Purchase value</th>
                </tr>
              </thead>
              <tbody>
                {p.batches.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="pd-empty" style={{ padding: "16px" }}>
                        <p>No batches in stock.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {p.batches.map((b) => {
                  const mo = monthsToExpiry(b.expiry, now);
                  const exp = isExpired(b.expiry, now);
                  return (
                    <tr key={b.batchNo}>
                      <td className="pd-mono" style={{ fontWeight: 700 }}>
                        {b.batchNo || "—"}
                      </td>
                      <td>
                        <span
                          className={`pd-pill ${exp ? "pill-rose" : mo <= 4 ? "pill-gold" : "pill-gray"}`}
                        >
                          {b.expiry}
                          {exp ? " · expired" : mo <= 4 ? ` · ${mo}mo` : ""}
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 700 }}>
                        {b.qty}
                      </td>
                      <td className="num">{inr(b.mrp)}</td>
                      <td className="num">{inr2(b.ptr)}</td>
                      <td className="num">{inr(b.qty * b.mrp)}</td>
                      <td className="num">{inr(b.qty * b.ptr)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {p.batches.length > 0 && (
                <tfoot>
                  <tr style={{ background: "var(--wash2)", fontWeight: 800 }}>
                    <td colSpan={2}>
                      Total · {p.batches.length} batch{p.batches.length !== 1 ? "es" : ""}
                    </td>
                    <td className="num">{totalQty}</td>
                    <td className="num" colSpan={2}></td>
                    <td className="num">{inr(mrpValue)}</td>
                    <td className="num">{inr(buyValue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="pd-muted" style={{ fontSize: 11.5, marginTop: 10 }}>
            Purchase value = stock × purchase price (PTR). MRP value = stock × MRP. Stock updates
            automatically from purchases & sales.
          </p>
        </div>
      </div>
    </div>
  );
}
