import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Stack } from "@/components/atoms/Stack";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/atoms";
import { Tag } from "@/components/atoms/Tag";
import { Text } from "@/components/atoms/Text";
import { IconArrowRight } from "@/components/atoms/Icon";
import { inr, unitNoun } from "@/utils";
import type { PosLine } from "@/store/slices/billing/billingSlice";
import { billingLineKey, billingLineView, type BillingLineView } from "../../Billing.utils";
import type { OrderReviewProps } from "./OrderReview.types";

type ReviewEntry = { line: PosLine; view: BillingLineView };

const headCell =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase";
const numHead =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-semibold tracking-[0.07em] whitespace-nowrap text-ink uppercase";
const bodyCell =
  "border-b border-line px-3.5 py-[11px] text-[13px] text-ink-2 [[data-slot=table-body]_tr:last-child_&]:border-b-0";

export function OrderReview(props: OrderReviewProps) {
  const rows = props.lines.flatMap(function withView(line) {
    const view = billingLineView(line, props.inventory);
    return view ? [{ line, view }] : [];
  });

  function renderRow(row: ReviewEntry) {
    return <ReviewRow key={billingLineKey(row.line)} line={row.line} view={row.view} />;
  }

  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Stack
        direction="row"
        align="center"
        justify="between"
        wrap
        className="gap-2.5 border-b border-line px-[18px] py-[15px]"
      >
        <Heading level={3} className="text-[15px] font-bold">
          Order summary{" "}
          {props.count > 0 ? (
            <Text as="span" className="text-[13px] font-semibold text-muted">
              · {props.count} items
            </Text>
          ) : null}
        </Heading>
        <Button variant="ghost" size="sm" onClick={props.onEdit}>
          <Box className="inline-flex rotate-180">
            <IconArrowRight size={13} />
          </Box>{" "}
          Edit
        </Button>
      </Stack>
      <Box className="p-[18px]">
        <Box className="mb-1.5 grid gap-2 border-b border-line pb-3">
          <Fact label="Customer" value={customerFact(props)} />
          {props.hasPrescriptionItem ? (
            <Fact label="Prescribing doctor" value={props.customer.doctor.trim() || "—"} />
          ) : null}
          {props.isHospital ? <Fact label="Sale source" value={sourceFact(props)} /> : null}
        </Box>
        <Box className="overflow-x-auto">
          <Table className="mt-1 border-separate border-spacing-0">
            <TableHead>
              <TableRow className="border-0">
                <TableHeaderCell className={headCell}>Item</TableHeaderCell>
                <TableHeaderCell className={headCell}>Batch</TableHeaderCell>
                <TableHeaderCell align="right" className={numHead}>
                  Qty
                </TableHeaderCell>
                <TableHeaderCell align="right" className={numHead}>
                  Rate
                </TableHeaderCell>
                <TableHeaderCell align="right" className={numHead}>
                  Amount
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>{rows.map(renderRow)}</TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}

function ReviewRow({ line, view }: { line: PosLine; view: BillingLineView }) {
  const { product, loose, batch, unit } = view;
  return (
    <TableRow className="border-0 transition-colors duration-100 hover:bg-wash-2">
      <TableCell className={`${bodyCell} font-semibold`}>
        {product.name}
        {loose ? <Tag className="ml-1">loose</Tag> : null}
      </TableCell>
      <TableCell className={`${bodyCell} font-mono text-[11.5px]`}>
        {batch?.batchNo ?? "—"}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {line.qty}
        {loose ? ` ${unitNoun(product)}` : ""}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {inr(unit)}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-bold text-ink`}>
        {inr(unit * line.qty)}
      </TableCell>
    </TableRow>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="between" className="gap-3.5 text-[12.5px]">
      <Text as="span" className="text-[12.5px] font-semibold text-muted">
        {label}
      </Text>
      <Text as="span" className="text-right text-[12.5px] font-bold text-ink">
        {value}
      </Text>
    </Stack>
  );
}

function customerFact(props: OrderReviewProps) {
  const name = props.customer.name.trim() || "Walk-in";
  return props.customer.phone ? `${name} · ${props.customer.phone}` : name;
}

function sourceFact(props: OrderReviewProps) {
  const ward = props.source === "ward" && props.ward ? ` · ${props.ward}` : "";
  const patient = props.patientId ? ` · ${props.patientId}` : "";
  return `${props.sourceLabel}${ward}${patient}`;
}
