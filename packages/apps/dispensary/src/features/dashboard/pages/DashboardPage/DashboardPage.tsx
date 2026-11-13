import { useState, type ReactNode } from "react";
import { Box, Button, Heading, Text } from "@/components/ui";
import { IconBox, IconCash, IconCheck, IconReceipt, IconStar } from "@/components/ui/Icon";
import { useAuthState } from "@/features/authentication";
import { HBar, PurchaseChart, SalesChart, Spark } from "../../components/Charts";
import { useReadDashboardQuery } from "../../dashboard.api";
import {
  greeting,
  inr,
  kolkataDate,
  moneyNumber,
  payLabel,
  type DashboardRange,
  type DashboardSnapshot,
} from "../../model";

const RANGES: { id: DashboardRange; label: string }[] = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "12m", label: "12M" },
];

export function DashboardPage() {
  const { session } = useAuthState();
  const [range, setRange] = useState<DashboardRange>("7d");
  const [metric, setMetric] = useState<"revenue" | "bills">("revenue");
  const [chart, setChart] = useState<"donut" | "group" | "line">("donut");
  const query = useReadDashboardQuery({ range });
  const now = new Date();

  if (query.isLoading) return <Text className="text-[13.5px] text-muted">Loading dashboard</Text>;
  if (!query.data)
    return <Text className="text-[13.5px] text-muted">The dashboard could not be loaded.</Text>;

  const view = query.data;
  const alertTotal = view.stock.low + view.stock.expiring;
  const sellerMax = Math.max(
    ...view.window.topSellers.map((seller) => moneyNumber(seller.revenue)),
    1,
  );
  const expenseMax = Math.max(...view.window.expenses.map((row) => moneyNumber(row.amount)), 1);
  const collected = [
    { label: "Cash", amount: view.window.collected.cash },
    { label: "UPI", amount: view.window.collected.upi },
    { label: "Card", amount: view.window.collected.card },
  ];
  const collectedMax = Math.max(...collected.map((row) => moneyNumber(row.amount)), 1);
  const format = metric === "revenue" ? inr : (value: number) => String(value);
  const slices = [
    {
      key: "cash",
      label: "Cash",
      color: "var(--color-gold)",
      amount: sum(view, metric, "cash"),
    },
    {
      key: "credit",
      label: "Credit",
      color: "var(--color-mid)",
      amount: sum(view, metric, "credit"),
    },
  ];

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-3.5 rounded-lg border border-line bg-paper px-5 py-[18px] shadow-sm">
        <Heading level={2} className="text-[23px]">
          {greeting(now, session?.account.displayName ?? "")}
        </Heading>
        <Text className="mt-[5px] text-[13px] text-muted">{kolkataDate(now)}</Text>
      </Box>

      <Box className="mb-[22px] grid overflow-hidden rounded-md border border-line bg-paper shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <Rail label="This month" value={inr(view.month.netSales)} />
        <Rail label="Avg bill today" value={inr(view.today.averageBill)} />
        <Rail label="Items sold today" value={String(view.today.units)} />
        <Rail
          label="Dues to collect"
          value={String(view.dues.bills)}
          hint={inr(view.dues.outstanding)}
        />
      </Box>

      <Box className="mb-[22px] grid overflow-hidden rounded-md border border-line bg-paper shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <Rail label="Purchases this month" value={inr(view.month.purchases)} />
        <Rail label="Expenses this month" value={inr(view.month.expenses)} />
        <Rail
          label="Returns today"
          value={inr(view.today.returns)}
          hint={`${view.today.returnCount} returns`}
        />
        <Rail
          label="Stock at cost"
          value={inr(view.stock.cost)}
          hint={`Retail ${inr(view.stock.retail)}`}
        />
      </Box>

      <Box className="mb-[22px] grid gap-4 md:grid-cols-3">
        <Box className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
          <Box className="mb-2.5 grid h-8 w-8 place-items-center rounded-[9px] bg-wash text-mid">
            <IconCash size={19} />
          </Box>
          <Text className="text-[11px] font-bold tracking-[0.05em] text-muted uppercase">
            Today's sales
          </Text>
          <Text className="font-display text-[26px] font-extrabold text-dark tabular-nums">
            {inr(view.today.netSales)}
          </Text>
          <Spark data={view.today.spark.map(moneyNumber)} />
          <Box className="mt-3 grid grid-cols-2 gap-2.5 border-t border-line pt-[9px]">
            <Split label="Cash" value={inr(view.today.cash)} />
            <Split label="Credit" value={inr(view.today.credit)} />
          </Box>
        </Box>
        <Box className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
          <Box className="mb-2.5 grid h-8 w-8 place-items-center rounded-[9px] bg-blue-bg text-blue">
            <IconReceipt size={19} />
          </Box>
          <Text className="text-[11px] font-bold tracking-[0.05em] text-muted uppercase">
            Bills today
          </Text>
          <Text className="font-display text-[26px] font-extrabold text-dark tabular-nums">
            {view.today.bills}
          </Text>
        </Box>
        <Box className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
          <Box className="mb-2.5 grid h-8 w-8 place-items-center rounded-[9px] bg-rose-bg text-rose">
            <IconBox size={19} />
          </Box>
          <Text className="text-[11px] font-bold tracking-[0.05em] text-muted uppercase">
            Stock alerts
          </Text>
          <Text className="font-display text-[26px] font-extrabold text-dark tabular-nums">
            {alertTotal}
          </Text>
          <Box className="mt-3 flex h-[7px] overflow-hidden rounded-[4px] bg-wash">
            <Box
              className="h-full bg-gold"
              style={{ width: `${alertTotal ? (view.stock.low / alertTotal) * 100 : 0}%` }}
            />
            <Box
              className="h-full bg-rose"
              style={{ width: `${alertTotal ? (view.stock.expiring / alertTotal) * 100 : 0}%` }}
            />
          </Box>
          <Box className="mt-3 grid grid-cols-3 gap-2.5 border-t border-line pt-[9px]">
            <Split label="Low stock" value={String(view.stock.low)} />
            <Split label="Out" value={String(view.stock.out)} />
            <Split label="Expiring" value={String(view.stock.expiring)} />
          </Box>
        </Box>
      </Box>

      <Box className="mb-3 flex flex-wrap gap-2">
        {RANGES.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={range === item.id ? "primary" : "ghost"}
            aria-pressed={range === item.id}
            onClick={() => setRange(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </Box>

      <Box className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Sales">
          <Box className="mb-2 flex flex-wrap gap-2">
            <Toggle pressed={metric === "revenue"} onClick={() => setMetric("revenue")}>
              Revenue
            </Toggle>
            <Toggle pressed={metric === "bills"} onClick={() => setMetric("bills")}>
              Bills
            </Toggle>
            <Toggle pressed={chart === "donut"} onClick={() => setChart("donut")}>
              Donut
            </Toggle>
            <Toggle pressed={chart === "group"} onClick={() => setChart("group")}>
              Grouped bars
            </Toggle>
            <Toggle pressed={chart === "line"} onClick={() => setChart("line")}>
              Line
            </Toggle>
          </Box>
          <SalesChart
            slices={slices}
            buckets={view.window.buckets.map((bucket) => ({
              label: bucket.label,
              cash: metric === "revenue" ? moneyNumber(bucket.cash) : bucket.cashBills,
              credit: metric === "revenue" ? moneyNumber(bucket.credit) : bucket.creditBills,
            }))}
            kind={chart}
            format={format}
          />
        </Panel>
        <Panel title="Needs your attention">
          {view.stock.attention.length === 0 ? (
            <Empty
              icon={<IconCheck size={28} />}
              title="All clear"
              body="No pending stock alerts."
            />
          ) : (
            view.stock.attention.map((item) => (
              <Row
                key={item.name}
                title={item.name}
                sub={`${item.onHand} left · reorder at ${item.reorder}`}
              />
            ))
          )}
        </Panel>
      </Box>

      <Box className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Expiring soon">
          {view.stock.expiringSoon.length === 0 ? (
            <Empty body="No medicines expiring in the next 4 months." />
          ) : (
            view.stock.expiringSoon.map((item) => (
              <Row
                key={`${item.name}-${item.batchNo}`}
                title={item.name}
                sub={`Batch ${item.batchNo} · ${item.qty} units`}
                aside={item.expired ? "Expired" : `${item.months} mo · ${item.expiry}`}
              />
            ))
          )}
        </Panel>
        <Panel title="Top sellers">
          {view.window.topSellers.length === 0 ? (
            <Empty icon={<IconStar size={28} />} body="No sales yet in this period." />
          ) : (
            view.window.topSellers.map((seller, index) => (
              <HBar
                key={seller.name}
                label={`${index + 1}. ${seller.name}`}
                right={`${inr(seller.revenue)} · ${seller.qty} sold`}
                pct={(moneyNumber(seller.revenue) / sellerMax) * 100}
                color="var(--color-gold)"
              />
            ))
          )}
        </Panel>
        <Panel title="Recent bills">
          {view.recent.length === 0 ? (
            <Empty body="No bills yet." />
          ) : (
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr>
                  {["Invoice", "Patient", "Status", "Amount"].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-line bg-wash-2 px-3 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.recent.map((bill) => (
                  <tr key={bill.number}>
                    <td className="border-b border-line px-3 py-[11px] font-bold text-ink">
                      {bill.number}
                    </td>
                    <td className="border-b border-line px-3 py-[11px] text-ink-2">
                      {bill.patient}
                    </td>
                    <td className="border-b border-line px-3 py-[11px] text-ink-2">
                      {payLabel(bill.payMode)}
                    </td>
                    <td className="border-b border-line px-3 py-[11px] text-right font-extrabold text-ink tabular-nums">
                      {inr(bill.payable)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </Box>

      <Box className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Gross profit">
          <Split label="Taxable sales" value={inr(view.window.profit.taxable)} />
          <Split label="COGS" value={inr(view.window.profit.cogs)} />
          <Split label="Gross profit" value={inr(view.window.profit.gross)} />
          <Split label="Margin" value={`${view.window.margin}%`} />
          <Split label="Returns" value={inr(view.window.returns)} />
        </Panel>
        <Panel title="Purchases versus sales">
          <PurchaseChart
            buckets={view.window.buckets.map((bucket) => ({
              label: bucket.label,
              sales: moneyNumber(bucket.sales),
              purchases: moneyNumber(bucket.purchases),
            }))}
          />
        </Panel>
        <Panel title="Expenses">
          {view.window.expenses.length === 0 ? (
            <Empty body="No expenses recorded in this period." />
          ) : (
            view.window.expenses.map((row) => (
              <HBar
                key={row.category}
                label={row.category}
                right={inr(row.amount)}
                pct={(moneyNumber(row.amount) / expenseMax) * 100}
                color="var(--color-mid)"
              />
            ))
          )}
        </Panel>
        <Panel title="Cash collected">
          {collected.map((row) => (
            <HBar
              key={row.label}
              label={row.label}
              right={inr(row.amount)}
              pct={(moneyNumber(row.amount) / collectedMax) * 100}
              color="var(--color-gold)"
            />
          ))}
        </Panel>
      </Box>
    </Box>
  );
}

function sum(view: DashboardSnapshot, metric: "revenue" | "bills", side: "cash" | "credit") {
  return view.window.buckets.reduce((total, bucket) => {
    if (metric === "bills")
      return total + (side === "cash" ? bucket.cashBills : bucket.creditBills);
    return total + moneyNumber(side === "cash" ? bucket.cash : bucket.credit);
  }, 0);
}

function Rail({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box className="border-line px-4 py-3 sm:border-r sm:last:border-r-0">
      <Text className="text-[10.5px] font-bold tracking-[0.05em] text-muted uppercase">
        {label}
      </Text>
      <Text className="mt-[3px] font-display text-[18px] font-extrabold text-dark tabular-nums">
        {value}
      </Text>
      {hint ? <Text className="text-[12px] text-muted">{hint}</Text> : null}
    </Box>
  );
}

function Split({ label, value }: { label: string; value: string }) {
  return (
    <Text className="flex flex-col">
      <Text as="span" className="text-[13px] font-bold text-ink tabular-nums">
        {value}
      </Text>
      <Text as="span" className="text-[10px] font-bold tracking-[0.05em] text-muted uppercase">
        {label}
      </Text>
    </Text>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box className="rounded-md border border-line bg-paper shadow-sm">
      <Box className="border-b border-line px-[18px] py-[15px]">
        <Heading level={3}>{title}</Heading>
      </Box>
      <Box className="p-[18px]">{children}</Box>
    </Box>
  );
}

function Toggle({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? "primary" : "ghost"}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Row({ title, sub, aside }: { title: string; sub: string; aside?: string }) {
  return (
    <Box className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <Box className="min-w-0 flex-1">
        <Text className="text-[13.5px] font-bold text-ink">{title}</Text>
        <Text className="text-xs text-muted">{sub}</Text>
      </Box>
      {aside ? <Text className="text-[11px] font-bold text-gold-d">{aside}</Text> : null}
    </Box>
  );
}

function Empty({ title, body, icon }: { title?: string; body: string; icon?: ReactNode }) {
  return (
    <Box className="px-2 py-6 text-center text-muted">
      {icon ? (
        <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
          {icon}
        </Box>
      ) : null}
      {title ? <Heading level={3}>{title}</Heading> : null}
      <Text className="mx-auto max-w-[340px] text-[13px] text-muted">{body}</Text>
    </Box>
  );
}
