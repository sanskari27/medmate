import { Box } from "@/components/atoms/Box";
import { Pill } from "@/components/atoms/Pill";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/atoms";
import { Text } from "@/components/atoms/Text";
import { fmtDateTime, inr, PAY_LABEL, SALE_SOURCES, saleSourceOf, type Sale } from "@/utils";
import { doctorLabel, salePayable, sourceTone } from "../../SalesRegister.utils";
import type { RegisterTableProps } from "./RegisterTable.types";

const headCell =
  "sticky top-0 z-[1] bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase";
const bodyCell = "px-3.5 py-[11px] align-middle text-[13px] text-ink-2";

export function RegisterTable({ rows, revenue }: RegisterTableProps) {
  function renderRow(sale: Sale) {
    return <RegisterRow key={sale.id} sale={sale} />;
  }
  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className={headCell}>Invoice</TableHeaderCell>
              <TableHeaderCell className={headCell}>Date</TableHeaderCell>
              <TableHeaderCell className={headCell}>Source</TableHeaderCell>
              <TableHeaderCell className={headCell}>Patient / Customer</TableHeaderCell>
              <TableHeaderCell className={headCell}>Ward</TableHeaderCell>
              <TableHeaderCell className={headCell}>Payment</TableHeaderCell>
              <TableHeaderCell className={headCell}>Status</TableHeaderCell>
              <TableHeaderCell align="right" className={headCell}>
                Amount
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(renderRow)}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className={bodyCell}>
                  <Text variant="muted" className="px-5 py-9 text-center">
                    No sales match these filters.
                  </Text>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="right" className={`${bodyCell} border-t-2 border-line-2 bg-wash-2 font-bold`}>
                  Total
                </TableCell>
                <TableCell align="right" className={`${bodyCell} border-t-2 border-line-2 bg-wash-2 font-extrabold text-ink`}>
                  {revenue}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
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
    <TableRow>
      <TableCell className={`${bodyCell} font-mono font-bold text-ink`}>{sale.id}</TableCell>
      <TableCell className={`${bodyCell} whitespace-nowrap`}>{fmtDateTime(sale.createdAt)}</TableCell>
      <TableCell className={bodyCell}>
        <Pill tone={sourceTone(source)}>{short}</Pill>
      </TableCell>
      <TableCell className={bodyCell}>
        {sale.customer.name}
        {sale.customer.doctor ? (
          <Text variant="caption" className="text-[11px]">
            Dr. {doctorLabel(sale.customer.doctor)}
          </Text>
        ) : null}
      </TableCell>
      <TableCell className={bodyCell}>{sale.ward ?? "—"}</TableCell>
      <TableCell className={bodyCell}>
        {PAY_LABEL[sale.payMode]}
        {sale.insurer ? (
          <Text variant="caption" className="text-[11px]">
            {sale.insurer}
          </Text>
        ) : null}
      </TableCell>
      <TableCell className={bodyCell}>
        <Pill tone={sale.paid === false ? "rose" : "green"}>{sale.paid === false ? "Unpaid" : "Paid"}</Pill>
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-extrabold text-ink`}>
        {inr(salePayable(sale))}
      </TableCell>
    </TableRow>
  );
}
