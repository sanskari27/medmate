import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconEdit, IconMail, IconPhone, IconTruck } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { DistributorForm } from "../../components/DistributorForm";
import { StatementModal } from "../../components/StatementModal";
import {
  useCreateDistributorMutation,
  useListDistributorsQuery,
  useRecordPaymentMutation,
  useUpdateDistributorMutation,
} from "../../distributors.api";
import {
  activeCount,
  creditCount,
  distributorAccess,
  filterDistributors,
  inr,
  payload,
  totalOutstanding,
  type Distributor,
  type DistributorDraft,
  type PaymentPayload,
} from "../../model";

export function DistributorsPage() {
  const { session } = useAuthState();
  const access = distributorAccess(session?.account.pharmacyRole, session?.account.permissions);
  const list = useListDistributorsQuery();
  const [createDistributor, createState] = useCreateDistributorMutation();
  const [updateDistributor, updateState] = useUpdateDistributorMutation();
  const [recordPayment, payState] = useRecordPaymentMutation();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Distributor | "new" | null>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const distributors = list.data?.distributors ?? [];
  const rows = filterDistributors(distributors, query);
  const statement = distributors.find((row) => row.id === statementId) ?? null;
  const saving = createState.isLoading || updateState.isLoading;

  async function save(draft: DistributorDraft) {
    setError(null);
    const current = editing !== "new" && editing ? editing : null;
    const onlyInactive =
      current && !access.update && access.inactivate && !draft.active && current.active;
    const body = onlyInactive ? { active: false as const } : payload(draft);
    const result = current
      ? await updateDistributor({ code: current.id, body })
      : await createDistributor(body as ReturnType<typeof payload>);
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not save this distributor"));
      return;
    }
    setEditing(null);
  }

  async function pay(payment: PaymentPayload) {
    if (!statement) return;
    setError(null);
    const result = await recordPayment({ code: statement.id, body: payment });
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not record the payment"));
    }
  }

  if (list.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading distributors</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      {list.isError ? (
        <Text className="mb-3 text-[12.5px] font-bold text-rose">
          {problemMessage(list.error, "Could not load distributors")}
        </Text>
      ) : null}
      <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <Stat
          label="Distributors"
          value={String(distributors.length)}
          hint={`${activeCount(distributors)} active`}
        />
        <Stat
          label="Total outstanding"
          value={inr(totalOutstanding(distributors))}
          hint="payable to distributors"
        />
        <Stat
          label="On credit terms"
          value={String(creditCount(distributors))}
          hint="credit accounts"
        />
      </Box>
      <Stack direction="row" align="center" wrap className="mb-4 gap-2.5">
        <Heading level={2} className="text-[16px]">
          Distributor directory
        </Heading>
        <Box className="flex-1" />
        <Input
          aria-label="Search distributors"
          placeholder="Search name, GSTIN, contact…"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          className="max-w-[260px]"
        />
        {access.create ? (
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setEditing("new");
            }}
          >
            Add distributor
          </Button>
        ) : null}
      </Stack>
      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {[
                  "Distributor",
                  "Contact",
                  "GSTIN / DL No.",
                  "Payment terms",
                  "Outstanding",
                  "Status",
                  "",
                ].map((heading) => (
                  <th
                    key={heading || "actions"}
                    className="bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((distributor) => (
                <tr key={distributor.id}>
                  <td className="border-t border-line px-3.5 py-3">
                    <Stack direction="row" align="center" className="gap-2.5">
                      <Text
                        as="span"
                        className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-wash text-mid"
                      >
                        <IconTruck size={18} />
                      </Text>
                      <Box>
                        <Text className="text-[13px] font-bold text-ink">{distributor.name}</Text>
                        <Text className="text-[11.5px] text-muted">
                          {[distributor.city, distributor.state].filter(Boolean).join(", ") || "—"}
                        </Text>
                      </Box>
                    </Stack>
                  </td>
                  <td className="border-t border-line px-3.5 py-3">
                    <Text className="font-semibold">{distributor.contactPerson || "—"}</Text>
                    <Text className="flex items-center gap-1 text-[11.5px] text-muted">
                      <IconPhone size={12} /> {distributor.phone}
                    </Text>
                    {distributor.email ? (
                      <Text className="flex items-center gap-1 text-[11.5px] text-muted">
                        <IconMail size={12} /> {distributor.email}
                      </Text>
                    ) : null}
                  </td>
                  <td className="border-t border-line px-3.5 py-3 font-mono text-[12px]">
                    {distributor.gstin || "—"}
                    <Text className="text-muted">{distributor.drugLicenceNumber || "—"}</Text>
                  </td>
                  <td className="border-t border-line px-3.5 py-3">
                    {distributor.paymentTerms || "—"}
                  </td>
                  <td
                    className={`border-t border-line px-3.5 py-3 text-right font-bold ${distributor.outstanding > 0 ? "text-[#b4232a]" : "text-mid"}`}
                  >
                    {inr(distributor.outstanding)}
                  </td>
                  <td className="border-t border-line px-3.5 py-3">
                    <Text
                      as="span"
                      className={`inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-bold ${distributor.active ? "bg-wash text-mid" : "bg-gray-pill text-muted"}`}
                    >
                      <Box className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {distributor.active ? "Active" : "Inactive"}
                    </Text>
                  </td>
                  <td className="border-t border-line px-3.5 py-3">
                    <Stack direction="row" justify="end" className="gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Transactions ${distributor.name}`}
                        onClick={() => {
                          setError(null);
                          setStatementId(distributor.id);
                        }}
                      >
                        Transactions
                      </Button>
                      {access.update || access.inactivate ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${distributor.name}`}
                          onClick={() => {
                            setError(null);
                            setEditing(distributor);
                          }}
                        >
                          <IconEdit size={15} />
                        </Button>
                      ) : null}
                    </Stack>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-7 py-7 text-center text-muted">
                    <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-mid">
                      <IconTruck size={30} />
                    </Box>
                    <Text className="text-[13px] text-muted">
                      {query ? "No distributors match your search." : "No distributors added yet."}
                    </Text>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Box>
      {editing ? (
        <DistributorForm
          distributor={editing === "new" ? null : editing}
          access={access}
          saving={saving}
          error={error}
          onClose={() => setEditing(null)}
          onSave={(draft) => void save(draft)}
        />
      ) : null}
      {statement ? (
        <StatementModal
          distributor={statement}
          canPay={access.pay}
          saving={payState.isLoading}
          error={error}
          onClose={() => setStatementId(null)}
          onPay={(payment) => void pay(payment)}
        />
      ) : null}
    </Box>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Box className="rounded-md border border-line bg-paper p-4 shadow-sm">
      <Text className="text-[12px] font-bold tracking-[0.04em] text-muted uppercase">{label}</Text>
      <Text className="mt-1 font-display text-[22px] font-extrabold text-dark">{value}</Text>
      <Text className="mt-1 text-[12px] text-muted">{hint}</Text>
    </Box>
  );
}
