import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { formatWhen } from "../../ownerModel";
import { problemMessage } from "../../problemMessage";
import { usePharmacyInsightsQuery } from "../../services/pharmacies.api";
import type { PharmacyInsights } from "../../types";

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "12m", label: "12 months" },
] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <Text as="span" variant="label">
        {label}
      </Text>
      <Text className="mt-0.5 text-[13.5px] break-words">{value}</Text>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-paper px-4 py-4">
      <Heading level={3} className="text-[15px]">
        {title}
      </Heading>
      {children}
    </section>
  );
}

function ActivityBody({ insights }: { insights: PharmacyInsights }) {
  const today = insights.commercial.today;
  const month = insights.commercial.month;
  const window = insights.commercial.window;
  const stock = insights.stock;
  const people = insights.people;
  return (
    <Stack className="gap-4">
      <Card title="Today">
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Net sales" value={today.netSales} />
          <Stat label="Bills" value={String(today.bills)} />
          <Stat label="Average bill" value={today.averageBill} />
          <Stat label="Units" value={String(today.units)} />
          <Stat label="Cash" value={today.cash} />
          <Stat label="Credit" value={today.credit} />
          <Stat label="Returns" value={today.returns} />
          <Stat label="Return documents" value={String(today.returnCount)} />
        </dl>
      </Card>
      <Card title="This month">
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Net sales" value={month.netSales} />
          <Stat label="Purchases" value={month.purchases} />
          <Stat label="Expenses" value={month.expenses} />
          <Stat label="Net profit" value={month.netProfit} />
        </dl>
      </Card>
      <Card title={`${insights.from} to ${insights.to}`}>
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Net sales" value={window.netSales} />
          <Stat label="Bills" value={String(window.bills)} />
          <Stat label="Average bill" value={window.averageBill} />
          <Stat label="Units" value={String(window.units)} />
          <Stat label="Cash sales" value={window.cash} />
          <Stat label="Credit sales" value={window.creditSales} />
          <Stat label="Collected cash" value={window.collected.cash} />
          <Stat label="Collected UPI" value={window.collected.upi} />
          <Stat label="Collected card" value={window.collected.card} />
          <Stat label="Taxable sales" value={window.taxable} />
          <Stat label="COGS" value={window.cogs} />
          <Stat label="Gross profit" value={window.gross} />
          <Stat label="Margin" value={`${window.margin}%`} />
          <Stat label="Expenses" value={window.expenses} />
          <Stat label="Net profit" value={window.netProfit} />
          <Stat label="Returns" value={window.returns} />
          <Stat label="Return documents" value={String(window.returnCount)} />
          <Stat label="Return rate" value={`${window.returnRate}%`} />
          <Stat label="Outward GST" value={window.gst.outward} />
          <Stat label="Purchase GST" value={window.gst.inward} />
          <Stat
            label={window.gst.position === "credit" ? "Net GST credit" : "Net GST payable"}
            value={window.gst.amount}
          />
          <Stat label="Open credit bills" value={String(window.dues.bills)} />
          <Stat label="Credit outstanding" value={window.dues.outstanding} />
          <Stat label="Distributor outstanding" value={window.distributorOutstanding} />
          <Stat label="Last sale" value={window.lastSale ?? "—"} />
          <Stat label="Last purchase" value={window.lastPurchase ?? "—"} />
        </dl>
        <Text className="mt-4 text-[12px] font-bold tracking-wide text-muted uppercase">
          Credit ageing
        </Text>
        <ul className="mt-2 grid gap-1">
          {window.dues.buckets.map((bucket) => (
            <li key={bucket.bucket} className="flex justify-between gap-3">
              <Text className="text-[13.5px]">{bucket.bucket}</Text>
              <Text className="text-[13.5px]">
                {bucket.bills} · {bucket.amount}
              </Text>
            </li>
          ))}
        </ul>
        <Text className="mt-4 text-[12px] font-bold tracking-wide text-muted uppercase">
          Top expenses
        </Text>
        {window.topExpenses.length === 0 ? (
          <Text className="mt-2 text-[13.5px] text-muted">None in this period.</Text>
        ) : (
          <ul className="mt-2 grid gap-1">
            {window.topExpenses.map((expense) => (
              <li key={expense.category} className="flex justify-between gap-3">
                <Text className="text-[13.5px]">{expense.category}</Text>
                <Text className="text-[13.5px]">{expense.amount}</Text>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Stock">
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Products" value={String(stock.products)} />
          <Stat label="Batches" value={String(stock.batches)} />
          <Stat label="Stock at cost" value={stock.cost} />
          <Stat label="Stock at retail" value={stock.retail} />
          <Stat label="Low stock" value={String(stock.low)} />
          <Stat label="Out of stock" value={String(stock.out)} />
          <Stat label="Expiring in 4 months" value={String(stock.expiring)} />
          <Stat label="Expiring value" value={stock.expiringValue} />
          <Stat label="Expired quantity" value={String(stock.expiredQty)} />
          <Stat label="Expired value" value={stock.expiredValue} />
          <Stat label="Prescription required" value={`${stock.prescriptionShare}%`} />
          <Stat label="Racks in use" value={String(stock.racksInUse)} />
          <Stat label="Empty racks" value={String(stock.emptyRacks)} />
        </dl>
      </Card>
      <Card title="People">
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Login staff" value={String(people.staff.count)} />
          <Stat label="Disabled staff" value={String(people.staff.disabled)} />
          <Stat label="Active employees" value={String(people.employees.active)} />
          <Stat label="Inactive employees" value={String(people.employees.inactive)} />
          <Stat label="Full-time" value={String(people.employees.fullTime)} />
          <Stat label="Part-time" value={String(people.employees.partTime)} />
          <Stat label="Contract" value={String(people.employees.contract)} />
          <Stat label="Buyers" value={String(people.patients.buyers)} />
          <Stat label="Repeat buyers" value={String(people.patients.repeat)} />
          <Stat label="Consented profiles" value={String(people.patients.consented)} />
          <Stat label="Points redeemed" value={String(people.crm.pointsRedeemed)} />
          <Stat label="Campaigns" value={String(people.crm.campaigns)} />
          <Stat label="Campaign reach" value={String(people.crm.reach)} />
          <Stat label="Average rating" value={people.crm.rating ?? "—"} />
          <Stat label="Average NPS" value={people.crm.nps ?? "—"} />
          <Stat label="Percent offers" value={String(people.offers.percent)} />
          <Stat label="Flat offers" value={String(people.offers.flat)} />
          <Stat label="Lines with an offer" value={String(people.offers.stampedLines)} />
        </dl>
        <Text className="mt-4 text-[12px] font-bold tracking-wide text-muted uppercase">
          Staff permissions
        </Text>
        {people.staff.members.length === 0 ? (
          <Text className="mt-2 text-[13.5px] text-muted">No login staff.</Text>
        ) : (
          <ul className="mt-2 grid gap-1">
            {people.staff.members.map((member) => (
              <li key={member.name} className="flex justify-between gap-3">
                <Text className="text-[13.5px]">
                  {member.name}
                  {member.disabled ? " · disabled" : ""}
                </Text>
                <Text className="text-[13.5px]">{member.permissions}</Text>
              </li>
            ))}
          </ul>
        )}
        <Text className="mt-4 text-[12px] font-bold tracking-wide text-muted uppercase">
          Reminders
        </Text>
        <ul className="mt-2 grid gap-1">
          {people.crm.reminders.map((reminder) => (
            <li key={reminder.kind} className="flex justify-between gap-3">
              <Text className="text-[13.5px]">{reminder.kind}</Text>
              <Text className="text-[13.5px]">{reminder.count}</Text>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Support cases">
        {insights.cases.length === 0 ? (
          <Text className="mt-3 text-[13.5px] text-muted">No cases for this pharmacy.</Text>
        ) : (
          <ul className="mt-3 grid gap-3">
            {insights.cases.map((item) => (
              <li key={item.ticketNumber}>
                <Text className="text-[13.5px] font-bold">
                  #{item.ticketNumber} · {item.category} · {item.status}
                </Text>
                <Text className="text-[13.5px] text-muted">
                  {item.assignee.trim() ? item.assignee : "Unassigned"} · opened{" "}
                  {formatWhen(item.createdAt)}
                  {item.resolvedAt ? ` · resolved ${formatWhen(item.resolvedAt)}` : ""}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Stack>
  );
}

export function PharmacyActivity({ pharmacyId }: { pharmacyId: string }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("30d");
  const insights = usePharmacyInsightsQuery({ id: pharmacyId, range });
  return (
    <Stack className="gap-4">
      <Stack direction="row" align="center" justify="between" className="gap-3">
        <Heading level={3} className="text-[18px]">
          Activity
        </Heading>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={range === item.id ? "primary" : "line"}
              aria-pressed={range === item.id}
              onClick={() => setRange(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </Stack>
      {insights.isLoading ? (
        <Text className="text-[13.5px] text-muted">Loading activity</Text>
      ) : null}
      {insights.isError ? (
        <Text className="text-[13.5px] font-bold text-rose">
          {problemMessage(insights.error, "Could not load pharmacy activity")}
        </Text>
      ) : null}
      {insights.data ? <ActivityBody insights={insights.data} /> : null}
    </Stack>
  );
}
