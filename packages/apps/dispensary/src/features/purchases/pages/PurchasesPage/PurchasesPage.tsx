import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { CardLine, FitText } from "@/components/ui/FitText";
import { DateFields } from "@/components/ui/DateFields";
import { FilterField } from "@/components/ui/FilterField";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useDebounced } from "@/hooks/useDebounced";
import { useRegisterQuery } from "@/hooks/useRegisterQuery";
import { problemMessage, useAuthState } from "@/features/authentication";
import { PurchaseForm } from "../../components/PurchaseForm";
import { ReceiptDialog } from "../../components/ReceiptDialog";
import { ReturnDialog } from "../../components/ReturnDialog";
import { draftFromCsv, parsePurchaseCsv } from "../../csv";
import {
  inr,
  inr2,
  moneyTone,
  purchaseAccess,
  purchasePayload,
  type DraftLine,
  type PurchaseDraft,
  typeLabel,
} from "../../model";
import {
  useCreatePurchaseMutation,
  useCreateReturnMutation,
  useListPurchasesQuery,
  useReadPurchaseQuery,
  useValidateMedicinesMutation,
} from "../../purchases.api";

export function PurchasesPage() {
  const { session } = useAuthState();
  const access = purchaseAccess(session?.account.pharmacyRole, session?.account.permissions);
  const params = useParams();
  const register = useRegisterQuery();
  const navigate = useNavigate();
  const needle = useDebounced(register.q.trim());
  const list = useListPurchasesQuery({
    page: register.page,
    size: 25,
    q: needle || undefined,
    from: register.from || undefined,
    to: register.to || undefined,
    distributorId: register.get("distributorId") || undefined,
    productId: register.get("productId") || undefined,
  });
  const held = useRef(list.data);
  if (list.data) held.current = list.data;
  const [createPurchase, createState] = useCreatePurchaseMutation();
  const [createReturn, returnState] = useCreateReturnMutation();
  const [validate] = useValidateMedicinesMutation();
  const [form, setForm] = useState<PurchaseDraft | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const openedNew = useRef(false);
  const shown = list.data ?? held.current;
  const documents = shown?.purchases ?? [];
  const stats = shown?.stats;
  const selectedId = params.id || register.get("id") || opened;
  const detail = useReadPurchaseQuery(selectedId ?? "", { skip: !selectedId });
  const selected =
    (detail.data?.purchase?.id === selectedId ? detail.data.purchase : null) ??
    documents.find((row) => row.id === selectedId) ??
    null;
  const returning = Boolean(selected && returnFor === selected.id);

  function openPurchase(id: string) {
    setOpened(id);
    register.setQuery({ id }, { keepPage: true });
  }

  function closeReceipt() {
    setReturnFor(null);
    setOpened(null);
    register.setQuery({ id: null }, { keepPage: true });
    if (params.id) navigate("/purchases");
  }

  useEffect(() => {
    if (register.get("new") === "1" && access.create && !openedNew.current) {
      openedNew.current = true;
      setForm({ distributorId: "", invoiceNo: "", invoiceDate: "", lines: [] });
    }
  }, [access.create, register]);

  async function save(draft: PurchaseDraft) {
    setError(null);
    const result = await createPurchase(purchasePayload(draft));
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not save this purchase"));
      return;
    }
    setForm(null);
    setIssues([]);
  }

  async function upload(text: string): Promise<DraftLine[] | null> {
    const parsed = parsePurchaseCsv(text);
    const ids = [...new Set(parsed.lines.map((line) => line.productId))];
    const result =
      ids.length > 0
        ? await validate({ ids })
        : { data: { products: [], missing: [], ambiguous: [] } };
    if ("error" in result) {
      setIssues([problemMessage(result.error, "Could not check these products")]);
      return null;
    }
    const known = new Map(
      (result.data?.products ?? []).map((product) => [product.productId, product.name]),
    );
    const rejected = new Set([...(result.data?.missing ?? []), ...(result.data?.ambiguous ?? [])]);
    const kept = parsed.lines.filter((line) => known.has(line.productId));
    const catalogIssues = parsed.lines
      .filter((line) => rejected.has(line.productId))
      .map((line) => `Row ${line.line}: Product was not found`);
    setIssues([
      ...parsed.issues.map((issue) => `Row ${issue.line}: ${issue.message}`),
      ...catalogIssues,
    ]);
    return kept.map((line) => draftFromCsv(line, known.get(line.productId) ?? line.productId));
  }

  if (!shown && list.isLoading)
    return <Text className="text-[13.5px] text-muted">Loading purchases</Text>;

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-4 flex items-start justify-between gap-4">
        <Box>
          <Heading level={2}>Goods inward / purchase bills</Heading>
          <Text className="text-[13px] text-muted">Distributor bills and returns</Text>
        </Box>
        {access.create ? (
          <Button
            type="button"
            onClick={() => {
              setIssues([]);
              setForm({ distributorId: "", invoiceNo: "", invoiceDate: "", lines: [] });
            }}
          >
            New purchase entry
          </Button>
        ) : null}
      </Box>
      <Stack direction="row" align="end" wrap className="mb-4 gap-3">
        <DateFields
          from={register.from}
          to={register.to}
          onFrom={(value) => register.setQuery({ from: value })}
          onTo={(value) => register.setQuery({ to: value })}
        />
        <FilterField label="Search" className="w-[280px]">
          <Input
            aria-label="Search purchases"
            placeholder="Reference, invoice, distributor…"
            value={register.q}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              register.setQuery({ q: event.target.value })
            }
          />
        </FilterField>
      </Stack>
      {stats ? (
        <Box className="mb-4 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-3">
          <Stat
            label="Purchases this month"
            value={inr(stats.purchasesThisMonth)}
            hint={`${stats.purchaseCount} bills`}
          />
          <Stat
            label="Total outstanding payable"
            value={inr(stats.outstanding)}
            valueClass={moneyTone(stats.outstanding)}
          />
          <Stat
            label="Returns this month"
            value={inr(stats.returnsThisMonth)}
            hint={`${stats.returnCount} returns`}
          />
        </Box>
      ) : null}
      <Box className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[13.5px]">
          <thead>
            <tr>
              {[
                "Type",
                "Reference",
                "Distributor",
                "Invoice no.",
                "Date",
                "Items",
                "Taxable",
                "GST",
                "Total",
              ].map((heading) => (
                <th
                  key={heading}
                  className={`bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase ${["Items", "Taxable", "GST", "Total"].includes(heading) ? "text-right" : "text-left"}`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((row) => (
              <tr key={row.id}>
                <td className="border-t border-line px-3.5 py-[11px]">{typeLabel(row.type)}</td>
                <td className="border-t border-line px-3.5 py-[11px]">
                  <Button type="button" variant="link" onClick={() => openPurchase(row.id)}>
                    {row.id}
                  </Button>
                </td>
                <td className="border-t border-line px-3.5 py-[11px]">
                  <Button variant="link" asChild>
                    <Link to={`/distributors?q=${encodeURIComponent(row.distributorName)}`}>
                      {row.distributorName}
                    </Link>
                  </Button>
                </td>
                <td className="border-t border-line px-3.5 py-[11px]">{row.invoiceNo}</td>
                <td className="border-t border-line px-3.5 py-[11px]">{row.invoiceDate}</td>
                <td className="border-t border-line px-3.5 py-[11px] text-right tabular-nums">
                  {row.lines.length}
                </td>
                <td className="border-t border-line px-3.5 py-[11px] text-right whitespace-nowrap tabular-nums">
                  {inr2(row.taxable)}
                </td>
                <td className="border-t border-line px-3.5 py-[11px] text-right whitespace-nowrap tabular-nums">
                  {inr2(row.gst)}
                </td>
                <td className="border-t border-line px-3.5 py-[11px] text-right font-bold whitespace-nowrap tabular-nums">
                  {inr(row.ledgerAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      <PageBar
        page={shown?.page ?? register.page}
        size={shown?.size ?? 25}
        total={shown?.total ?? documents.length}
        onPage={(next) => register.setQuery({ page: next })}
      />
      {form ? (
        <PurchaseForm
          initial={form.lines.length > 0 ? form : undefined}
          issues={issues}
          saving={createState.isLoading}
          error={error}
          onClose={() => setForm(null)}
          onImport={upload}
          onSave={(draft) => void save(draft)}
        />
      ) : null}
      {selected && !returning ? (
        <ReceiptDialog
          document={selected}
          canCreateReturn={access.returnBill}
          onClose={closeReceipt}
          onCreateReturn={() => {
            setError(null);
            setReturnFor(selected.id);
          }}
        />
      ) : null}
      {selected && returning ? (
        <ReturnDialog
          document={selected}
          saving={returnState.isLoading}
          error={error}
          onClose={() => {
            setError(null);
            setReturnFor(null);
          }}
          onReturn={async (lines) => {
            setError(null);
            const result = await createReturn({ id: selected.id, body: { lines } });
            if ("error" in result)
              setError(problemMessage(result.error, "Could not save this return"));
            else closeReceipt();
          }}
        />
      ) : null}
    </Box>
  );
}

function Stat({
  label,
  value,
  hint,
  valueClass = "text-dark",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <Box className="min-w-0 max-w-full overflow-hidden rounded-md border border-line bg-paper p-4">
      <CardLine className="text-[11px] font-bold text-muted uppercase">{label}</CardLine>
      <FitText className={`text-[22px] font-bold ${valueClass}`}>{value}</FitText>
      {hint ? <CardLine className="text-[12px] text-muted">{hint}</CardLine> : null}
    </Box>
  );
}
