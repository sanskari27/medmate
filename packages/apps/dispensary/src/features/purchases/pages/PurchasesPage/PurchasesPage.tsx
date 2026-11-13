import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { PageBar } from "@/components/ui/PageBar";
import { Text } from "@/components/ui/Text";
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
  useValidateMedicinesMutation,
} from "../../purchases.api";

export function PurchasesPage() {
  const { session } = useAuthState();
  const access = purchaseAccess(session?.account.pharmacyRole, session?.account.permissions);
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const list = useListPurchasesQuery({ page, size: 25 });
  const [createPurchase, createState] = useCreatePurchaseMutation();
  const [createReturn, returnState] = useCreateReturnMutation();
  const [validate] = useValidateMedicinesMutation();
  const [form, setForm] = useState<PurchaseDraft | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const openedNew = useRef(false);
  const documents = list.data?.purchases ?? [];
  const stats = list.data?.stats;
  const selectedId = params.id ?? opened;
  const selected = documents.find((row) => row.id === selectedId) ?? null;
  const returning = Boolean(selected && returnFor === selected.id);

  function closeReceipt() {
    setReturnFor(null);
    setOpened(null);
    if (params.id) navigate("/purchases");
  }

  useEffect(() => {
    if (searchParams.get("new") === "1" && access.create && !openedNew.current) {
      openedNew.current = true;
      setForm({ distributorId: "", invoiceNo: "", invoiceDate: "", lines: [] });
    }
  }, [searchParams, access.create]);

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

  if (list.isLoading) return <Text className="text-[13.5px] text-muted">Loading purchases</Text>;

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
      {stats ? (
        <Box className="mb-4 grid gap-3 md:grid-cols-3">
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
                className="bg-wash-2 px-3 py-2 text-left text-[11px] font-bold text-muted uppercase"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.map((row) => (
            <tr key={row.id}>
              <td className="border-t border-line px-3 py-2">{typeLabel(row.type)}</td>
              <td className="border-t border-line px-3 py-2">
                <Button type="button" variant="link" onClick={() => setOpened(row.id)}>
                  {row.id}
                </Button>
              </td>
              <td className="border-t border-line px-3 py-2">{row.distributorName}</td>
              <td className="border-t border-line px-3 py-2">{row.invoiceNo}</td>
              <td className="border-t border-line px-3 py-2">{row.invoiceDate}</td>
              <td className="border-t border-line px-3 py-2">{row.lines.length}</td>
              <td className="border-t border-line px-3 py-2">{inr2(row.taxable)}</td>
              <td className="border-t border-line px-3 py-2">{inr2(row.gst)}</td>
              <td className="border-t border-line px-3 py-2 font-bold">{inr(row.ledgerAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PageBar
        page={list.data?.page ?? page}
        size={list.data?.size ?? 25}
        total={list.data?.total ?? documents.length}
        onPage={setPage}
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
    <Box className="rounded-md border border-line bg-paper p-4">
      <Text className="text-[11px] font-bold text-muted uppercase">{label}</Text>
      <Text className={`text-[22px] font-bold ${valueClass}`}>{value}</Text>
      {hint ? <Text className="text-[12px] text-muted">{hint}</Text> : null}
    </Box>
  );
}
