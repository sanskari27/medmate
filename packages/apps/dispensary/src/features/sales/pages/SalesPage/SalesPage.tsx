import { useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { CardLine, FitText } from "@/components/ui/FitText";
import { DateFields } from "@/components/ui/DateFields";
import { FilterField } from "@/components/ui/FilterField";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useDebounced } from "@/hooks/useDebounced";
import { useRegisterQuery } from "@/hooks/useRegisterQuery";
import { problemMessage, useAuthState } from "@/features/authentication";
import { invoiceSettingsApi } from "@/features/invoice-settings";
import { InvoiceDialog } from "../../components/InvoiceDialog/InvoiceDialog";
import { ReturnDialog } from "../../components/ReturnDialog/ReturnDialog";
import { ReturnSummary } from "../../components/ReturnSummary/ReturnSummary";
import {
  inr2,
  payLabel,
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
  const register = useRegisterQuery();
  const navigate = useNavigate();
  const needle = useDebounced(register.q.trim());
  const kind = register.get("type");
  const list = useListSalesQuery({
    page: register.page,
    size: 25,
    q: needle || undefined,
    from: register.from || undefined,
    to: register.to || undefined,
    type: kind === "sale" || kind === "return" ? kind : undefined,
  });
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
  const rows = listed;
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
      <Box className="mb-4">
        <Heading level={2}>Billed invoices</Heading>
        <Text className="text-[13px] text-muted">Every sale, day one to date</Text>
      </Box>
      <Stack direction="row" align="end" wrap className="mb-4 gap-3">
        <DateFields
          from={register.from}
          to={register.to}
          onFrom={(value) => register.setQuery({ from: value })}
          onTo={(value) => register.setQuery({ to: value })}
        />
        <FilterField label="Type">
          <Select
            aria-label="Sale type"
            value={kind === "return" ? "return" : kind === "sale" ? "sale" : ""}
            onChange={(event) => register.setQuery({ type: event.target.value || null })}
            className="min-w-[140px]"
          >
            <option value="">All</option>
            <option value="sale">Sales</option>
            <option value="return">Returns</option>
          </Select>
        </FilterField>
        <FilterField label="Search" className="w-[260px]">
          <Input
            aria-label="Search sales"
            placeholder="Invoice, phone, product, batch…"
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
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13.5px]">
            <thead>
              <tr>
                {["Type", "Invoice no.", "Patient", "Phone", "Pay", "Date", "Items", "Amount"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className={`bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase ${["Items", "Amount"].includes(heading) ? "text-right" : "text-left"}`}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border-t border-line px-3 py-6 text-center text-muted">
                    <Text className="text-[13px] text-muted">
                      {register.q.trim() || register.from || register.to || kind
                        ? "No sales match your search."
                        : "No sales yet."}
                    </Text>
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-t border-line px-3.5 py-[11px]">{typeLabel(row.type)}</td>
                  <td className="border-t border-line px-3.5 py-[11px]">
                    <Button type="button" variant="link" onClick={() => setOpened(row.id)}>
                      {row.type === "return" ? row.id : row.invoiceNumber}
                    </Button>
                    {row.type === "return" ? (
                      <Text as="span" className="mt-0.5 block text-[11px] text-muted">
                        Invoice{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="text-[11px]"
                          onClick={() => setOpened(row.invoiceNumber)}
                        >
                          {row.invoiceNumber}
                        </Button>
                      </Text>
                    ) : null}
                  </td>
                  <td className="border-t border-line px-3.5 py-[11px]">{row.patientName}</td>
                  <td className="border-t border-line px-3.5 py-[11px]">
                    {row.patientPhone ? (
                      <Button variant="link" asChild>
                        <Link to={`/patients?q=${encodeURIComponent(row.patientPhone)}`}>
                          {row.patientPhone}
                        </Link>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="border-t border-line px-3.5 py-[11px]">{payLabel(row.payMode)}</td>
                  <td className="border-t border-line px-3.5 py-[11px]">{saleDate(row.recordedAt)}</td>
                  <td className="border-t border-line px-3.5 py-[11px] text-right tabular-nums">
                    {row.items}
                  </td>
                  <td className="border-t border-line px-3.5 py-[11px] text-right font-bold whitespace-nowrap tabular-nums">
                    {inr2(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <PageBar
          page={list.data?.page ?? register.page}
          size={list.data?.size ?? 25}
          total={list.data?.total ?? listed.length}
          onPage={(next) => register.setQuery({ page: next })}
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
    <Box className="min-w-0 max-w-full overflow-hidden rounded-md border border-line bg-paper p-4">
      <CardLine className="text-[11px] font-bold text-muted uppercase">{label}</CardLine>
      <FitText className="text-[22px] font-bold text-dark">{value}</FitText>
      <CardLine className="text-[12px] text-muted">{hint}</CardLine>
    </Box>
  );
}
