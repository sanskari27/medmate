import type { AccountsProps } from "./Accounts.types";
import {
  Box,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import { inr, inr2, PAY_LABEL, PayMode, purchaseTotals } from "@/utils";
export function Accounts(p: AccountsProps) {
  const {
    revenue,
    taxable,
    cogs,
    grossProfit,
    margin,
    discounts,
    outputGst,
    inputGst,
    netGst,
    purchaseTotal,
    payMap,
    receivables,
    enriched,
    winPurchases,
    profile,
  } = p;
  // GST slab breakup (output)
  const slabMap = new Map<
    number,
    {
      taxable: number;
      tax: number;
    }
  >();
  enriched.forEach((r: any) =>
    r.t.lines.forEach((l: any) => {
      const cur = slabMap.get(l.gst) ?? { taxable: 0, tax: 0 };
      slabMap.set(l.gst, { taxable: cur.taxable + l.taxable, tax: cur.tax + l.cgst + l.sgst });
    }),
  );
  const slabs = [...slabMap.entries()].sort((a, b) => a[0] - b[0]);
  // day book — net sales & purchases per day
  const dayMap = new Map<
    string,
    {
      sales: number;
      purch: number;
    }
  >();
  enriched.forEach((r: any) => {
    const k = new Date(r.s.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    const c = dayMap.get(k) ?? { sales: 0, purch: 0 };
    c.sales += r.t.payable;
    dayMap.set(k, c);
  });
  winPurchases.forEach((pu: any) => {
    const k = new Date(pu.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    const c = dayMap.get(k) ?? { sales: 0, purch: 0 };
    c.purch += purchaseTotals(pu.items).total;
    dayMap.set(k, c);
  });
  const days = [...dayMap.entries()];
  return (
    <>
      <Box className={cn("!grid !grid-cols-2 !gap-4 max-[767px]:!grid-cols-1", "!mb-4")}>
        {/* P&L */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Profit & Loss</Heading>
            <Text className="text-[12.5px] text-muted" as="span">
              {profile.name}
            </Text>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">
              Income
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                Gross sales (incl. GST)
              </Text>
              <Text className="font-bold tabular-nums" as="span">
                {inr(revenue + discounts)}
              </Text>
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0 text-[12.5px] text-muted">
              <Text className="pl-4 text-[12.5px] font-medium text-muted" as="span">
                less: discounts given
              </Text>
              <Text className="font-semibold tabular-nums text-ink-2 text-rose" as="span">
                − {inr(discounts)}
              </Text>
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0 text-[12.5px] text-muted">
              <Text className="pl-4 text-[12.5px] font-medium text-muted" as="span">
                less: output GST
              </Text>
              <Text className="font-semibold tabular-nums text-ink-2 text-rose" as="span">
                − {inr(outputGst)}
              </Text>
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                Net sales (taxable)
              </Text>
              <Text className="font-bold tabular-nums" as="span">
                {inr(taxable)}
              </Text>
            </Box>
            <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">
              Cost of goods
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                COGS (at purchase cost)
              </Text>
              <Text className="font-bold tabular-nums text-rose" as="span">
                − {inr(cogs)}
              </Text>
            </Box>
            <Box className="mt-1 flex items-baseline justify-between border-t-2 border-line-2 pt-3 font-display text-base font-extrabold text-dark">
              <Text className="text-ink-2" as="span">
                Gross profit
              </Text>
              <Text className="font-extrabold tabular-nums text-green" as="span">
                {inr(grossProfit)}{" "}
                <Text className={cn("!text-[12px] !font-bold !text-muted")} as="span">
                  · {margin.toFixed(1)}%
                </Text>
              </Text>
            </Box>
          </Box>
        </Box>

        {/* GST liability */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>GST liability</Heading>
            <Text className="text-[12.5px] text-muted" as="span">
              {profile.gstin}
            </Text>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">
              Output tax (on sales)
            </Box>
            {slabs.length === 0 && (
              <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
                <Text className="text-ink-2 !text-muted" as="span">
                  No taxable sales
                </Text>
                <Text className="font-bold tabular-nums" as="span">
                  —
                </Text>
              </Box>
            )}
            {slabs.map(renderSlab)}
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                Total output GST
              </Text>
              <Text className="font-bold tabular-nums" as="span">
                {inr(outputGst)}
              </Text>
            </Box>
            <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">
              Input tax credit (on purchases)
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                Input GST (GSTR-2)
              </Text>
              <Text className="font-bold tabular-nums text-rose" as="span">
                − {inr(inputGst)}
              </Text>
            </Box>
            <Box className="mt-1 flex items-baseline justify-between border-t-2 border-line-2 pt-3 font-display text-base font-extrabold text-dark">
              <Text className="text-ink-2" as="span">
                {netGst >= 0 ? "Net GST payable" : "Net GST credit (carried fwd)"}
              </Text>
              <Text
                className={`font-extrabold tabular-nums ${netGst >= 0 ? "text-rose" : "text-green"}`}
                as="span"
              >
                {inr(Math.abs(netGst))}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className={cn("!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1", "!mb-4")}>
        {/* collections + receivables */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Cash & collections</Heading>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            {(["cash", "upi", "card", "cod"] as PayMode[]).map(renderM)}
            <Box
              className={cn(
                "!flex !items-center !gap-2.5",
                "!justify-between !mt-3.5 !pt-3 !border-t !border-line-2 !border-dashed",
              )}
            >
              <Text className={cn("!text-muted", "!text-[13px]")} as="span">
                COD receivable (in transit)
              </Text>
              <Text as="span" className={cn("font-bold", "!font-display !text-[16px] !text-amber")}>
                {inr(receivables)}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* purchases summary */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Purchases (inward)</Heading>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                Goods purchased (incl. GST)
              </Text>
              <Text className="font-bold tabular-nums" as="span">
                {inr(purchaseTotal)}
              </Text>
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                Input GST credit
              </Text>
              <Text className="font-bold tabular-nums" as="span">
                {inr(inputGst)}
              </Text>
            </Box>
            <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
              <Text className="text-ink-2" as="span">
                GRNs entered
              </Text>
              <Text className="font-bold tabular-nums" as="span">
                {winPurchases.length}
              </Text>
            </Box>
            <Box className="mt-1 flex items-baseline justify-between border-t-2 border-line-2 pt-3 font-display text-base font-extrabold text-dark">
              <Text className="text-ink-2" as="span">
                Net stock investment
              </Text>
              <Text className="font-extrabold tabular-nums" as="span">
                {inr(purchaseTotal - inputGst)}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* day book */}
      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
          <Heading level={3}>Day book</Heading>
          <Text className="text-[12.5px] text-muted" as="span">
            net sales vs purchases
          </Text>
        </Box>
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:text-ink-2 [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0 [&_tfoot_td]:!border-b-0 [&_tfoot_td]:!border-t-2 [&_tfoot_td]:!border-t-line-2 [&_tfoot_td]:!bg-wash-2 [&_tfoot_td]:!font-extrabold [&_tfoot_td]:!text-ink">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Day</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                  Net sales
                </TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                  Purchases
                </TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                  Net cash flow
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {days.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Box
                      className={cn(
                        "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
                        "!p-5",
                      )}
                    >
                      <Text>No activity in this period.</Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {days.map(renderDay)}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </>
  );
  function renderSlab([gst, v]: [
    number,
    {
      taxable: number;
      tax: number;
    },
  ]) {
    return (
      <Box
        className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0 text-[12.5px] text-muted"
        key={gst}
      >
        <Text className="pl-4 text-[12.5px] font-medium text-muted" as="span">
          GST {gst}% · CGST {gst / 2} + SGST {gst / 2}
        </Text>
        <Text className="font-semibold tabular-nums text-ink-2" as="span">
          {inr2(v.tax)}
        </Text>
      </Box>
    );
  }
  function renderM(m: PayMode) {
    const v = payMap.get(m) ?? 0;
    const pct = revenue ? (v / revenue) * 100 : 0;
    return (
      <Box
        className="flex items-center gap-2.5 border-b border-line py-[9px] text-[13px] last:border-b-0"
        key={m}
      >
        <Text className="!flex-1 !text-[13px] !text-ink" as="span">
          {PAY_LABEL[m]}
        </Text>
        <Box
          className="h-2 w-[120px] overflow-hidden rounded-[5px] bg-wash"
          aria-label={PAY_LABEL[m]}
        >
          <Box
            className="h-full rounded-[5px] bg-[linear-gradient(90deg,var(--color-light),var(--color-mid))]"
            style={{ width: `${pct}%` }}
          />
        </Box>
        <Text as="span" className="!min-w-20 !text-right !text-[13px] !font-bold">
          {inr(v)}
        </Text>
      </Box>
    );
  }
  function renderDay([k, v]: [
    string,
    {
      sales: number;
      purch: number;
    },
  ]) {
    return (
      <TableRow key={k}>
        <TableCell className={cn("!font-semibold")}>{k}</TableCell>
        <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">
          {inr(v.sales)}
        </TableCell>
        <TableCell className="!text-right !tabular-nums !font-semibold !text-ink !text-muted">
          {v.purch ? inr(v.purch) : "—"}
        </TableCell>
        <TableCell
          className={cn(
            "!text-right !tabular-nums !font-semibold !text-ink",
            "!font-bold",
            v.sales - v.purch >= 0 ? "!text-green" : "!text-rose",
          )}
        >
          {inr(v.sales - v.purch)}
        </TableCell>
      </TableRow>
    );
  }
}
