import {
  Box,
  Button,
  Heading,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useMemo, useState } from "react";
import { useAppSelector, useConfirmedDispatch, usePharmacyNav } from "@/hooks";
import { addExpense } from "@/store/thunks/purchases.thunk";
import { inr, Expense, PayMode, PAY_LABEL, fmtDateTime, expenseTax } from "@/utils";
import {
  IconPlus,
  IconSearch,
  IconReports,
  IconPrint,
  IconX,
  IconReceipt,
  IconDownload,
} from "@/components/atoms";
import { useDateRange } from "@/components/molecules";
import { exportCatalogCsv, exportCatalogPdf } from "@/utils/calculations/reportExport";
import { runReport } from "@/utils/calculations/reportCatalog";
import { expenseDate } from "./Expenses.utils";
export default function ExpensesScreen() {
  const confirm = useConfirmedDispatch();
  const { openReport } = usePharmacyNav();
  const expenses = useAppSelector((state) => state.purchases.expenses);
  const expenseCategories = useAppSelector((state) => state.purchases.expenseCategories);
  const profile = useAppSelector((state) => state.auth.profile);
  const now = useAppSelector((state) => state.ui.now);
  async function saveExpense(expense: Parameters<typeof addExpense>[0]) {
    const result = await confirm(addExpense(expense));
    return "fault" in result ? result.fault : null;
  }
  const period = useDateRange(now, "last-365");
  const [searchQuery, setSearchQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [showRep, setShowRep] = useState(false);
  const [creating, setCreating] = useState(false);
  const rows = useMemo(
    () =>
      expenses
        .filter((e) => period.inWindow(e.date))
        .filter((e) => cat === "all" || e.category === cat)
        .filter(
          (expense) =>
            !searchQuery.trim() ||
            `${expense.number} ${expense.party} ${expense.category} ${expense.note ?? ""}`
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
        )
        .sort((left, right) => right.date - left.date),
    [expenses, period, cat, searchQuery],
  );
  const total = rows.reduce((sum, expense) => sum + expense.amount, 0);
  const gstTotal = rows.reduce((sum, expense) => sum + expenseTax(expense), 0);
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        {period.node}
        <Select
          value={cat}
          onChange={setCatOnChange}
          className={cn("", "!w-[200px]")}
          options={[
            { value: "all", label: "All expense categories" },
            ...expenseCategories.map(renderExpenseCategory),
          ]}
        />
        <Box className="!flex !h-10 !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!h-auto [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!py-0 [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={17} />
          </Text>
          <Input
            placeholder="Search expense, party…"
            value={searchQuery}
            onChange={setSearchQueryOnChange}
          />
        </Box>
        <Box className="!flex-1" />
        <Box className={cn("!relative")}>
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
            onClick={setShowRepOnClick}
          >
            <IconReports size={16} /> Reports ▾
          </Button>
          {showRep && (
            <Box
              className={cn(
                "!rounded-md !border !border-line !bg-paper !p-1.5 !shadow-pop",
                "!absolute !right-0 !top-[110%] !z-[20] !min-w-[210px]",
              )}
            >
              <Button
                className="!flex !h-auto !w-full !items-center !rounded-sm !border-0 !bg-transparent !px-3 !py-[9px] !text-left !text-[13.5px] !font-normal !text-ink !shadow-none hover:!bg-wash-2 hover:!text-green"
                onClick={setShowRepOnClick2}
              >
                Expense Transactions
              </Button>
              <Button
                className="!flex !h-auto !w-full !items-center !rounded-sm !border-0 !bg-transparent !px-3 !py-[9px] !text-left !text-[13.5px] !font-normal !text-ink !shadow-none hover:!bg-wash-2 hover:!text-green"
                onClick={setShowRepOnClick3}
              >
                Expense Category
              </Button>
            </Box>
          )}
        </Box>
        <Button
          className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
          onClick={setCreatingOnClick}
        >
          <IconPlus size={16} /> Create Expense
        </Button>
      </Box>

      <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2.5", "!mb-4")}>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Expenses
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {rows.length}
          </Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Total spend
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {inr(total)}
          </Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          GST (ITC eligible)
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {inr(gstTotal)}
          </Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Period
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {period.label}
          </Text>
        </Box>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:text-ink-2 [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0 [&_tfoot_td]:!border-b-0 [&_tfoot_td]:!border-t-2 [&_tfoot_td]:!border-t-line-2 [&_tfoot_td]:!bg-wash-2 [&_tfoot_td]:!font-extrabold [&_tfoot_td]:!text-ink">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Expense No.</TableHeaderCell>
                <TableHeaderCell>Party Name</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Payment</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                  Amount
                </TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(renderRow)}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconReceipt size={28} />
                      </Box>
                      <Text>No expenses match the current filter.</Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {rows.length > 0 && (
              <tfoot>
                <TableRow>
                  <TableCell colSpan={5}>Total · {rows.length} expenses</TableCell>
                  <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">
                    {inr(total)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </tfoot>
            )}
          </Table>
        </Box>
      </Box>

      {rows.length > 0 && (
        <Box className={cn("!flex !items-center !gap-2.5 print:hidden", "!mt-3.5 !gap-2")}>
          <Text className={cn("!text-muted", "!flex-1 !text-[12.5px]")} as="span">
            Download the filtered expense register
          </Text>
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
            onClick={downloadRegisterOnClick}
          >
            <IconDownload size={14} /> Excel
          </Button>
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
            onClick={downloadRegisterOnClick2}
          >
            <IconPrint size={15} /> PDF
          </Button>
        </Box>
      )}

      {creating && (
        <CreateExpense
          onClose={setCreatingOnClose}
          categories={expenseCategories}
          addExpense={saveExpense}
          now={now}
        />
      )}
    </Box>
  );
  function setCatOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setCat(e.target.value);
  }
  function renderExpenseCategory(c: string) {
    return { value: String(c), label: String(c) };
  }
  function setSearchQueryOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setSearchQuery(e.target.value);
  }
  function setShowRepOnClick() {
    return setShowRep((v) => !v);
  }
  function setShowRepOnClick2() {
    setShowRep(false);
    openReport("expense-transaction");
  }
  function setShowRepOnClick3() {
    setShowRep(false);
    openReport("expense-category");
  }
  function setCreatingOnClick() {
    return setCreating(true);
  }
  function renderRow(e: Expense) {
    return (
      <TableRow key={e.id}>
        <TableCell className={cn("!whitespace-nowrap")}>{fmtDateTime(e.date)}</TableCell>
        <TableCell className={cn("!font-mono", "!font-bold")}>{e.number}</TableCell>
        <TableCell>{e.party}</TableCell>
        <TableCell>
          <Text
            className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted"
            as="span"
          >
            {e.category}
          </Text>
        </TableCell>
        <TableCell>{PAY_LABEL[e.paymentMode]}</TableCell>
        <TableCell
          className={cn("!text-right !tabular-nums !font-semibold !text-ink", "!font-extrabold")}
        >
          {inr(e.amount)}
        </TableCell>
        <TableCell className="!text-right !tabular-nums !font-semibold !text-ink" />
      </TableRow>
    );
  }
  function downloadRegisterOnClick() {
    return downloadRegister(rows, profile, period, now, "csv");
  }
  function downloadRegisterOnClick2() {
    return downloadRegister(rows, profile, period, now, "pdf");
  }
  function setCreatingOnClose() {
    return setCreating(false);
  }
}
// shared with the catalog so the register matches the Expense Transactions report
function downloadRegister(
  rows: Expense[],
  profile: any,
  period: any,
  now: number,
  kind: "csv" | "pdf",
) {
  const range = { from: period.from, to: period.to, label: period.label };
  const report = runReport("expense-transaction", {
    sales: [],
    purchases: [],
    inventory: [],
    expenses: rows,
    profile,
    now,
    range,
  });
  if (kind === "csv") exportCatalogCsv("Expense Transactions", report, range, now);
  else exportCatalogPdf("Expense Transactions", report, profile, range, now);
}
function CreateExpense({
  onClose,
  categories,
  addExpense,
  now,
}: {
  onClose: () => void;
  categories: string[];
  addExpense: (e: Omit<Expense, "id" | "number">) => Promise<unknown>;
  now: number;
}) {
  const [date, setDate] = useState(expenseDate(now));
  const [party, setParty] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Miscellaneous");
  const [paymentMode, setPaymentMode] = useState<PayMode>("cash");
  const [amount, setAmount] = useState(0);
  const [gst, setGst] = useState(0);
  const [note, setNote] = useState("");
  const [custom, setCustom] = useState("");
  const save = async () => {
    if (amount <= 0 || !party.trim()) return;
    const [y, m, d] = date.split("-").map(Number);
    const err = await addExpense({
      date: new Date(y, m - 1, d, 12).getTime(),
      party: party.trim(),
      category: custom.trim() || category,
      paymentMode,
      amount,
      gst,
      note: note.trim() || undefined,
    });
    if (!err) onClose();
  };
  return (
    <Box
      className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px] max-[767px]:!items-end max-[767px]:!p-0"
      onClick={onClose}
    >
      <Box
        onClick={stopPropagationOnClick}
        className={cn(
          "!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop max-[767px]:!max-h-[92dvh] max-[767px]:!max-w-none max-[767px]:!rounded-t-2xl max-[767px]:!rounded-b-none",
          "!max-w-[480px]",
        )}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Create Expense</Heading>
          <Button
            className="!rounded-[7px] !border-0 !bg-transparent !px-[7px] !py-1 !text-[13px] !text-faint !shadow-none hover:!bg-rose-bg hover:!text-rose"
            onClick={onClose}
          >
            <IconX size={16} />
          </Button>
        </Box>
        <Box className={cn("!overflow-y-auto !p-5", "!grid !gap-[13px]")}>
          <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Date</Label>
              <Input
                className=""
                type="date"
                value={date}
                max={expenseDate(now)}
                onChange={setDateOnChange}
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Paid to (party)</Label>
              <Input
                className=""
                value={party}
                onChange={setPartyOnChange}
                placeholder="Landlord, staff, vendor…"
              />
            </Box>
          </Box>
          <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Category</Label>
              <Select
                className=""
                value={category}
                onChange={setCategoryOnChange}
                options={[...categories.map(renderCategory)]}
              />
              <Input
                value={custom}
                onChange={setCustomOnChange}
                placeholder="Or a new category"
                className={cn("", "!mt-1.5")}
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Payment mode</Label>
              <Select
                className=""
                value={paymentMode}
                onChange={setPaymentModeOnChange}
                options={[...(["cash", "upi", "card", "cod"] as PayMode[]).map(renderM)]}
              />
            </Box>
          </Box>
          <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
            <Box
              className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2"
              data-field="amount"
            >
              <Label>Amount ₹ (incl. GST)</Label>
              <Input
                className=""
                inputMode="numeric"
                value={amount || ""}
                onChange={setAmountOnChange}
                placeholder="0"
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>GST %</Label>
              <Select
                className=""
                value={gst}
                onChange={setGstOnChange}
                options={[...[0, 5, 12, 18, 28].map(renderG)]}
              />
            </Box>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Note (optional)</Label>
            <Input
              className=""
              value={note}
              onChange={setNoteOnChange}
              placeholder="What was this for?"
            />
          </Box>
          {gst > 0 && amount > 0 && (
            <Text className={cn("!text-muted", "!text-[12px]")}>
              Taxable {inr(amount / (1 + gst / 100))} · GST {inr(amount - amount / (1 + gst / 100))}{" "}
              (input credit)
            </Text>
          )}
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5 max-[767px]:!flex-wrap max-[767px]:[&_button]:!flex-1">
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
            disabled={amount <= 0 || !party.trim()}
            onClick={save}
          >
            <IconPlus size={15} /> Save expense
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function setDateOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setDate(e.target.value);
  }
  function setPartyOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setParty(e.target.value);
  }
  function setCategoryOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setCategory(e.target.value);
  }
  function renderCategory(c: string) {
    return { value: String(c), label: String(c) };
  }
  function setCustomOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setCustom(e.target.value);
  }
  function setPaymentModeOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setPaymentMode(e.target.value as PayMode);
  }
  function renderM(m: PayMode) {
    return { value: String(m), label: String(PAY_LABEL[m]) };
  }
  function setAmountOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setAmount(Number(e.target.value) || 0);
  }
  function setGstOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setGst(Number(e.target.value));
  }
  function renderG(g: number) {
    return { value: String(g), label: String(g) + "%" };
  }
  function setNoteOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setNote(e.target.value);
  }
}
