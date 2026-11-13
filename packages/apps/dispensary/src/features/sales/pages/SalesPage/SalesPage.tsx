import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useDebounced } from "@/hooks/useDebounced";
import { problemMessage, useAuthState } from "@/features/authentication";
import { invoiceSettingsApi } from "@/features/invoice-settings";
import { InvoiceDialog } from "../../components/InvoiceDialog/InvoiceDialog";
import { ReturnDialog } from "../../components/ReturnDialog/ReturnDialog";
import { ReturnSummary } from "../../components/ReturnSummary/ReturnSummary";
import {
  filterSales,
  inr2,
  saleDate,
  typeLabel,
  canReturnSale,
  type SaleRow,
  type SaleStats,
} from "../../model";
import { useCreateReturnMutation, useListSalesQuery, useReadSaleQuery } from "../../sales.api";

export function SalesPage() {
  const { session } = useAuthState();
  const canReturn = canReturnSale(session?.account.pharmacyRole, session?.account.permissions);
  const params = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const needle = useDebounced(query.trim());
  const list = useListSalesQuery({ page, size: 25, q: needle || undefined });
  const salesCache = useRef<SaleRow[]>([]);
  const statsCache = useRef<SaleStats | undefined>(undefined);
  if (list.data?.sales) salesCache.current = list.data.sales;
  if (list.data?.stats) statsCache.current = list.data.stats;
  const [opened, setOpened] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedId = params.id ?? opened;
  const detail = useReadSaleQuery(selectedId ?? "", { skip: !selectedId });
  const settings = invoiceSettingsApi.useReadInvoiceSettingsQuery(undefined, { skip: !selectedId });
  const [createReturn, returnState] = useCreateReturnMutation();
  const listed = list.data?.sales ?? salesCache.current;
  const rows = filterSales(listed, query);
  const stats = list.data?.stats ?? statsCache.current;
  const loaded = detail.data?.sale;
  const sale = selectedId && loaded?.id === selectedId ? loaded : null;

  function close() {
    setReturning(false);
    setError(null);
    setOpened(null);
    if (params.id) navigate("/sales");
  }

  if (list.isLoading && !list.data && salesCache.current.length === 0) {
    return <Text className="text-[13.5px] text-muted">Loading sales</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Stack direction="row" align="end" justify="between" wrap className="mb-4 gap-3">
        <Box>
          <Heading level={2}>Billed invoices</Heading>
          <Text className="text-[13px] text-muted">Every sale, day one to date</Text>
        </Box>
        <Input
          aria-label="Search sales"
          placeholder="Search invoice or patient…"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          className="max-w-[260px]"
        />
      </Stack>
      {stats ? (
        <Box className="mb-4 grid gap-3 md:grid-cols-3">
          <Stat
            label="Sales this month"
            value={inr2(stats.salesThisMonth)}
            hint={`${stats.saleCount} invoices`}
          />
          <Stat
            label="Returns this month"
            value={inr2(stats.returnsThisMonth)}
            hint={`${stats.returnCount} returns`}
          />
          <Stat
            label="Net this month"
            value={inr2(stats.netThisMonth)}
            hint="Sales minus returns"
          />
        </Box>
      ) : null}
      <Box className="overflow-hidden rounded-md border border-line bg-paper">
        <table className="w-full border-separate border-spacing-0 text-[13.5px]">
          <thead>
            <tr>
              {["Type", "Invoice no.", "Patient", "Date", "Items", "Amount"].map((heading) => (
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="border-t border-line px-3 py-6 text-center text-muted">
                  <Text className="text-[13px] text-muted">
                    {query.trim() ? "No sales match your search." : "No sales yet."}
                  </Text>
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="border-t border-line px-3 py-2">{typeLabel(row.type)}</td>
                <td className="border-t border-line px-3 py-2">
                  <Button type="button" variant="link" onClick={() => setOpened(row.id)}>
                    {row.invoiceNumber}
                  </Button>
                </td>
                <td className="border-t border-line px-3 py-2">{row.patientName}</td>
                <td className="border-t border-line px-3 py-2">{saleDate(row.recordedAt)}</td>
                <td className="border-t border-line px-3 py-2">{row.items}</td>
                <td className="border-t border-line px-3 py-2 font-bold">{inr2(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <PageBar
          page={list.data?.page ?? page}
          size={list.data?.size ?? 25}
          total={list.data?.total ?? listed.length}
          onPage={setPage}
        />
      </Box>
      {sale?.type === "sale" && !returning ? (
        <InvoiceDialog
          sale={sale}
          settings={settings.data}
          canReturn={canReturn}
          onClose={close}
          onReturn={() => {
            setError(null);
            setReturning(true);
          }}
        />
      ) : null}
      {sale?.type === "sale" && returning ? (
        <ReturnDialog
          sale={sale}
          saving={returnState.isLoading}
          error={error}
          onClose={() => {
            setError(null);
            setReturning(false);
          }}
          onReturn={async (lines) => {
            setError(null);
            const result = await createReturn({ id: sale.invoiceNumber, body: { lines } });
            if ("error" in result)
              setError(problemMessage(result.error, "Could not save this return"));
            else close();
          }}
        />
      ) : null}
      {sale?.type === "return" ? <ReturnSummary sale={sale} onClose={close} /> : null}
    </Box>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Box className="rounded-md border border-line bg-paper p-4">
      <Text className="text-[11px] font-bold text-muted uppercase">{label}</Text>
      <Text className="text-[22px] font-bold text-dark">{value}</Text>
      <Text className="text-[12px] text-muted">{hint}</Text>
    </Box>
  );
}
