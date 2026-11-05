import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  timeAgo, fmtDateTime, RxStatus, Prescription, InvProduct, sellPrice, inr, stockOf,
  SCHEDULE_META, rxWaitMins, rxOverdue, rxTurnaroundMins, rxAvailability, rxScheduledCount,
  fmtMins, RX_SLA_MINS, waLink, smsLink,
} from "@/domain";
import { ChannelPill } from "@/components/bits";
import {
  IconCheck, IconX, IconRx, IconArrowRight, IconClock, IconDoc, IconPill, IconAlert,
  IconPhone, IconWhatsApp, IconRupee, IconBox, IconStethoscope, IconUser, IconSearch,
  IconBolt, IconCalendar, IconChart, IconShield,
} from "@/components/Icon"
import { monogramOf } from "@/components/entityIcon";
import RxView from "@/features/prescriptions/RxView";

;

const RX_PILL: Record<RxStatus, string> = { pending: "pill-gold", approved: "pill-blue", dispensed: "pill-green", rejected: "pill-rose" };

const RX_LABEL: Record<RxStatus, string> = { pending: "Pending review", approved: "Approved", dispensed: "Dispensed", rejected: "Rejected" };

const KIND_LABEL: Record<string, string> = { digital: "Digital Rx", uploaded: "Uploaded" };

const REJECT_REASONS = [
  "Prescription illegible — please re-upload a clear photo",
  "Prescriber could not be verified",
  "Prescription expired (older than 6 months)",
  "Medicine not stocked — please contact the store",
];

export function RejectModal({ rx, onClose, onConfirm }: { rx: Prescription; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="pd-modal-head"><h3>Reject {rx.id}</h3><button className="pd-x" onClick={onClose}><IconX size={18} /></button></div>
        <div className="pd-modal-body">
          <p className="pd-muted" style={{ fontSize: 12.5, marginTop: 0 }}>Pick a reason — {rx.patient} will see this so they can fix &amp; re-upload.</p>
          <div className="pd-rx-reasons">
            {REJECT_REASONS.map((rr) => (
              <button key={rr} className={`pd-rx-reason${reason === rr ? " on" : ""}`} onClick={() => setReason(rr)}>{reason === rr && <IconCheck size={13} />}{rr}</button>
            ))}
          </div>
          <label className="pd-field" style={{ marginTop: 10 }}><span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>Or write your own</span>
            <textarea className="pd-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginTop: 4, resize: "vertical" }} />
          </label>
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="pd-btn pd-btn-rose" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}><IconX size={14} /> Reject prescription</button>
        </div>
      </div>
    </div>
  );
}
