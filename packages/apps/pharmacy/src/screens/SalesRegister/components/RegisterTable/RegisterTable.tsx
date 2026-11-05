import { Box } from "@/components/atoms/Box";
import { Pill } from "@/components/atoms/Pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/atoms";
import { Text } from "@/components/atoms/Text";
import { fmtDateTime, inr, PAY_LABEL, SALE_SOURCES, saleSourceOf, type Sale } from "@/utils";
import { cn } from "@/utils/className";
import { doctorLabel, salePayable, sourceTone } from "../../SalesRegister.utils";
import type { RegisterTableProps } from "./RegisterTable.types";

const headCell =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase";
const bodyCell = "border-b border-line px-3.5 py-[11px] align-middle text-[13px] text-ink-2";
const footCell =
  "border-t-2 border-b-0 border-line-2 bg-wash-2 px-3.5 py-[11px] align-middle text-[13px] text-ink-2";

export function RegisterTable({ rows, revenue }: RegisterTableProps) {
  function renderRow(sale: Sale) {
    return <RegisterRow key={sale.id} sale={sale} />;
  }
  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="overflow-x-auto">
        <Table className="border-separate border-spacing-0 [&_tr:last-child_td]:border-b-0">
          <TableHead>
            <TableRow className="border-b-0">
              <TableHeaderCell className={headCell}>Invoice</TableHeaderCell>
              <TableHeaderCell className={headCell}>Date</TableHeaderCell>
              <TableHeaderCell className={headCell}>Source</TableHeaderCell>
              <TableHeaderCell className={headCell}>Patient / Customer</TableHeaderCell>
              <TableHeaderCell className={headCell}>Ward</TableHeaderCell>
              <TableHeaderCell className={headCell}>Payment</TableHeaderCell>
              <TableHeaderCell className={headCell}>Status</TableHeaderCell>
              <TableHeaderCell
                align="right"
                className={cn(headCell, "text-right font-semibold text-ink")}
              >
                Amount
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(renderRow)}
            {rows.length === 0 ? (
              <TableRow className="border-b-0">
                <TableCell colSpan={8} className={bodyCell}>
                  <Box className="px-5 py-9 text-center text-[14px] leading-[1.5] text-muted">
                    No sales match these filters.
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
          {rows.length > 0 ? (
            <tfoot>
              <TableRow className="border-b-0">
                <TableCell
                  colSpan={7}
                  align="right"
                  className={cn(footCell, "text-right font-bold")}
                >
                  Total
                </TableCell>
                <TableCell
                  align="right"
                  className={cn(footCell, "text-right font-extrabold text-ink tabular-nums")}
                >
                  {revenue}
                </TableCell>
              </TableRow>
            </tfoot>
          ) : null}
        </Table>
      </Box>
    </Box>
  );
}

function RegisterRow({ sale }: { sale: Sale }) {
  const source = saleSourceOf(sale);
  const short = SALE_SOURCES.find(function named(item) {
    return item.key === source;
  })!.short;
  return (
    <TableRow className="border-b-0 transition-colors duration-100 hover:bg-wash-2">
      <TableCell className={`${bodyCell} font-mono font-bold`}>{sale.id}</TableCell>
      <TableCell className={`${bodyCell} whitespace-nowrap`}>
        {fmtDateTime(sale.createdAt)}
      </TableCell>
      <TableCell className={bodyCell}>
        <Pill tone={sourceTone(source)} className="gap-[5px]">
          {short}
        </Pill>
      </TableCell>
      <TableCell className={bodyCell}>
        {sale.customer.name}
        {sale.customer.doctor ? (
          <Text variant="caption" className="text-[11px] leading-[1.5]">
            Dr. {doctorLabel(sale.customer.doctor)}
          </Text>
        ) : null}
      </TableCell>
      <TableCell className={bodyCell}>{sale.ward ?? "—"}</TableCell>
      <TableCell className={bodyCell}>
        {PAY_LABEL[sale.payMode]}
        {sale.insurer ? (
          <Text variant="caption" className="text-[11px] leading-[1.5]">
            {sale.insurer}
          </Text>
        ) : null}
      </TableCell>
      <TableCell className={bodyCell}>
        <Pill tone={sale.paid === false ? "rose" : "green"} className="gap-[5px]">
          {sale.paid === false ? "Unpaid" : "Paid"}
        </Pill>
      </TableCell>
      <TableCell
        align="right"
        className={`${bodyCell} text-right font-extrabold text-ink tabular-nums`}
      >
        {inr(salePayable(sale))}
      </TableCell>
    </TableRow>
  );
}
