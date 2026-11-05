import type { Channel } from "@/domain/selling";
import { SCHEDULE_META, sellPrice, stockOf, type InvProduct } from "@/domain/stock";

// ── prescriptions queue ─────────────────────────────────────────
export type RxStatus = "pending" | "approved" | "dispensed" | "rejected";
// how the prescription reached the pharmacy:
//  • "uploaded" → customer uploaded a photo/scan of a doctor's paper prescription
//  • "digital"  → e-prescription issued by a Namma MedMate doctor (teleconsult)
export type RxKind = "uploaded" | "digital";
export type RxMed = { name: string; dose: string; days?: number };
export type Prescription = {
  id: string;
  patient: string;
  phone: string;
  doctor: string;
  uploadedAt: number;
  channel: Channel;
  status: RxStatus;
  items: string[];            // product ids the pharmacist verified
  note?: string;
  kind: RxKind;               // uploaded photo vs Namma MedMate digital Rx
  fileType?: "image" | "pdf"; // uploaded file format (default image)
  image?: string;             // uploaded photo (data URL) — for kind "uploaded"
  regNo?: string;             // doctor's medical-council reg no (digital)
  signedAt?: number;          // e-signature timestamp (digital)
  meds?: RxMed[];             // structured medicines with dosage (digital)
  approvedAt?: number;        // when the pharmacist approved it
  dispensedAt?: number;       // when it was billed & dispensed
  rejectedAt?: number;        // when it was rejected
  rejectReason?: string;      // why it was rejected (shown to customer)
  reviewedBy?: string;        // pharmacist who actioned it
  urgent?: boolean;           // patient flagged it urgent
};
const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Build a believable "scanned paper prescription" image (used when a real photo
// isn't attached) so the pharmacist can view an uploaded-style Rx.
export const rxImageDataUrl = (rx: Prescription): string => {
  const body = (rx.note ? [rx.note] : []).concat((rx.meds ?? []).map((m) => `${m.name} — ${m.dose}`)).slice(0, 6);
  const lines = body.length ? body : ["Tab. as advised", "Take after food", "Review after 2 weeks"];
  const sig = rx.doctor.replace(/^Dr\.?\s*/i, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='560' viewBox='0 0 420 560'>
<rect width='420' height='560' fill='#fbfaf3'/>
<rect width='420' height='72' fill='#1B3D29'/>
<text x='22' y='34' fill='#ffffff' font-family='Georgia,serif' font-size='19' font-weight='bold'>${xmlEsc(rx.doctor)}</text>
<text x='22' y='55' fill='#cfe6d8' font-family='Arial' font-size='11.5'>MBBS, MD (Gen. Med.) · Reg. ${xmlEsc(rx.regNo ?? "KMC-44219")}</text>
<text x='22' y='118' fill='#1B3D29' font-family='Georgia,serif' font-size='42' font-weight='bold'>&#8478;</text>
<text x='86' y='100' fill='#333' font-family='Arial' font-size='13'>Patient: ${xmlEsc(rx.patient)}</text>
<text x='86' y='120' fill='#777' font-family='Arial' font-size='11.5'>Date: ____ / ____ / ______</text>
<line x1='22' y1='138' x2='398' y2='138' stroke='#dcdcd0'/>
${lines.map((l, i) => `<text x='30' y='${182 + i * 46}' fill='#243' font-family='Comic Sans MS,cursive' font-size='16'>&#8226; ${xmlEsc(l)}</text>`).join("")}
<text x='250' y='516' fill='#1B3D29' font-family='Brush Script MT,cursive' font-size='27' font-style='italic'>${xmlEsc(sig)}</text>
<line x1='250' y1='524' x2='398' y2='524' stroke='#999'/>
<text x='250' y='540' fill='#888' font-family='Arial' font-size='10.5'>Signature &amp; seal</text>
</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

// ── prescription analytics helpers ──
export const RX_SLA_MINS = 120;                              // target: review within 2 hours
export const rxNeedsAction = (r: Prescription) => r.status === "pending" || r.status === "approved";
// minutes a pending Rx has been waiting (0 for actioned ones)
export const rxWaitMins = (r: Prescription, now: number) => r.status === "pending" ? Math.max(0, Math.round((now - r.uploadedAt) / 60000)) : 0;
export const rxOverdue = (r: Prescription, now: number) => r.status === "pending" && rxWaitMins(r, now) > RX_SLA_MINS;
// upload → dispensed/rejected turnaround in minutes (null if still open)
export const rxTurnaroundMins = (r: Prescription): number | null => {
  const end = r.dispensedAt ?? r.rejectedAt;
  return end ? Math.max(0, Math.round((end - r.uploadedAt) / 60000)) : null;
};
// verified line items → live stock + pricing
export type RxAvailability = {
  items: { product: InvProduct; stock: number; price: number; rx: boolean }[];
  value: number;
  total: number;
  inStock: number;
  outOfStock: InvProduct[];
};
export const rxAvailability = (prescription: Prescription, inventory: InvProduct[]): RxAvailability => {
  const items = prescription.items.flatMap((productId) => {
    const product = inventory.find((row) => row.id === productId);
    if (!product) return [];
    return [{
      product,
      stock: stockOf(product),
      price: sellPrice(product),
      rx: SCHEDULE_META[product.schedule].rx,
    }];
  });
  return {
    items,
    value: items.reduce((sum, row) => sum + row.price, 0),
    total: items.length,
    inStock: items.filter((row) => row.stock > 0).length,
    outOfStock: items.filter((row) => row.stock <= 0).map((row) => row.product),
  };
};
/** How many verified lines need a prescription (Schedule H, H1, or X). */
export const rxScheduledCount = (prescription: Prescription, inventory: InvProduct[]) =>
  prescription.items.filter((productId) => {
    const product = inventory.find((row) => row.id === productId);
    return product ? SCHEDULE_META[product.schedule].rx : false;
  }).length;
