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

export function matchRx(prescriptions: Prescription[], s: Sale): Prescription | undefined {
  if (!s.rx) return undefined;
  return prescriptions.find((r) => r.patient.toLowerCase() === s.customer.name.toLowerCase());
}
