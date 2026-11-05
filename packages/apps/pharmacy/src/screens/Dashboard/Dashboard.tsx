import type { InvProduct, Prescription } from "@/utils";
import {
  Box,
  Button,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import { saleTotal } from "@/screens/Dashboard/utils/saleTotal";
import { Spark } from "@/components/molecules/Sparkline";
import { SalesAnalytics } from "@/screens/Dashboard/components/SalesAnalytics";
import { useMemo } from "react";
import { usePharma } from "@/hooks";
import {
  inr,
  isLowStock,
  isExpiringSoon,
  earliestBatch,
  monthsToExpiry,
  stockOf,
  timeAgo,
  catLabel,
  Sale,
} from "@/utils";
import { StatusPill } from "@/components/molecules";
import { Thumb } from "@/components/molecules";
import {
  IconRupee,
  IconOrders,
  IconRx,
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconGlobe,
  IconBox,
  IconCalendar,
  IconTrendUp,
  IconTrendDown,
  IconPos,
  IconTruck,
  IconSend,
  IconStore,
  IconStar,
} from "@/components/atoms";
import { monogramOf } from "@/components/molecules";
const DAY_MS = 86400000;
export default function DashboardScreen() {
  const { sales, inventory, prescriptions, now, go, setInvFilter, isHospital, profile } =
    usePharma();
  const openAlerts = () => {
    setInvFilter("alerts");
    go("inventory");
  };
  function kpiKey(fn: () => void) {
    return function onKpiKey(event: React.KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fn();
      }
    };
  }
  function openSales() {
    go("sales");
  }
  function openOrders() {
    go("orders");
  }
  function openPrescriptions() {
    go("prescriptions");
  }
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todays = sales.filter((s) => s.createdAt >= today.getTime() && s.status !== "cancelled");
  const online = todays.filter((s) => s.channel === "online");
  const offline = todays.filter((s) => s.channel === "offline");
  const sum = (arr: Sale[]) => arr.reduce((a, s) => a + saleTotal(s), 0);
  const onlineRev = sum(online),
    offlineRev = sum(offline),
    totalRev = onlineRev + offlineRev;
  const newOrders = sales.filter((s) => s.channel === "online" && s.status === "new");
  const pendingRx = prescriptions.filter((r) => r.status === "pending");
  const lowStock = inventory.filter(isLowStock);
  const expiring = inventory
    .filter((p) => isExpiringSoon(p, now))
    .sort((a, b) => (earliestBatch(a)?.expiry ?? "").localeCompare(earliestBatch(b)?.expiry ?? ""));
  const recent = [...sales].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  // ── smart extras: greeting, 7-day sparkline, delta, at-a-glance, top sellers ──
  const hour = new Date(now).getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const who = (profile.pharmacist || profile.name || "there").trim() || "there";
  const dateStr = new Date(now).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dayTotals = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d0 = new Date(now);
      d0.setHours(0, 0, 0, 0);
      d0.setDate(d0.getDate() - i);
      const a = d0.getTime(),
        b = a + DAY_MS;
      out.push(
        sales
          .filter((s) => s.status !== "cancelled" && s.createdAt >= a && s.createdAt < b)
          .reduce((x, s) => x + saleTotal(s), 0),
      );
    }
    return out;
  }, [sales, now]);
  const dayOrders = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d0 = new Date(now);
      d0.setHours(0, 0, 0, 0);
      d0.setDate(d0.getDate() - i);
      const a = d0.getTime(),
        b = a + DAY_MS;
      out.push(
        sales.filter((s) => s.status !== "cancelled" && s.createdAt >= a && s.createdAt < b).length,
      );
    }
    return out;
  }, [sales, now]);
  const dayRx = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d0 = new Date(now);
      d0.setHours(0, 0, 0, 0);
      d0.setDate(d0.getDate() - i);
      const a = d0.getTime(),
        b = a + DAY_MS;
      out.push(prescriptions.filter((r) => r.uploadedAt >= a && r.uploadedAt < b).length);
    }
    return out;
  }, [prescriptions, now]);
  const alertTotal = lowStock.length + expiring.length;
  const yday = dayTotals[5] ?? 0;
  const salesDelta =
    yday > 0 ? Math.round(((totalRev - yday) / yday) * 100) : totalRev > 0 ? 100 : 0;
  const itemsToday = todays.reduce((a, s) => a + s.items.reduce((x, i) => x + i.qty, 0), 0);
  const avgBill = todays.length ? Math.round(totalRev / todays.length) : 0;
  const dueCount = sales.filter((s) => s.paid === false && s.status !== "cancelled").length;
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRev = sales
    .filter((s) => s.status !== "cancelled" && s.createdAt >= monthStart.getTime())
    .reduce((a, s) => a + saleTotal(s), 0);
  const topSellers = useMemo(() => {
    const win = now - 7 * DAY_MS;
    const m: Record<
      string,
      {
        id: string;
        name: string;
        qty: number;
        rev: number;
      }
    > = {};
    sales
      .filter((s) => s.status !== "cancelled" && s.createdAt >= win)
      .forEach((s) =>
        s.items.forEach((it) => {
          const e = m[it.productId] ?? { id: it.productId, name: it.name, qty: 0, rev: 0 };
          e.qty += it.qty;
          e.rev += it.price * it.qty;
          m[it.productId] = e;
        }),
      );
    return Object.values(m)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
  }, [sales, now]);
  const topMax = Math.max(...topSellers.map((t) => t.rev), 1);
  const QA = [
    { label: "New sale", sub: "Counter / POS", Icon: IconPos, go: () => go("pos") },
    { label: "New purchase", sub: "Goods inward", Icon: IconTruck, go: () => go("purchases") },
    {
      label: "Prescriptions",
      sub: pendingRx.length ? `${pendingRx.length} pending` : "All clear",
      Icon: IconRx,
      go: () => go("prescriptions"),
    },
    {
      label: "Reorder",
      sub: lowStock.length ? `${lowStock.length} low` : "Stock healthy",
      Icon: IconSend,
      go: () => go("reorder"),
    },
  ];
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      {/* ── today strip + quick actions ── */}
      <Box
        className="!mb-3.5 !flex !flex-wrap !items-center !justify-between !gap-5 !rounded-lg !border !border-line !px-5 !py-[18px] !shadow-sm"
        style={{
          background:
            "linear-gradient(112deg, var(--color-paper) 0%, var(--color-paper) 52%, var(--color-wash-2) 100%)",
        }}
      >
        <Box className="!min-w-0">
          <Box className="!font-display !text-[23px] !font-extrabold !leading-[1.5] !tracking-[-0.025em] !text-dark">
            {greet}, {who}
          </Box>
          <Box className="!mt-[5px] !flex !flex-wrap !items-center !gap-2.5 !text-[13px] !leading-[1.5] !text-muted">
            <span>{dateStr} ·</span>
            <Text
              className="!inline-flex !items-center !gap-1.5 !rounded-full !bg-wash !px-2.5 !py-[3px] !text-[11px] !font-bold !text-mid"
              as="span"
            >
              <Box
                className={
                  profile.storeOpen
                    ? "inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-mid shadow-[0_0_0_3px_rgba(47,125,82,0.14)]"
                    : "inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                }
              />
              {profile.storeOpen ? "Store open" : "Store paused"}
            </Text>
          </Box>
        </Box>
        <Box className="!flex !flex-wrap !gap-2 max-[1099px]:!w-full">{QA.map(renderQA)}</Box>
      </Box>

      {/* ── metrics rail: context numbers, deliberately not competing cards ── */}
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(150px,1fr))] !overflow-hidden !rounded-md !border !border-line !bg-paper !shadow-sm [&>*]:!min-w-0 [&>*]:!border-r [&>*]:!border-line [&>*]:!px-4 [&>*]:!py-3 [&>*:last-child]:!border-r-0">
        <Box>
          <Text
            as="span"
            className="block text-[10.5px] font-bold tracking-[0.05em] text-muted uppercase"
          >
            This month
          </Text>
          <Text
            as="span"
            className="mt-[3px] block font-display text-[18px] font-extrabold [line-height:1.5] text-dark tabular-nums"
          >
            {inr(monthRev)}
          </Text>
        </Box>
        <Box>
          <Text
            as="span"
            className="block text-[10.5px] font-bold tracking-[0.05em] text-muted uppercase"
          >
            Avg bill today
          </Text>
          <Text
            as="span"
            className="mt-[3px] block font-display text-[18px] font-extrabold [line-height:1.5] text-dark tabular-nums"
          >
            {inr(avgBill)}
          </Text>
        </Box>
        <Box>
          <Text
            as="span"
            className="block text-[10.5px] font-bold tracking-[0.05em] text-muted uppercase"
          >
            Items sold today
          </Text>
          <Text
            as="span"
            className="mt-[3px] block font-display text-[18px] font-extrabold [line-height:1.5] text-dark tabular-nums"
          >
            {itemsToday}
          </Text>
        </Box>
        {dueCount > 0 && (
          <Box
            className="cursor-pointer transition-colors duration-[120ms] hover:bg-wash-2"
            role="button"
            onClick={goOnClick}
          >
            <Text
              as="span"
              className="block text-[10.5px] font-bold tracking-[0.05em] text-muted uppercase"
            >
              Dues to collect
            </Text>
            <Text
              as="span"
              className="mt-[3px] block font-display text-[18px] font-extrabold [line-height:1.5] text-gold-d tabular-nums"
            >
              {dueCount}
            </Text>
          </Box>
        )}
      </Box>

      {/* ── KPI cards — each opens its section ── */}
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition-[transform,box-shadow,border-color] !duration-[140ms] !ease-[ease] motion-reduce:!transition-none hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={goOnClick2}
          onKeyDown={kpiKey(openSales)}
          title="View all sales"
        >
          <Box className="flex items-start justify-between">
            <Box className="!mb-2.5 !grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
              <IconRupee size={19} />
            </Box>
            {salesDelta !== 0 && (
              <Text
                className={`!inline-flex !items-center !gap-[3px] !rounded-full !px-2 !py-[3px] !text-[11px] !font-extrabold ${salesDelta >= 0 ? "!bg-wash !text-green" : "!bg-rose-bg !text-rose"}`}
                as="span"
              >
                {salesDelta >= 0 ? <IconTrendUp size={12} /> : <IconTrendDown size={12} />}
                {Math.abs(salesDelta)}%
              </Text>
            )}
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Today’s sales
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums max-[767px]:!text-[22px]">
            {inr(totalRev)}
          </Box>
          <Box className="!mt-3 !block !h-[30px]">
            <Spark color="var(--color-mid)" data={dayTotals} />
          </Box>
          <Box className="mt-auto grid grid-cols-2 gap-2.5 border-t border-line pt-[9px]">
            <Text as="span" className="flex min-w-0 flex-col gap-px">
              <Text
                as="span"
                className="inline-flex items-center gap-1 text-[13px] font-bold text-ink tabular-nums"
              >
                <IconGlobe size={12} /> {inr(onlineRev)}
              </Text>
              <Text
                as="span"
                className="text-[10px] font-bold tracking-[0.05em] text-muted uppercase"
              >
                Online
              </Text>
            </Text>
            <Text as="span" className="flex min-w-0 flex-col gap-px">
              <Text
                as="span"
                className="inline-flex items-center gap-1 text-[13px] font-bold text-ink tabular-nums"
              >
                <IconStore size={12} /> {inr(offlineRev)}
              </Text>
              <Text
                as="span"
                className="text-[10px] font-bold tracking-[0.05em] text-muted uppercase"
              >
                Counter
              </Text>
            </Text>
          </Box>
        </Box>
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition-[transform,box-shadow,border-color] !duration-[140ms] !ease-[ease] motion-reduce:!transition-none hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={goOnClick3}
          onKeyDown={kpiKey(openOrders)}
          title="View orders"
        >
          <Box className="flex items-start justify-between">
            <Box className="!mb-2.5 !grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
              <IconOrders size={19} />
            </Box>
            {newOrders.length > 0 && (
              <Text
                className="!inline-flex !items-center !gap-[3px] !rounded-full !px-2 !py-[3px] !text-[11px] !font-extrabold !bg-amber-bg !text-gold-d"
                as="span"
              >
                {newOrders.length} new
              </Text>
            )}
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Orders today
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums max-[767px]:!text-[22px]">
            {todays.length}
          </Box>
          <Box className="!mt-3 !block !h-[30px]">
            <Spark color="var(--color-mid)" data={dayOrders} />
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] text-muted">
            {newOrders.length > 0 ? (
              <>
                <Text as="span" className="!text-[12px] !font-bold !text-gold-d">
                  {newOrders.length}
                </Text>{" "}
                awaiting action
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1">
                  <IconCheck size={12} /> all caught up
                </span>
              </>
            )}
          </Box>
        </Box>
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition-[transform,box-shadow,border-color] !duration-[140ms] !ease-[ease] motion-reduce:!transition-none hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={goOnClick4}
          onKeyDown={kpiKey(openPrescriptions)}
          title="Review prescriptions"
        >
          <Box className="flex items-start justify-between">
            <Box className="!mb-2.5 !grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
              <IconRx size={19} />
            </Box>
            {pendingRx.length > 0 && (
              <Text
                className="!inline-flex !items-center !gap-[3px] !rounded-full !px-2 !py-[3px] !text-[11px] !font-extrabold !bg-amber-bg !text-gold-d"
                as="span"
              >
                to verify
              </Text>
            )}
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Prescriptions
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums max-[767px]:!text-[22px]">
            {pendingRx.length}
          </Box>
          <Box className="!mt-3 !block !h-[30px]">
            <Spark color="var(--color-mid)" data={dayRx} />
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] text-muted">
            pending review
          </Box>
        </Box>
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition-[transform,box-shadow,border-color] !duration-[140ms] !ease-[ease] motion-reduce:!transition-none hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={openAlerts}
          onKeyDown={kpiKey(openAlerts)}
          title="See medicines to reorder & expiring stock"
        >
          <Box className="flex items-start justify-between">
            <Box className="!mb-2.5 !grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
              <IconAlert size={19} />
            </Box>
            {lowStock.length + expiring.length > 0 && (
              <Text
                className="!inline-flex !items-center !gap-[3px] !rounded-full !bg-rose-bg !px-2 !py-[3px] !text-[11px] !font-extrabold !text-rose"
                as="span"
              >
                action
              </Text>
            )}
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Stock alerts
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums max-[767px]:!text-[22px]">
            {lowStock.length + expiring.length}
          </Box>
          <Box className="!mt-3 !block !h-[30px]">
            <Box className="flex h-[7px] overflow-hidden rounded-[4px] bg-wash">
              <Box
                className="h-full bg-gold"
                style={{ width: `${alertTotal ? (lowStock.length / alertTotal) * 100 : 0}%` }}
              />
              <Box
                className="h-full bg-rose"
                style={{ width: `${alertTotal ? (expiring.length / alertTotal) * 100 : 0}%` }}
              />
            </Box>
            <Box className="!mt-2 !flex !gap-3.5 !whitespace-nowrap">
              <Text
                as="span"
                className="!inline-flex !items-center !gap-1 !text-[9.5px] !font-bold !tracking-[0.03em] !text-muted !uppercase"
              >
                <Box className="inline-block h-[7px] w-[7px] rounded-[2px] bg-gold" />
                Low stock
              </Text>
              <Text
                as="span"
                className="!inline-flex !items-center !gap-1 !text-[9.5px] !font-bold !tracking-[0.03em] !text-muted !uppercase"
              >
                <Box className="inline-block h-[7px] w-[7px] rounded-[2px] bg-rose" />
                Expiring
              </Text>
            </Box>
          </Box>
          <Box className="mt-auto grid grid-cols-2 gap-2.5 border-t border-line pt-[9px]">
            <Text as="span" className="flex min-w-0 flex-col gap-px">
              <Text as="span" className="text-[13px] font-bold text-ink tabular-nums">
                {lowStock.length}
              </Text>
              <Text
                as="span"
                className="text-[10px] font-bold tracking-[0.05em] text-muted uppercase"
              >
                Low stock
              </Text>
            </Text>
            <Text as="span" className="flex min-w-0 flex-col gap-px">
              <Text as="span" className="text-[13px] font-bold text-ink tabular-nums">
                {expiring.length}
              </Text>
              <Text
                as="span"
                className="text-[10px] font-bold tracking-[0.05em] text-muted uppercase"
              >
                Expiring
              </Text>
            </Text>
          </Box>
        </Box>
      </Box>

      {/* sales analytics (filterable) */}
      <Box className={cn("!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1", "!mt-4")}>
        <SalesAnalytics
          sales={sales}
          inventory={inventory}
          now={now}
          onlineRev={onlineRev}
          offlineRev={offlineRev}
          isHospital={isHospital}
        />
        {/* action queue */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Needs your attention</Heading>
          </Box>
          <Box className={cn("!flex-1 !p-[18px]", "!pt-1 !pb-1.5")}>
            {newOrders.length === 0 && pendingRx.length === 0 && lowStock.length === 0 ? (
              <Box
                className={cn(
                  "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
                  "!py-[26px] !px-2.5",
                )}
              >
                <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-[21px] leading-none text-mid">
                  <IconCheck size={30} />
                </Box>
                <Heading level={3}>All clear</Heading>
                <Text className="mx-auto max-w-[340px] text-[13px] text-muted">
                  No pending orders, prescriptions or stock alerts.
                </Text>
              </Box>
            ) : (
              <>
                {newOrders.slice(0, 2).map(renderO)}
                {pendingRx.slice(0, 2).map(renderR)}
                {lowStock.slice(0, 2).map(renderP)}
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Box className={cn("!grid !grid-cols-3 !gap-4 max-[767px]:!grid-cols-1", "!mt-4")}>
        {/* expiring soon */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Expiring soon</Heading>
            <Button
              className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
              onClick={goOnClick8}
            >
              Inventory <IconArrowRight size={14} />
            </Button>
          </Box>
          <Box className={cn("!flex-1 !p-[18px]", "!pt-1 !pb-1.5")}>
            {expiring.length === 0 ? (
              <Box
                className={cn(
                  "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
                  "!py-[26px] !px-2.5",
                )}
              >
                <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-[21px] leading-none text-mid">
                  <IconCalendar size={30} />
                </Box>
                <Text className="mx-auto max-w-[340px] text-[13px] text-muted">
                  No medicines expiring in the next 4 months.
                </Text>
              </Box>
            ) : (
              expiring.slice(0, 5).map(renderP2)
            )}
          </Box>
        </Box>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>
              <IconStar size={15} /> Top sellers{" "}
              <Text className={cn("!text-muted", "!font-semibold !text-[12px]")} as="span">
                · last 7 days
              </Text>
            </Heading>
            <Button
              className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
              onClick={goOnClick9}
            >
              Reports <IconArrowRight size={14} />
            </Button>
          </Box>
          <Box className={cn("!flex-1 !p-[18px]", "!pt-2")}>
            {topSellers.length === 0 ? (
              <Box
                className={cn(
                  "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
                  "!py-6 !px-2.5",
                )}
              >
                <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-[21px] leading-none text-mid">
                  <IconStar size={28} />
                </Box>
                <Text className="mx-auto max-w-[340px] text-[13px] text-muted">
                  No sales yet in the last 7 days.
                </Text>
              </Box>
            ) : (
              topSellers.map(renderTopSeller)
            )}
          </Box>
        </Box>

        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Recent transactions</Heading>
            <Button
              className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
              onClick={goOnClick10}
            >
              View all <IconArrowRight size={14} />
            </Button>
          </Box>
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2 [&_tbody_tr:last-child_td]:!border-b-0 [&_th.num]:!text-right [&_th.num]:!font-semibold [&_th.num]:!text-ink [&_td.num]:!text-right [&_td.num]:!font-extrabold [&_td.num]:!tabular-nums [&_td.num]:!text-ink">
              <TableHead>
                <TableRow className="!border-0">
                  <TableHeaderCell>Invoice</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="num">Amount</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>{recent.map(renderRecent)}</TableBody>
            </Table>
          </Box>
        </Box>
      </Box>
    </Box>
  );
  function renderQA(a: {
    label: string;
    sub: string;
    Icon: (p: { size?: number }) => React.JSX.Element;
    go: () => void;
  }) {
    return (
      <Button
        key={a.label}
        className="!inline-flex !h-auto !min-w-0 !items-center !justify-start !gap-[9px] !whitespace-normal !rounded-full !border !border-line-2 !bg-paper !py-[7px] !pr-3.5 !pl-[7px] !text-left !text-[13px] !font-bold !text-ink !shadow-none !transition-[background-color,border-color,transform] !duration-[120ms] hover:!-translate-y-px hover:!border-[#b9d0c2] hover:!bg-wash-2 active:!translate-y-0 motion-reduce:!transition-none max-[767px]:!px-3 max-[767px]:!py-2.5"
        onClick={a.go}
      >
        <Text
          className="!grid !h-[30px] !w-[30px] !shrink-0 !place-items-center !rounded-full !bg-wash !text-mid"
          as="span"
        >
          <a.Icon size={16} />
        </Text>
        <Text className="flex min-w-0 flex-col items-start text-left leading-[1.2]" as="span">
          <Text as="span" className="text-[13px] font-bold text-ink">
            {a.label}
          </Text>
          <Text as="span" className="text-[11px] font-normal text-muted">
            {a.sub}
          </Text>
        </Text>
      </Button>
    );
  }
  function goOnClick() {
    return go("khata");
  }
  function goOnClick2() {
    return go("sales");
  }
  function goOnClick3() {
    return go("orders");
  }
  function goOnClick4() {
    return go("prescriptions");
  }
  function renderO(o: Sale) {
    return (
      <Box
        className="!flex !items-center !gap-3 !border-b !border-line !py-3 last:!border-b-0"
        key={o.id}
      >
        <Text
          className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] leading-none text-ink"
          as="span"
        >
          <IconGlobe size={18} />
        </Text>
        <Text className="min-w-0 flex-1" as="span">
          <Box className="text-[13.5px] font-bold text-ink">New order {o.id}</Box>
          <Box className="text-xs text-muted">
            {o.customer.name} · {o.items.length} items · {timeAgo(o.createdAt, now)}
          </Box>
        </Text>
        <Button
          className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border-[rgba(16,48,29,0.1)] !bg-mid !text-white !shadow-sm hover:!bg-green"
          onClick={goOnClick5}
        >
          Review
        </Button>
      </Box>
    );
    function goOnClick5() {
      return go("orders");
    }
  }
  function renderR(r: Prescription) {
    return (
      <Box
        className="!flex !items-center !gap-3 !border-b !border-line !py-3 last:!border-b-0"
        key={r.id}
      >
        <Text
          className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] leading-none text-ink"
          as="span"
        >
          <IconRx size={18} />
        </Text>
        <Text className="min-w-0 flex-1" as="span">
          <Box className="text-[13.5px] font-bold text-ink">Prescription {r.id}</Box>
          <Box className="text-xs text-muted">
            {r.patient} · Dr. uploaded {timeAgo(r.uploadedAt, now)}
          </Box>
        </Text>
        <Button
          className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
          onClick={goOnClick6}
        >
          Verify
        </Button>
      </Box>
    );
    function goOnClick6() {
      return go("prescriptions");
    }
  }
  function renderP(p: InvProduct) {
    return (
      <Box
        className="!flex !items-center !gap-3 !border-b !border-line !py-3 last:!border-b-0"
        key={p.id}
      >
        <Text
          className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] leading-none text-ink"
          as="span"
        >
          <IconBox size={18} />
        </Text>
        <Text className="min-w-0 flex-1" as="span">
          <Box className="text-[13.5px] font-bold text-ink">{p.name} running low</Box>
          <Box className="text-xs text-muted">
            {stockOf(p)} left · reorder at {p.reorderLevel}
          </Box>
        </Text>
        <Button
          className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
          onClick={goOnClick7}
        >
          Restock
        </Button>
      </Box>
    );
    function goOnClick7() {
      return go("inventory");
    }
  }
  function goOnClick8() {
    return go("inventory");
  }
  function renderP2(p: InvProduct) {
    const b = earliestBatch(p)!;
    const mo = monthsToExpiry(b.expiry, now);
    const expired = mo < 0;
    return (
      <Box
        className="!flex !items-center !gap-3 !border-b !border-line !py-3 last:!border-b-0"
        key={p.id}
      >
        <Text
          className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] leading-none text-ink"
          as="span"
        >
          {monogramOf(p.name)}
        </Text>
        <Text className="min-w-0 flex-1" as="span">
          <Box className="text-[13.5px] font-bold text-ink">{p.name}</Box>
          <Box className="text-xs text-muted">
            Batch {b.batchNo} · {catLabel(p.category)} · {b.qty} units
          </Box>
        </Text>
        <Text
          className={`!inline-flex !items-center !gap-[5px] !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${expired ? "!bg-rose-bg !text-rose" : "!bg-amber-bg !text-gold-d"}`}
          as="span"
        >
          {expired ? "Expired" : `${mo} mo · ${b.expiry}`}
        </Text>
      </Box>
    );
  }
  function goOnClick9() {
    return go("reports");
  }
  function renderTopSeller(
    t: {
      id: string;
      name: string;
      qty: number;
      rev: number;
    },
    i: number,
  ) {
    const p = inventory.find(matchInventory);
    return (
      <Box
        className="!flex !items-center !gap-[11px] !border-b !border-line !py-[9px] last:!border-b-0"
        key={t.id}
      >
        <Text
          className="grid h-5 w-5 shrink-0 place-items-center rounded-xs bg-wash text-[11px] font-extrabold text-mid"
          as="span"
        >
          {i + 1}
        </Text>
        <Text
          className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-sm bg-wash text-base text-ink"
          as="span"
        >
          {p ? (
            <Thumb p={p} className="!text-base !font-normal !text-ink" />
          ) : (
            <IconBox size={16} />
          )}
        </Text>
        <Box className="min-w-0 flex-1">
          <Box className="truncate text-[13px] font-bold text-ink">{t.name}</Box>
          <Box className="mt-[5px] h-1.5 overflow-hidden rounded-[5px] bg-wash">
            <Box
              className="h-full rounded-[5px] bg-gradient-to-r from-gold to-gold-d"
              style={{ width: `${(t.rev / topMax) * 100}%` }}
            />
          </Box>
        </Box>
        <Box className="flex shrink-0 flex-col text-right font-display text-[13px] font-extrabold text-dark">
          {inr(t.rev)}
          <Text as="span" className="text-[10.5px] font-semibold text-muted">
            {t.qty} sold
          </Text>
        </Box>
      </Box>
    );
    function matchInventory(x: InvProduct) {
      return x.id === t.id;
    }
  }
  function goOnClick10() {
    return go("orders");
  }
  function renderRecent(s: Sale) {
    return (
      <TableRow
        key={s.id}
        onClick={goOnClick11}
        className="!cursor-pointer !border-0 transition-colors duration-100 hover:!bg-wash-2"
      >
        <TableCell className="!font-mono !font-bold">{s.id}</TableCell>
        <TableCell>
          {s.customer.name}
          <Box className="!text-[11.5px] !text-muted">{timeAgo(s.createdAt, now)}</Box>
        </TableCell>
        <TableCell>
          <StatusPill status={s.status} />
        </TableCell>
        <TableCell className="num">{inr(saleTotal(s))}</TableCell>
      </TableRow>
    );
    function goOnClick11() {
      return go("orders");
    }
  }
}
