import { useMemo, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import { usePharma } from "@/hooks";
import { Box, Button, Input, Progress, Stack, Text } from "@/components/atoms";
import {
  IconAlert,
  IconArrowRight,
  IconBolt,
  IconChart,
  IconCheck,
  IconClock,
  IconDoc,
  IconPill,
  IconRupee,
  IconSearch,
  IconShield,
  IconStethoscope,
} from "@/components/atoms";
import { EmptyState } from "@/components/molecules/EmptyState";
import { SegmentBar } from "@/components/molecules/BarChart";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { RX_SLA_MINS, inr, type Prescription, type RxStatus } from "@/utils";
import { RxCard } from "./components/RxCard";
import { RxDetail } from "./components/RxDetail";
import { RejectModal } from "./components/RejectModal";
import type { RxKindFilter, RxStatusFilter } from "./Prescriptions.types";
import {
  countPrescriptions,
  digitalSharePercent,
  filterPrescriptions,
  prescriptionQueueMetrics,
  shareWidth,
  slaOnTimePercent,
  turnaroundLabel,
} from "./Prescriptions.utils";

const STATUS_TABS: { key: RxStatusFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "dispensed", label: "Dispensed" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const KIND_TABS: { key: RxKindFilter; label: string }[] = [
  { key: "all", label: "All sources" },
  { key: "digital", label: "Digital" },
  { key: "uploaded", label: "Uploaded" },
];

export default function PrescriptionsScreen() {
  const { prescriptions, inventory, now, approveRx, rejectRx, dispenseRx } = usePharma();
  const [tab, setTab] = useState<RxStatusFilter>("pending");
  const [kind, setKind] = useState<RxKindFilter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Prescription | null>(null);
  const [rejecting, setRejecting] = useState<Prescription | null>(null);

  const metrics = useMemo(function computeMetrics() {
    return prescriptionQueueMetrics(prescriptions, inventory, now);
  }, [prescriptions, inventory, now]);
  const list = useMemo(function computeList() {
    return filterPrescriptions(prescriptions, tab, kind, query);
  }, [prescriptions, tab, kind, query]);
  const digitalPct = digitalSharePercent(metrics.digital, metrics.total);
  const slaPct = slaOnTimePercent(metrics.pending.length, metrics.overdue.length);

  function handleQuery(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function showPending() {
    setTab("pending");
  }

  function showApproved() {
    setTab("approved");
  }

  function handlePendingKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showPending();
    }
  }

  function handleApprovedKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showApproved();
    }
  }

  function handleCloseDetail() {
    setOpen(null);
  }

  function handleApproveOpen() {
    if (!open) return;
    approveRx(open.id);
    setOpen(null);
  }

  function handleRejectOpen() {
    if (!open) return;
    setRejecting(open);
    setOpen(null);
  }

  function handleDispenseOpen() {
    if (!open) return;
    dispenseRx(open.id);
    setOpen(null);
  }

  function handleCloseReject() {
    setRejecting(null);
  }

  function handleConfirmReject(reason: string) {
    if (!rejecting) return;
    rejectRx(rejecting.id, reason);
    setRejecting(null);
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <StatCard
          tone="bg-amber-bg text-gold-d"
          icon={<IconClock size={18} />}
          label="Pending review"
          value={String(metrics.pending.length)}
          detail={metrics.overdue.length ? <Text as="span" className="font-extrabold text-rose">{metrics.overdue.length} over SLA</Text> : "all within 2h"}
          onClick={showPending}
          onKeyDown={handlePendingKey}
          title="Pending queue"
        />
        <StatCard
          tone="bg-blue-bg text-blue"
          icon={<IconCheck size={18} />}
          label="Awaiting dispense"
          value={String(metrics.approved.length)}
          detail="approved · ready to bill"
          onClick={showApproved}
          onKeyDown={handleApprovedKey}
          title="Ready to bill"
        />
        <StatCard tone="bg-wash text-mid" icon={<IconRupee size={18} />} label="Dispensed today" value={String(metrics.dispensedToday.length)} detail={`${inr(metrics.dispensedTodayValue)} billed`} />
        <StatCard tone="bg-[#e2f2f4] text-[#1f7d8c]" icon={<IconBolt size={18} />} label="Avg turnaround" value={turnaroundLabel(metrics.averageTurnaround)} detail="upload → dispensed" />
        <StatCard tone="bg-[#efeafc] text-[#6d4fc4]" icon={<IconPill size={18} />} label="Digital share" value={`${digitalPct}%`} detail={`${metrics.digital} digital · ${metrics.uploaded} uploaded`} />
        <StatCard tone="bg-wash text-mid" icon={<IconShield size={18} />} label="SLA on-time" value={`${slaPct}%`} detail="pending within 2h" />
      </Box>

      {metrics.overdue.length > 0 && tab !== "pending" ? (
        <Button variant="ghost" block className="mb-0 mt-3.5 h-auto justify-start rounded-md border-[#f3c9c9] bg-gradient-to-r from-[#fdecec] to-[#fff6f6] px-[15px] py-[11px] text-[13px] font-semibold text-[#a0281f] hover:border-rose" onClick={showPending}>
          <IconAlert size={16} />
          <Text as="span" className="font-extrabold text-[#a0281f]">{metrics.overdue.length} prescription{metrics.overdue.length > 1 ? "s" : ""}</Text>
          waiting more than {RX_SLA_MINS / 60}h — review now <IconArrowRight size={14} />
        </Button>
      ) : null}

      <Box className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Box className="rounded-lg border border-line bg-paper p-4 shadow-sm">
          <Stack direction="row" align="center" gap={2} className="mb-3 font-display text-[13px] font-extrabold text-mid">
            <IconStethoscope size={15} /> Top prescribers
          </Stack>
          {metrics.topDoctors.length === 0 ? (
            <Text variant="muted" className="text-[12.5px]">No data yet.</Text>
          ) : (
            <DoctorBars doctors={metrics.topDoctors} />
          )}
        </Box>
        <Box className="rounded-lg border border-line bg-paper p-4 shadow-sm">
          <Stack direction="row" align="center" gap={2} className="mb-3 font-display text-[13px] font-extrabold text-mid">
            <IconChart size={15} /> Source & compliance
          </Stack>
          <SegmentBar
            className="h-3 overflow-hidden rounded-[7px]"
            segments={[
              { key: "digital", value: metrics.digital, color: "#8a6ee0", label: "Digital" },
              { key: "uploaded", value: metrics.uploaded, color: "var(--color-mid)", label: "Uploaded" },
            ]}
          />
          <Stack direction="row" gap={4} className="my-2 text-[12px] text-ink-2">
            <Text as="span"><Box className="mr-1 inline-block h-2.5 w-2.5 rounded-[3px] bg-[#8a6ee0]" /> Digital {metrics.digital}</Text>
            <Text as="span"><Box className="mr-1 inline-block h-2.5 w-2.5 rounded-[3px] bg-mid" /> Uploaded {metrics.uploaded}</Text>
          </Stack>
          <Box className="grid grid-cols-2 gap-2 border-t border-line pt-2.5">
            <Fact label="Within SLA" value={`${metrics.pending.length - metrics.overdue.length}/${metrics.pending.length || 0}`} />
            <Fact label="Avg turnaround" value={turnaroundLabel(metrics.averageTurnaround)} />
            <Fact label="Dispensed" value={String(metrics.dispensed.length)} />
            <Fact label="Rejected" value={String(countPrescriptions(prescriptions, "rejected"))} />
          </Box>
        </Box>
      </Box>

      <Stack direction="row" align="center" wrap gap={2} className="mb-4">
        <SegmentedControl label="Prescription status">
          <StatusTabs tab={tab} prescriptions={prescriptions} onSelect={setTab} />
        </SegmentedControl>
        <Box className="flex-1" />
        <SegmentedControl label="Prescription source">
          <KindTabs kind={kind} onSelect={setKind} />
        </SegmentedControl>
        <Stack direction="row" align="center" gap={2} className="min-w-[180px] max-w-[240px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2">
          <Box className="text-green"><IconSearch size={15} /></Box>
          <Input variant="plain" aria-label="Search prescriptions" placeholder="Search patient, doctor, Rx no…" value={query} onChange={handleQuery} className="placeholder:text-faint" />
        </Stack>
      </Stack>

      {list.length === 0 ? (
        <Box className="rounded-lg border border-line bg-paper shadow-sm">
          <EmptyState title="Nothing here" body="No prescriptions match this view." />
        </Box>
      ) : (
        <Box className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          <PrescriptionCards
            prescriptions={list}
            now={now}
            inventory={inventory}
            onOpen={setOpen}
            onApprove={approveRx}
            onReject={setRejecting}
            onDispense={dispenseRx}
          />
        </Box>
      )}

      {open ? (
        <RxDetail
          rx={open}
          inventory={inventory}
          now={now}
          onClose={handleCloseDetail}
          onApprove={handleApproveOpen}
          onReject={handleRejectOpen}
          onDispense={handleDispenseOpen}
        />
      ) : null}
      {rejecting ? <RejectModal rx={rejecting} onClose={handleCloseReject} onConfirm={handleConfirmReject} /> : null}
    </Box>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
  detail,
  onClick,
  onKeyDown,
  title,
}: {
  tone: string;
  icon: ReactNode;
  label: string;
  value: string;
  detail: ReactNode;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  title?: string;
}) {
  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      title={title}
      className="relative flex flex-col overflow-hidden rounded-lg border border-line bg-paper px-[18px] py-4 shadow-sm"
    >
      {onClick ? <Box className="absolute top-3 right-3 text-muted"><IconArrowRight size={16} /></Box> : null}
      <Box className={`grid h-8 w-8 place-items-center rounded-[9px] ${tone}`}>{icon}</Box>
      <Text variant="label" className="mt-3 text-[11px] uppercase tracking-[0.05em]">{label}</Text>
      <Text className="mt-[3px] mb-2.5 font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark tabular-nums">{value}</Text>
      <Text variant="caption" className="border-t border-line pt-[9px] text-[12px]">{detail}</Text>
    </Box>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={0}>
      <Text variant="label" className="text-[10.5px] uppercase tracking-[0.05em]">{label}</Text>
      <Text className="text-[15px] font-bold">{value}</Text>
    </Stack>
  );
}

function DoctorBars({ doctors }: { doctors: [string, number][] }) {
  const max = doctors[0]?.[1] || 1;
  function renderDoctor(entry: [string, number]) {
    return <DoctorBar key={entry[0]} name={entry[0]} count={entry[1]} max={max} />;
  }
  return doctors.map(renderDoctor);
}

function DoctorBar({ name, count, max }: { name: string; count: number; max: number }) {
  return (
    <Box className="mb-[9px]">
      <Stack direction="row" justify="between" className="mb-[3px] text-[12.5px]">
        <Text as="span">{name}</Text>
        <Text as="span" className="font-bold">{count} Rx</Text>
      </Stack>
      <Box className="h-1.5 overflow-hidden rounded-full bg-wash">
        <Progress value={shareWidth(count, max)} />
      </Box>
    </Box>
  );
}

function StatusTabs({
  tab,
  prescriptions,
  onSelect,
}: {
  tab: RxStatusFilter;
  prescriptions: Prescription[];
  onSelect: (status: RxStatusFilter) => void;
}) {
  function renderTab(item: (typeof STATUS_TABS)[number]) {
    function selectTab() {
      onSelect(item.key);
    }
    const count = item.key === "all" ? undefined : countPrescriptions(prescriptions, item.key as RxStatus);
    return <FilterTab key={item.key} label={count != null ? `${item.label} (${count})` : item.label} selected={tab === item.key} onSelect={selectTab} />;
  }
  return STATUS_TABS.map(renderTab);
}

function KindTabs({ kind, onSelect }: { kind: RxKindFilter; onSelect: (kind: RxKindFilter) => void }) {
  function renderKind(item: (typeof KIND_TABS)[number]) {
    function selectKind() {
      onSelect(item.key);
    }
    return <FilterTab key={item.key} label={item.label} selected={kind === item.key} onSelect={selectKind} />;
  }
  return KIND_TABS.map(renderKind);
}

function FilterTab({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <Button size="sm" variant="ghost" className={selected ? "border-transparent bg-paper text-dark shadow-sm" : "border-transparent bg-transparent text-muted shadow-none"} onClick={onSelect}>
      {label}
    </Button>
  );
}

function PrescriptionCards({
  prescriptions,
  now,
  inventory,
  onOpen,
  onApprove,
  onReject,
  onDispense,
}: {
  prescriptions: Prescription[];
  now: number;
  inventory: Parameters<typeof RxCard>[0]["inventory"];
  onOpen: (prescription: Prescription) => void;
  onApprove: (id: string) => void;
  onReject: (prescription: Prescription) => void;
  onDispense: (id: string) => void;
}) {
  function renderCard(prescription: Prescription) {
    return (
      <RxCard
        key={prescription.id}
        prescription={prescription}
        now={now}
        inventory={inventory}
        onOpen={function openCard() { onOpen(prescription); }}
        onApprove={function approveCard() { onApprove(prescription.id); }}
        onReject={function rejectCard() { onReject(prescription); }}
        onDispense={function dispenseCard() { onDispense(prescription.id); }}
      />
    );
  }
  return prescriptions.map(renderCard);
}
