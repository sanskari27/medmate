import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconPlus } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { useDebounced } from "@/hooks/useDebounced";
import { ExpenseDialog } from "../../components/ExpenseDialog";
import {
  EXPENSE_PRESETS,
  canCreateExpense,
  downloadFile,
  expenseCsv,
  expenseDate,
  expensePdf,
  expenseRange,
  inr,
  kolkataDate,
  payLabel,
  type ExpensePreset,
  type ExpenseRow,
} from "../../model";
import {
  useCreateExpenseMutation,
  useLazyExportExpensesQuery,
  useListExpensesQuery,
} from "../../expenses.api";

const selectClass =
  "h-10 rounded-sm border border-line-2 bg-paper px-3 text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

export function ExpensesPage() {
  const { session } = useAuthState();
  const canCreate = canCreateExpense(session?.account.pharmacyRole, session?.account.permissions);
  const today = kolkataDate(new Date());
  const [preset, setPreset] = useState<ExpensePreset>("last-365");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needle = useDebounced(query.trim());
  const range = expenseRange(preset, today, customFrom, customTo);
  const list = useListExpensesQuery({
    page,
    size: 25,
    from: range.from,
    to: range.to,
    category,
    q: needle || undefined,
  });
  const [exportExpenses] = useLazyExportExpensesQuery();
  const [createExpense, createState] = useCreateExpenseMutation();
  const summary = list.data?.summary;
  const rows = list.data?.expenses ?? [];
  const categories = list.data?.categories ?? [];

  function choosePreset(next: ExpensePreset) {
    setPreset(next);
    setMenuOpen(false);
    setPage(1);
  }

  async function download(kind: "csv" | "pdf") {
    const result = await exportExpenses({
      from: range.from,
      to: range.to,
      category,
      q: needle || undefined,
    });
    if ("error" in result || !result.data) {
      setError(
        problemMessage("error" in result ? result.error : null, "Could not download expenses"),
      );
      return;
    }
    const file = result.data.expenses;
    if (kind === "csv") downloadFile("expenses.csv", expenseCsv(file), "text/csv");
    else downloadFile("expenses.pdf", expensePdf(file), "application/pdf");
  }

  if (list.isLoading && !list.data) {
    return <Text className="text-[13.5px] text-muted">Loading expenses</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-4 flex flex-wrap items-center gap-2.5">
        <Box className="relative">
          <Button
            type="button"
            variant="ghost"
            aria-label="Date range"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {range.label}
          </Button>
          {menuOpen ? (
            <Box className="absolute top-[calc(100%+6px)] left-0 z-40 max-h-[340px] min-w-[300px] overflow-y-auto rounded-md border border-line bg-paper p-1.5 shadow-pop">
              {EXPENSE_PRESETS.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start"
                  onClick={() => choosePreset(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          ) : null}
        </Box>
        {preset === "custom" ? (
          <>
            <Input
              aria-label="From"
              type="date"
              value={customFrom || range.from}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setCustomFrom(event.target.value);
                setPage(1);
              }}
              className="w-[160px]"
            />
            <Input
              aria-label="To"
              type="date"
              value={customTo || range.to}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setCustomTo(event.target.value);
                setPage(1);
              }}
              className="w-[160px]"
            />
          </>
        ) : null}
        <select
          aria-label="Expense category"
          className={selectClass}
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All expense categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Box className="flex h-10 max-w-[360px] min-w-[240px] flex-1 items-center">
          <Input
            aria-label="Search expenses"
            placeholder="Search expense, party…"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </Box>
        <Box className="flex-1" />
        {canCreate ? (
          <Button type="button" onClick={() => setCreating(true)}>
            <IconPlus size={16} /> Create Expense
          </Button>
        ) : null}
      </Box>
      <Box className="mb-4 flex flex-wrap gap-2.5">
        <Card label="Expenses" value={String(summary?.count ?? 0)} />
        <Card label="Total spend" value={inr(summary?.total ?? "0.00")} />
        <Card label="GST (ITC eligible)" value={inr(summary?.gst ?? "0.00")} />
        <Card label="Period" value={range.label} />
      </Box>
      {list.isError ? (
        <Text className="mb-3 text-[13px] text-rose">
          {problemMessage(list.error, "Could not load expenses")}
        </Text>
      ) : null}
      <Box className="overflow-hidden rounded-md border border-line bg-paper">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              {["Date", "Expense No.", "Party Name", "Category", "Payment", "Amount"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
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
                <td colSpan={6} className="px-5 py-9 text-center text-muted">
                  <Text>No expenses match the current filter.</Text>
                </td>
              </tr>
            ) : (
              rows.map((row) => <ExpenseLine key={row.number} row={row} />)
            )}
          </tbody>
          {(summary?.count ?? 0) > 0 ? (
            <tfoot>
              <tr>
                <td
                  colSpan={5}
                  className="border-t-2 border-t-line-2 bg-wash-2 px-3.5 py-[11px] font-extrabold"
                >
                  Total · {summary?.count} expenses
                </td>
                <td className="border-t-2 border-t-line-2 bg-wash-2 px-3.5 py-[11px] text-right font-extrabold">
                  {inr(summary?.total ?? "0.00")}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
        <PageBar
          page={list.data?.page ?? page}
          size={list.data?.size ?? 25}
          total={list.data?.total ?? 0}
          onPage={setPage}
        />
      </Box>
      {(summary?.count ?? 0) > 0 ? (
        <Stack direction="row" align="center" className="mt-3.5 gap-2">
          <Text className="flex-1 text-[12.5px] text-muted">
            Download the filtered expense register
          </Text>
          <Button type="button" variant="ghost" onClick={() => void download("csv")}>
            Excel
          </Button>
          <Button type="button" variant="ghost" onClick={() => void download("pdf")}>
            PDF
          </Button>
        </Stack>
      ) : null}
      {error ? <Text className="mt-2 text-[13px] text-rose">{error}</Text> : null}
      {creating ? (
        <ExpenseDialog
          today={today}
          categories={categories}
          saving={createState.isLoading}
          error={error}
          onClose={() => {
            setError(null);
            setCreating(false);
          }}
          onSave={async (draft) => {
            setError(null);
            const result = await createExpense(draft);
            if ("error" in result)
              setError(problemMessage(result.error, "Could not record the expense"));
            else setCreating(false);
          }}
        />
      ) : null}
    </Box>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">
        {value}
      </Text>
    </Box>
  );
}

function ExpenseLine({ row }: { row: ExpenseRow }) {
  return (
    <tr>
      <td className="border-t border-line px-3.5 py-[11px] whitespace-nowrap">
        {expenseDate(row.spentOn)}
      </td>
      <td className="border-t border-line px-3.5 py-[11px] font-mono font-bold">{row.number}</td>
      <td className="border-t border-line px-3.5 py-[11px]">{row.party}</td>
      <td className="border-t border-line px-3.5 py-[11px]">
        <Text
          as="span"
          className="inline-flex rounded-full bg-gray-pill px-[9px] py-[3px] text-[11px] font-bold text-muted"
        >
          {row.category}
        </Text>
      </td>
      <td className="border-t border-line px-3.5 py-[11px]">{payLabel(row.paymentMode)}</td>
      <td className="border-t border-line px-3.5 py-[11px] text-right font-extrabold">
        {inr(row.amount)}
      </td>
    </tr>
  );
}
