import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  problemMessage,
  usePharmacyFleetQuery,
  type InsightCount,
  type InsightRank,
} from "@/features/pharmacies";

function CountList({ title, rows }: { title: string; rows: InsightCount[] }) {
  return (
    <section className="rounded-lg border border-line bg-paper px-4 py-4">
      <Heading level={3} className="text-[15px]">
        {title}
      </Heading>
      {rows.length === 0 ? (
        <Text className="mt-3 text-[13.5px] text-muted">None yet.</Text>
      ) : (
        <ul className="mt-3 grid gap-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-baseline justify-between gap-3">
              <Text className="text-[13.5px]">{row.label}</Text>
              <Text className="text-[13.5px] font-bold">{row.count}</Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Ranks({ title, rows, suffix }: { title: string; rows: InsightRank[]; suffix?: string }) {
  return (
    <section className="rounded-lg border border-line bg-paper px-4 py-4">
      <Heading level={3} className="text-[15px]">
        {title}
      </Heading>
      {rows.length === 0 ? (
        <Text className="mt-3 text-[13.5px] text-muted">None yet.</Text>
      ) : (
        <ol className="mt-3 grid gap-2">
          {rows.map((row) => (
            <li key={row.pharmacyId} className="flex items-baseline justify-between gap-3">
              <Button variant="link" asChild className="min-w-0 truncate text-[13.5px]">
                <Link to={`/pharmacies/${row.pharmacyId}`}>{row.name}</Link>
              </Button>
              <Text className="shrink-0 text-[13.5px] font-bold">
                {row.value}
                {suffix ?? ""}
              </Text>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text as="span" variant="label">
        {label}
      </Text>
      <Text className="mt-0.5 text-[13.5px]">{value}</Text>
    </div>
  );
}

export function DashboardPage() {
  const fleet = usePharmacyFleetQuery();
  const body = fleet.data;

  return (
    <Stack className="gap-4">
      <Heading level={2} className="text-[24px]">
        Pharmacy fleet
      </Heading>
      {fleet.isLoading ? (
        <Text className="text-[13.5px] text-muted">Loading pharmacies</Text>
      ) : null}
      {fleet.isError ? (
        <Text className="text-[13.5px] font-bold text-rose">
          {problemMessage(fleet.error, "Could not load pharmacies")}
        </Text>
      ) : null}
      {body ? (
        <>
          <section className="rounded-lg border border-line bg-paper px-4 py-4">
            <Heading level={3} className="text-[15px]">
              Status
            </Heading>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <Stat label="Pharmacies" value={String(body.total)} />
              <Stat label="Approved" value={String(body.status.approved)} />
              <Stat label="Blocked" value={String(body.status.blocked)} />
              <Stat label="Compliance review" value={String(body.status.complianceReview)} />
              <Stat label="Final review" value={String(body.status.finalReview)} />
              <Stat label="Incomplete" value={String(body.status.incomplete)} />
              <Stat label="Rejected" value={String(body.status.rejected)} />
              <Stat
                label="Days to submit"
                value={body.timing.daysToSubmit ? `${body.timing.daysToSubmit} days` : "—"}
              />
              <Stat
                label="Days to decision"
                value={body.timing.daysToDecision ? `${body.timing.daysToDecision} days` : "—"}
              />
              <Stat label="Open support cases" value={String(body.support.open)} />
              <Stat
                label="Median resolve time"
                value={
                  body.support.medianResolveHours ? `${body.support.medianResolveHours} hours` : "—"
                }
              />
            </dl>
          </section>
          <section className="rounded-lg border border-line bg-paper px-4 py-4">
            <Heading level={3} className="text-[15px]">
              Feature adoption
            </Heading>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <Stat
                label="Online orders"
                value={`${body.features.onlineOrders} of ${body.features.pharmacies}`}
              />
              <Stat
                label="Self-order kiosk"
                value={`${body.features.kiosk} of ${body.features.pharmacies}`}
              />
              <Stat
                label="e-Invoicing"
                value={`${body.features.eInvoicing} of ${body.features.pharmacies}`}
              />
              <Stat
                label="Loose selling"
                value={`${body.features.looseSelling} of ${body.features.pharmacies}`}
              />
              <Stat
                label="Low-stock alerts"
                value={`${body.features.lowStockAlerts} of ${body.features.pharmacies}`}
              />
            </dl>
          </section>
          <div className="grid gap-4 min-[900px]:grid-cols-2">
            <CountList title="Verification" rows={body.byStatus} />
            <CountList title="Pharmacy type" rows={body.byType} />
            <CountList title="City" rows={body.byCity} />
            <CountList title="State" rows={body.byState} />
            <CountList title="Industry" rows={body.byIndustry} />
            <CountList title="Registration" rows={body.byRegistration} />
            <CountList title="Business type" rows={body.byBusinessType} />
            <section className="rounded-lg border border-line bg-paper px-4 py-4">
              <Heading level={3} className="text-[15px]">
                Approved with no sale since approval
              </Heading>
              <Text className="mt-3 text-[13.5px] font-bold">{body.dormant.total}</Text>
              {body.dormant.pharmacies.length === 0 ? (
                <Text className="mt-2 text-[13.5px] text-muted">None yet.</Text>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {body.dormant.pharmacies.map((pharmacy) => (
                    <li key={pharmacy.pharmacyId}>
                      <Button variant="link" asChild className="text-[13.5px]">
                        <Link to={`/pharmacies/${pharmacy.pharmacyId}`}>{pharmacy.name}</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <Heading level={3} className="text-[15px]">
            Last 30 days
          </Heading>
          <div className="grid gap-4 min-[900px]:grid-cols-2">
            <Ranks title="Highest net sales" rows={body.rankings.sales} />
            <Ranks title="Highest credit outstanding" rows={body.rankings.credit} />
            <Ranks title="Highest return rate" rows={body.rankings.returns} suffix="%" />
            <Ranks title="Largest expiring stock value" rows={body.rankings.expiring} />
            <Ranks title="Most open tickets" rows={body.rankings.tickets} />
          </div>
        </>
      ) : null}
    </Stack>
  );
}
