import { useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr, computeInvoice, timeAgo, fmtDateTime, PAY_LABEL, ONLINE_FLOW,
  STATUS_LABEL, Sale, Channel, OrderStatus, Prescription, PayMode,
} from "@/domain";
import { StatusPill, ChannelPill } from "@/components/bits";
import { IconSearch, IconPrint, IconX, IconArrowRight, IconRx, IconClock, IconShare, IconCash, IconGlobe, IconStore, IconBolt, IconBox, IconTruck, IconInbox, IconCheck, IconPin } from "@/components/Icon";
import Invoice from "@/features/sales/Invoice";
import ShareSheet from "@/components/ShareSheet";
import RxView from "@/features/prescriptions/RxView";
import PackOrder from "@/features/orders/PackOrder";

type Filter = "all" | "online" | "offline" | "action" | "unpaid";

const RX_PILL: Record<string, string> = { pending: "pill-gold", approved: "pill-blue", dispensed: "pill-green", rejected: "pill-rose" };

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const idx = ONLINE_FLOW.indexOf(status);
  return (
    <div className="pd-flex pd-no-print" style={{ margin: "4px 0 18px", gap: 0, justifyContent: "space-between" }}>
      {ONLINE_FLOW.map((st, i) => (
        <div key={st} style={{ flex: 1, textAlign: "center", position: "relative" }}>
          {i > 0 && <div style={{ position: "absolute", left: "-50%", top: 11, width: "100%", height: 3, background: i <= idx ? "var(--mid)" : "var(--line)" }} />}
          <div style={{ position: "relative", width: 24, height: 24, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", background: i <= idx ? "var(--mid)" : "var(--line)", color: "#fff", fontSize: 12, fontWeight: 800 }}>{i < idx ? <IconCheck size={12} /> : i + 1}</div>
          <div style={{ fontSize: 10.5, marginTop: 5, fontWeight: 700, color: i <= idx ? "var(--dark)" : "var(--muted)" }}>{STATUS_LABEL[st]}</div>
        </div>
      ))}
    </div>
  );
}
