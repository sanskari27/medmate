import {
  fmtDateTime,
  RxStatus,
  Prescription,
  InvProduct,
  inr,
  SCHEDULE_META,
  rxAvailability,
  waLink,
  smsLink,
} from "@/domain";
import { ChannelPill } from "@/components/bits";
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconClock,
  IconDoc,
  IconAlert,
  IconPhone,
  IconWhatsApp,
  IconBox,
  IconUser,
  IconBolt,
} from "@/components/Icon";
import { monogramOf } from "@/components/entityIcon";
import RxView from "@/features/prescriptions/RxView";

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

export function RxDetail({
  rx,
  inventory,
  onClose,
  onApprove,
  onReject,
  onDispense,
}: {
  rx: Prescription;
  inventory: InvProduct[];
  now: number;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDispense: () => void;
}) {
  const av = rxAvailability(rx, inventory);
  const phone = rx.phone && rx.phone !== "—" ? rx.phone : "";
  const events = [
    { label: "Uploaded", at: rx.uploadedAt, tone: "done" },
    ...(rx.approvedAt
      ? [
          {
            label: `Approved${rx.reviewedBy ? ` · ${rx.reviewedBy}` : ""}`,
            at: rx.approvedAt,
            tone: "done",
          },
        ]
      : []),
    ...(rx.rejectedAt
      ? [
          {
            label: `Rejected${rx.reviewedBy ? ` · ${rx.reviewedBy}` : ""}`,
            at: rx.rejectedAt,
            tone: "bad",
          },
        ]
      : []),
    ...(rx.dispensedAt ? [{ label: "Dispensed & billed", at: rx.dispensedAt, tone: "done" }] : []),
  ];
  const readyMsg = `Hi ${rx.patient}, your prescription ${rx.id} at our pharmacy is ready. Est. bill ${inr(av.value)}. — Namma MedMate`;
  const rejMsg = `Hi ${rx.patient}, we couldn't process prescription ${rx.id}. Reason: ${rx.rejectReason || "please re-upload a clearer copy"}. — Namma MedMate`;
  const notifyMsg = rx.status === "rejected" ? rejMsg : readyMsg;

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal pd-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>
            Prescription {rx.id}{" "}
            <span className={`pd-pill ${RX_PILL[rx.status]}`} style={{ marginLeft: 6 }}>
              {RX_LABEL[rx.status]}
            </span>
            {rx.urgent && (
              <span className="pd-pill pill-rose" style={{ marginLeft: 4 }}>
                <IconBolt size={10} /> Urgent
              </span>
            )}
          </h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <div className="pd-rx-detail">
            {/* left: the Rx itself */}
            <div>
              <RxView rx={rx} />
            </div>

            {/* right: patient, timeline, meds */}
            <div className="pd-rx-side">
              <div className="pd-rx-block">
                <div className="pd-rx-blkh">
                  <IconUser size={13} /> Patient
                </div>
                <div className="pd-rx-kv">
                  <span>Name</span>
                  <b>{rx.patient}</b>
                </div>
                <div className="pd-rx-kv">
                  <span>Phone</span>
                  <b>{rx.phone || "—"}</b>
                </div>
                <div className="pd-rx-kv">
                  <span>Channel</span>
                  <b>
                    <ChannelPill channel={rx.channel} />
                  </b>
                </div>
                <div className="pd-rx-kv">
                  <span>Doctor</span>
                  <b>
                    {rx.doctor}
                    {rx.regNo ? ` · ${rx.regNo}` : ""}
                  </b>
                </div>
                {phone && (
                  <div className="pd-flex pd-gap6" style={{ marginTop: 8 }}>
                    <a
                      className="pd-btn pd-btn-line pd-btn-sm"
                      href={`tel:${phone.replace(/\s/g, "")}`}
                    >
                      <IconPhone size={13} /> Call
                    </a>
                    <a
                      className="pd-btn pd-btn-wa pd-btn-sm"
                      href={waLink(phone, notifyMsg)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IconWhatsApp size={13} /> WhatsApp
                    </a>
                    <a className="pd-btn pd-btn-line pd-btn-sm" href={smsLink(phone, notifyMsg)}>
                      SMS
                    </a>
                  </div>
                )}
              </div>

              <div className="pd-rx-block">
                <div className="pd-rx-blkh">
                  <IconClock size={13} /> Timeline
                </div>
                <div className="pd-rx-tl">
                  {events.map((e, i) => (
                    <div className={`pd-rx-tlrow ${e.tone}`} key={i}>
                      <span className="dot" />
                      <span className="lb">{e.label}</span>
                      <span className="tm">{fmtDateTime(e.at)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {av.total > 0 && (
                <div className="pd-rx-block">
                  <div className="pd-rx-blkh">
                    <IconBox size={13} /> Verified medicines{" "}
                    <span
                      className="pd-muted"
                      style={{ fontWeight: 600, marginLeft: "auto", fontSize: 11.5 }}
                    >
                      {av.inStock}/{av.total} in stock
                    </span>
                  </div>
                  <table className="pd-tbl pd-rx-mtbl">
                    <tbody>
                      {av.items.map(({ product, stock, price, rx: needsPrescription }) => (
                        <tr key={product.id}>
                          <td>
                            <span className="em" style={{ marginRight: 6 }}>
                              {monogramOf(product.name)}
                            </span>
                            {product.name}
                            {needsPrescription && (
                              <span className="pd-schtag">
                                {SCHEDULE_META[product.schedule].label}
                              </span>
                            )}
                          </td>
                          <td
                            className={stock > 0 ? "" : "pd-oos-txt"}
                            style={{ textAlign: "right", fontSize: 12 }}
                          >
                            {stock > 0 ? `${stock} in stock` : "Out of stock"}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{inr(price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}>
                          <b>Estimated bill</b>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 800 }}>{inr(av.value)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  {av.outOfStock.length > 0 && (
                    <div className="pd-rx-oos" style={{ marginTop: 8 }}>
                      <IconAlert size={12} /> {av.outOfStock.map((p) => p.name).join(", ")} out of
                      stock — suggest a substitute or reorder.
                    </div>
                  )}
                </div>
              )}
              {rx.note && (
                <div className="pd-rx-block">
                  <div className="pd-rx-blkh">
                    <IconDoc size={13} /> Note
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0 }}>{rx.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Close
          </button>
          {rx.status === "pending" && (
            <>
              <button className="pd-btn pd-btn-rose" onClick={onReject}>
                <IconX size={14} /> Reject
              </button>
              <button className="pd-btn pd-btn-line" onClick={onApprove}>
                <IconCheck size={14} /> Approve
              </button>
              <button className="pd-btn pd-btn-primary" onClick={onDispense}>
                Dispense → billing <IconArrowRight size={15} />
              </button>
            </>
          )}
          {rx.status === "approved" && (
            <button className="pd-btn pd-btn-primary" onClick={onDispense}>
              Dispense → billing <IconArrowRight size={15} />
            </button>
          )}
          {rx.status === "rejected" && phone && (
            <a
              className="pd-btn pd-btn-primary"
              href={waLink(phone, rejMsg)}
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsApp size={14} /> Notify patient
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
