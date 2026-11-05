import { useState } from "react";
import {
  inr,
  computeInvoice,
  timeAgo,
  fmtDateTime,
  PAY_LABEL,
  ONLINE_FLOW,
  STATUS_LABEL,
  Sale,
  Prescription,
  PayMode,
} from "@/utils";
import { StatusPill } from "@/components/StatusPill";
import { ChannelPill } from "@/components/ChannelPill";
import {
  IconPrint,
  IconX,
  IconArrowRight,
  IconRx,
  IconShare,
  IconCash,
  IconBox,
  IconTruck,
  IconPin,
} from "@/components/Icon";
import Invoice from "@/components/Invoice";
import RxView from "@/components/RxView";

import { OrderTimeline } from "@/screens/Orders/components/OrderTimeline";

const RX_PILL: Record<string, string> = {
  pending: "pill-gold",
  approved: "pill-blue",
  dispensed: "pill-green",
  rejected: "pill-rose",
};

export function OrderDetail({
  sale,
  rx,
  profile,
  onClose,
  onAdvance,
  onCancel,
  onMarkPaid,
  onShare,
  onOpenRx,
  onPack,
  now,
  initialTab = "history",
}: {
  sale: Sale;
  rx?: Prescription;
  profile: any;
  onClose: () => void;
  onAdvance: () => void;
  onCancel: () => void;
  onMarkPaid: (m: PayMode) => void;
  onShare: () => void;
  onOpenRx: () => void;
  onPack?: () => void;
  now: number;
  initialTab?: "history" | "invoice";
}) {
  const [tab, setTab] = useState<"history" | "invoice">(initialTab);
  const [payMode, setPayMode] = useState<PayMode>(sale.payMode);
  const doPrint = () => {
    setTab("invoice");
    setTimeout(() => window.print(), 80);
  };
  const t = computeInvoice(sale.items, sale.discount);
  const idx = ONLINE_FLOW.indexOf(sale.status);
  const history = [...(sale.history ?? [{ status: sale.status, at: sale.createdAt }])].sort(
    (a, b) => a.at - b.at,
  );
  // remaining (future) online steps not yet reached
  const future =
    sale.channel === "online" && sale.status !== "cancelled"
      ? ONLINE_FLOW.slice(idx + 1).map((st) => ({ status: st, at: 0, future: true }))
      : [];

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head pd-no-print">
          <div>
            <h3>
              {sale.id}{" "}
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>
                · {sale.channel === "online" ? "Online order" : "Counter sale"}
              </span>
            </h3>
            <div className="pd-flex pd-gap6" style={{ marginTop: 5 }}>
              <StatusPill status={sale.status} />
              <ChannelPill channel={sale.channel} />
              {sale.rx && (
                <span className="pd-tag rx">
                  <IconRx size={11} /> Prescription
                </span>
              )}
            </div>
          </div>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="pd-no-print" style={{ padding: "12px 20px 0" }}>
          <div className="pd-seg">
            <button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>
              Details &amp; history
            </button>
            <button className={tab === "invoice" ? "on" : ""} onClick={() => setTab("invoice")}>
              Invoice
            </button>
          </div>
        </div>

        <div className="pd-modal-body">
          {tab === "history" ? (
            <>
              {/* quick facts */}
              <div className="pd-fact">
                <div>
                  <div className="k">Order date &amp; time</div>
                  <div className="v sm">{fmtDateTime(sale.createdAt)}</div>
                </div>
                <div>
                  <div className="k">Amount</div>
                  <div className="v">{inr(t.payable)}</div>
                </div>
                <div>
                  <div className="k">Payment</div>
                  <div
                    className="v sm"
                    style={sale.paid === false ? { color: "var(--rose)" } : undefined}
                  >
                    {sale.paid === false ? "Unpaid · at reception" : PAY_LABEL[sale.payMode]}
                  </div>
                </div>
                <div>
                  <div className="k">Customer</div>
                  <div className="v sm">
                    {sale.customer.name}
                    {sale.customer.phone ? ` · ${sale.customer.phone}` : ""}
                  </div>
                </div>
                <div>
                  <div className="k">Items</div>
                  <div className="v sm">
                    {sale.items.reduce((a, i) => a + i.qty, 0)} units · {sale.items.length} lines
                  </div>
                </div>
                <div>
                  <div className="k">GST</div>
                  <div className="v sm">
                    {inr(t.totalTax)} ({inr(t.taxable)} taxable)
                  </div>
                </div>
              </div>

              {sale.customer.address && (
                <p className="pd-muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
                  <IconPin size={12} /> Deliver to: {sale.customer.address}
                </p>
              )}

              {/* reception: collect pending payment */}
              {sale.paid === false && (
                <div
                  className="pd-card pd-card-pad"
                  style={{
                    background: "var(--rose-bg)",
                    border: "1px solid #f3d3d3",
                    marginBottom: 16,
                  }}
                >
                  <div
                    className="pd-flex"
                    style={{ justifyContent: "space-between", marginBottom: 10 }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "var(--rose)" }}>
                        Payment pending · {inr(t.payable)}
                      </div>
                      <div className="pd-muted" style={{ fontSize: 12 }}>
                        Sent to reception from billing. Collect & mark paid.
                      </div>
                    </div>
                  </div>
                  <div className="pd-flex pd-gap6" style={{ flexWrap: "wrap", marginBottom: 10 }}>
                    {(["cash", "upi", "card"] as PayMode[]).map((m) => (
                      <button
                        key={m}
                        className={`pd-chip${payMode === m ? " on" : ""}`}
                        onClick={() => setPayMode(m)}
                      >
                        {PAY_LABEL[m]}
                      </button>
                    ))}
                  </div>
                  <button
                    className="pd-btn pd-btn-gold pd-btn-block"
                    onClick={() => onMarkPaid(payMode)}
                  >
                    <IconCash size={15} /> Mark as paid · {PAY_LABEL[payMode]}
                  </button>
                </div>
              )}

              {sale.channel === "online" && sale.status !== "cancelled" && (
                <OrderTimeline status={sale.status} />
              )}

              {/* status history with timestamps */}
              <div className="pd-pl-head" style={{ marginTop: 0 }}>
                Status history
              </div>
              <div className="pd-vtl">
                {history.map((e, i) => (
                  <div className={`ev${e.status === "cancelled" ? " cancel" : ""}`} key={i}>
                    <div className="t">{STATUS_LABEL[e.status]}</div>
                    <div className="d">
                      {fmtDateTime(e.at)} · {timeAgo(e.at, now)}
                    </div>
                  </div>
                ))}
                {future.map((e, i) => (
                  <div className="ev future" key={"f" + i}>
                    <div className="t">{STATUS_LABEL[e.status]}</div>
                    <div className="d">Pending</div>
                  </div>
                ))}
              </div>

              {/* linked prescription */}
              {sale.rx && (
                <>
                  <div
                    className="pd-pl-head pd-flex"
                    style={{ justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span>Prescription</span>
                    {rx && (
                      <span className="pd-flex pd-gap6" style={{ alignItems: "center" }}>
                        <span className={`pd-pill ${RX_PILL[rx.status]}`}>
                          <i className="d" />
                          {rx.status}
                        </span>
                        <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={onOpenRx}>
                          Open <IconArrowRight size={13} />
                        </button>
                      </span>
                    )}
                  </div>
                  {rx ? (
                    <>
                      <div className="pd-flex pd-gap6" style={{ marginBottom: 8 }}>
                        <span className="pd-mono" style={{ fontWeight: 700, fontSize: 12.5 }}>
                          {rx.id}
                        </span>
                        <span
                          className={`pd-pill ${rx.kind === "digital" ? "pill-teal" : "pill-gray"}`}
                        >
                          {rx.kind === "digital" ? "Namma MedMate digital Rx" : "Uploaded photo"}
                        </span>
                      </div>
                      <RxView rx={rx} />
                    </>
                  ) : (
                    <p className="pd-muted" style={{ fontSize: 12.5 }}>
                      Prescription-required items — Rx verified at billing (Dr.{" "}
                      {sale.customer.doctor ?? "on file"}).
                    </p>
                  )}
                </>
              )}

              {/* items */}
              <div className="pd-pl-head">Items</div>
              <table className="pd-tbl">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Batch</th>
                    <th className="num">Qty</th>
                    <th className="num">Rate</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((it) => (
                    <tr key={it.productId + it.batchNo}>
                      <td style={{ fontWeight: 600 }}>{it.name}</td>
                      <td className="pd-mono">{it.batchNo}</td>
                      <td className="num">{it.qty}</td>
                      <td className="num">{inr(it.price)}</td>
                      <td className="num" style={{ fontWeight: 700 }}>
                        {inr(it.price * it.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>Total payable</td>
                    <td className="num">{inr(t.payable)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          ) : (
            <Invoice sale={sale} profile={profile} />
          )}
        </div>

        <div className="pd-modal-foot pd-no-print">
          {sale.channel === "online" && sale.status === "new" && (
            <button className="pd-btn pd-btn-rose" onClick={onCancel}>
              Reject order
            </button>
          )}
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="pd-btn pd-btn-ghost" onClick={onShare}>
            <IconShare size={15} /> Share
          </button>
          {sale.channel === "online" && sale.status === "new" && (
            <button className="pd-btn pd-btn-gold" onClick={onAdvance}>
              Accept order
            </button>
          )}
          {sale.channel === "online" &&
            (sale.status === "accepted" || sale.status === "packed") &&
            onPack && (
              <button className="pd-btn pd-btn-gold" onClick={onPack}>
                {sale.status === "accepted" ? (
                  <>
                    <IconBox size={15} /> Pack & dispatch
                  </>
                ) : (
                  <>
                    <IconTruck size={15} /> Hand to delivery
                  </>
                )}
              </button>
            )}
          {sale.channel === "online" && sale.status === "out" && (
            <button className="pd-btn pd-btn-gold" onClick={onAdvance}>
              Mark delivered
            </button>
          )}
          <button className="pd-btn pd-btn-primary" onClick={doPrint}>
            <IconPrint size={16} /> Print / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
