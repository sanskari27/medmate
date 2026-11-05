import {
  timeAgo,
  RxStatus,
  Prescription,
  InvProduct,
  inr,
  SCHEDULE_META,
  rxWaitMins,
  rxOverdue,
  rxTurnaroundMins,
  rxAvailability,
  rxScheduledCount,
  fmtMins,
  RX_SLA_MINS,
} from "@/utils";
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconClock,
  IconDoc,
  IconPill,
  IconAlert,
  IconStethoscope,
  IconBolt,
} from "@/components/Icon";
import { monogramOf } from "@/components/EntityIcon";

const RX_PILL: Record<RxStatus, string> = {
  pending: "pill-gold",
  approved: "pill-blue",
  dispensed: "pill-green",
  rejected: "pill-rose",
};

const RX_LABEL: Record<RxStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  dispensed: "Dispensed",
  rejected: "Rejected",
};

const KIND_LABEL: Record<string, string> = { digital: "Digital Rx", uploaded: "Uploaded" };

export function RxCard({
  r,
  now,
  inventory,
  onOpen,
  onApprove,
  onReject,
  onDispense,
}: {
  r: Prescription;
  now: number;
  inventory: InvProduct[];
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDispense: () => void;
}) {
  const av = rxAvailability(r, inventory);
  const meds = av.items;
  const wait = rxWaitMins(r, now);
  const overdue = rxOverdue(r, now);
  const scheduled = rxScheduledCount(r, inventory);

  return (
    <div className={`pd-card pd-rxcard${overdue ? " overdue" : ""}`}>
      <div className="pd-card-head">
        <div className="pd-flex pd-gap6" style={{ alignItems: "center" }}>
          <span className={`pd-rx-kindico ${r.kind}`}>
            {r.kind === "digital" ? <IconPill size={15} /> : <IconDoc size={15} />}
          </span>
          <div>
            <h3 style={{ fontSize: 13.5 }}>
              {r.id}
              {r.urgent && (
                <span className="pd-pill pill-rose" style={{ marginLeft: 6 }}>
                  <IconBolt size={10} /> Urgent
                </span>
              )}
            </h3>
            <div className="sub">{timeAgo(r.uploadedAt, now)}</div>
          </div>
        </div>
        <span className={`pd-pill ${RX_PILL[r.status]}`}>
          <i className="d" />
          {RX_LABEL[r.status]}
        </span>
      </div>

      <div className="pd-card-pad" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <button onClick={onOpen} className="pd-rx-patient">
          <span className="av">{r.patient[0]}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="nm">{r.patient}</span>
            <span className="dr">
              <IconStethoscope size={11} /> {r.doctor}
              {r.regNo ? ` · ${r.regNo}` : ""}
            </span>
          </span>
          <span className="pd-pill pill-gray">{KIND_LABEL[r.kind]}</span>
        </button>

        {/* status-aware meta row */}
        {r.status === "pending" && (
          <div className={`pd-rx-sla${overdue ? " over" : ""}`}>
            <IconClock size={12} /> Waiting {fmtMins(wait)}
            {overdue ? ` · over ${RX_SLA_MINS / 60}h SLA` : ` · SLA ${RX_SLA_MINS / 60}h`}
          </div>
        )}
        {r.status === "approved" && r.approvedAt && (
          <div className="pd-rx-sla ok">
            <IconCheck size={12} /> Approved {timeAgo(r.approvedAt, now)}
            {r.reviewedBy ? ` · ${r.reviewedBy}` : ""}
          </div>
        )}
        {r.status === "dispensed" && (
          <div className="pd-rx-sla ok">
            <IconCheck size={12} /> Dispensed
            {rxTurnaroundMins(r) != null ? ` in ${fmtMins(rxTurnaroundMins(r))}` : ""}
          </div>
        )}
        {r.status === "rejected" && (
          <div className="pd-rx-sla over">
            <IconX size={12} /> {r.rejectReason || "Rejected"}
          </div>
        )}

        {/* verified medicines */}
        {meds.length > 0 && (
          <>
            <div className="pd-rx-medlbl">
              Verified medicines{" "}
              <span>
                {av.inStock}/{av.total} in stock{scheduled ? ` · ${scheduled} Rx-only` : ""}
              </span>
            </div>
            {meds.slice(0, 3).map(({ product, stock, price, rx: needsPrescription }) => (
              <div className="pd-rx-medrow" key={product.id}>
                <span className="nm">
                  <span className="em">{monogramOf(product.name)}</span> {product.name}
                  {needsPrescription && (
                    <span className="pd-schtag">{SCHEDULE_META[product.schedule].label}</span>
                  )}
                </span>
                <span className={`st ${stock > 0 ? "" : "out"}`}>
                  {stock > 0 ? inr(price) : "Out"}
                </span>
              </div>
            ))}
            {meds.length > 3 && (
              <div className="pd-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                +{meds.length - 3} more…
              </div>
            )}
            <div className="pd-rx-total">
              <span>Est. bill value</span>
              <b>{inr(av.value)}</b>
            </div>
          </>
        )}
        {av.outOfStock.length > 0 && (
          <div className="pd-rx-oos">
            <IconAlert size={12} /> {av.outOfStock.map((p) => p.name).join(", ")} out of stock
          </div>
        )}
        {r.note && meds.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, fontStyle: "italic" }}>
            “{r.note}”
          </div>
        )}
      </div>

      <div className="pd-modal-foot" style={{ borderTop: "1px solid var(--line)" }}>
        {r.status === "pending" && (
          <>
            <button className="pd-btn pd-btn-rose pd-btn-sm" onClick={onReject}>
              <IconX size={14} /> Reject
            </button>
            <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={onApprove}>
              <IconCheck size={14} /> Approve
            </button>
            <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={onDispense}>
              Dispense <IconArrowRight size={14} />
            </button>
          </>
        )}
        {r.status === "approved" && (
          <button className="pd-btn pd-btn-primary pd-btn-sm pd-btn-block" onClick={onDispense}>
            Dispense → billing <IconArrowRight size={14} />
          </button>
        )}
        {r.status === "dispensed" && (
          <button className="pd-btn pd-btn-ghost pd-btn-sm pd-btn-block" onClick={onOpen}>
            View details
          </button>
        )}
        {r.status === "rejected" && (
          <button className="pd-btn pd-btn-ghost pd-btn-sm pd-btn-block" onClick={onOpen}>
            View &amp; re-notify
          </button>
        )}
      </div>
    </div>
  );
}
