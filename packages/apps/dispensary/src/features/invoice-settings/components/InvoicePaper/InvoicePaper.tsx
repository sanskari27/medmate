import { useState, type ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import {
  FOOTER_NOTE,
  SAMPLE_CUSTOMER,
  SAMPLE_LINES,
  computeInvoice,
  formatInr,
  formatInr2,
  formatWhen,
  sampleNumber,
  type InvoiceLine,
  type TaxLine,
} from "../../invoice";
import type { InvoicePharmacy, InvoiceTemplate } from "../../model";

const pageSheet =
  "flex w-[210mm] min-h-[297mm] flex-col overflow-hidden bg-paper text-[12.5px] text-ink";

const paperClass: Record<InvoiceTemplate, string> = {
  classic: cn(pageSheet, "rounded-md border border-line"),
  modern: cn(pageSheet, "rounded-md border border-line"),
  minimal: cn(pageSheet, "rounded-md border border-[#e4e4e4]"),
  thermal: "mx-auto w-[80mm] bg-paper px-3 py-4 text-center font-mono text-[11px] text-ink",
};

export type InvoicePaperProps = {
  template: InvoiceTemplate;
  accent: string;
  title: string;
  prefix: string;
  signatory: string;
  bankLine: string;
  showBank: boolean;
  terms: string;
  showLogo: boolean;
  showStamp: boolean;
  logoUrl: string | null;
  stampUrl: string | null;
  pharmacy: InvoicePharmacy;
  className?: string;
};

export function InvoicePaper(props: InvoicePaperProps) {
  const [soldAt] = useState(() => Date.now());
  if (props.template === "thermal") return <ThermalBill {...props} soldAt={soldAt} />;
  return <PageBill {...props} soldAt={soldAt} />;
}

function PageBill({ soldAt, ...props }: InvoicePaperProps & { soldAt: number }) {
  const totals = computeInvoice(SAMPLE_LINES);
  const logo = props.showLogo && props.logoUrl ? props.logoUrl : null;
  const stamp = props.showStamp && props.stampUrl ? props.stampUrl : null;
  const modern = props.template === "modern";
  const minimal = props.template === "minimal";
  return (
    <Box data-template={props.template} className={cn(paperClass[props.template], props.className)}>
      <Stack
        direction="row"
        justify="between"
        align="start"
        gap={4}
        className={cn("px-4 py-3", modern ? "text-white" : "border-b-2")}
        style={
          modern
            ? { background: props.accent }
            : {
                borderBottomColor: minimal ? "#dddddd" : props.accent,
                borderBottomWidth: minimal ? 1 : 2,
              }
        }
      >
        <Stack direction="row" gap={3}>
          {logo ? <img src={logo} alt="logo" className="h-14 w-14 object-contain" /> : null}
          <Stack gap={1}>
            <Heading level={3} className={cn("text-[19px]", modern ? "text-white" : "text-dark")}>
              {props.pharmacy.name}
            </Heading>
            <Text variant="caption" className={modern ? "text-white/80" : undefined}>
              {props.pharmacy.address}
            </Text>
            <Text variant="caption" className={modern ? "text-white/80" : undefined}>
              Ph: {props.pharmacy.phone} · {props.pharmacy.email}
            </Text>
            <Text variant="caption" className={modern ? "text-white/80" : undefined}>
              <Text as="span" variant="caption" className={cn("font-bold", modern && "text-white")}>
                GSTIN:
              </Text>{" "}
              {props.pharmacy.gstin}{" "}
              <Text as="span" variant="caption" className={cn("font-bold", modern && "text-white")}>
                D.L. No:
              </Text>{" "}
              {props.pharmacy.drugLicenceNo}
            </Text>
          </Stack>
        </Stack>
        <Stack align="end" gap={1}>
          <Heading
            level={4}
            className={cn("text-[15px] tracking-[0.05em]", modern && "text-white")}
            style={{ color: modern ? "#ffffff" : minimal ? undefined : props.accent }}
          >
            {props.title}
          </Heading>
          <Text
            as="span"
            variant="caption"
            className={cn("text-right font-bold", modern ? "text-white" : "text-ink")}
          >
            {sampleNumber(props.prefix)}
          </Text>
          <Text variant="caption" className={cn("text-right", modern && "text-white/80")}>
            {formatWhen(soldAt)}
          </Text>
          <Text variant="caption" className={cn("text-right", modern && "text-white/80")}>
            Counter sale
          </Text>
        </Stack>
      </Stack>
      <Box className="flex flex-1 flex-col px-4 py-4">
        <Box className="mb-3 grid grid-cols-1 gap-2 border-b border-[#e4e4e4] pb-3 sm:grid-cols-2">
          <Meta label="Billed to:">{SAMPLE_CUSTOMER.name}</Meta>
          <Meta label="Payment:">UPI</Meta>
          <Meta label="Phone:">{SAMPLE_CUSTOMER.phone}</Meta>
          <Meta label="Prescribed by:">{SAMPLE_CUSTOMER.doctor}</Meta>
          <Text as="span" className="sm:col-span-2">
            <Text as="span" variant="caption" className="font-bold">
              Address:{" "}
            </Text>
            {SAMPLE_CUSTOMER.address}
          </Text>
        </Box>
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr>
              {["#", "Item", "Batch", "Exp", "Qty", "MRP", "Rate", "GST%", "Amount"].map(
                (label) => (
                  <th
                    key={label}
                    className={cn(
                      "border-b border-[#e4e4e4] px-[9px] py-[7px] text-left text-[10px] font-bold tracking-[0.03em] uppercase",
                      minimal ? "bg-transparent" : "bg-wash",
                      ["Qty", "MRP", "Rate", "GST%", "Amount"].includes(label) && "text-right",
                    )}
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_LINES.map((item, index) => (
              <LineRow key={item.name} item={item} index={index} />
            ))}
          </tbody>
        </table>
        <Box className="mt-auto border-t border-[#e4e4e4] pt-3">
          <Stack align="end">
            <table className="w-72 border-collapse text-[12px]">
              <tbody>
                <MoneyRow label="Gross (incl. GST)" value={formatInr2(totals.gross)} />
                <MoneyRow label="Taxable value" value={formatInr2(totals.taxable)} />
                {totals.lines.map((line) => (
                  <TaxRow key={line.gst} line={line} />
                ))}
                <MoneyRow
                  label="Amount payable"
                  value={formatInr(totals.payable)}
                  strong
                  color={minimal ? undefined : props.accent}
                />
              </tbody>
            </table>
          </Stack>
        </Box>
        <Stack
          direction="row"
          justify="between"
          align="end"
          gap={4}
          className="mt-4 border-t border-[#e4e4e4] pt-4"
        >
          <Stack gap={1} className="max-w-[56%]">
            <Text as="span">
              <Text as="span" className="font-bold text-dark">
                You saved {formatInr(totals.savings)}
              </Text>{" "}
              on MRP.
            </Text>
            {props.terms ? <Text variant="caption">{props.terms}</Text> : null}
            {props.showBank && props.bankLine ? (
              <Text variant="caption">{props.bankLine}</Text>
            ) : null}
            <Text variant="caption">{FOOTER_NOTE}</Text>
          </Stack>
          <Stack align="end" gap={1}>
            <Text as="span">
              For{" "}
              <Text as="span" className="font-bold">
                {props.pharmacy.name}
              </Text>
            </Text>
            {stamp ? <img src={stamp} alt="stamp" className="h-10 w-auto" /> : null}
            <Text variant="caption">{props.signatory}</Text>
            <Text variant="caption">{props.pharmacy.pharmacistName}</Text>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function ThermalBill({ soldAt, ...props }: InvoicePaperProps & { soldAt: number }) {
  const totals = computeInvoice(SAMPLE_LINES);
  const logo = props.showLogo && props.logoUrl ? props.logoUrl : null;
  const stamp = props.showStamp && props.stampUrl ? props.stampUrl : null;
  return (
    <Stack data-template="thermal" gap={1} className={cn(paperClass.thermal, props.className)}>
      {logo ? <img src={logo} alt="logo" className="mx-auto h-10 w-auto" /> : null}
      <Heading level={4}>{props.pharmacy.name}</Heading>
      <Text variant="caption">{props.pharmacy.address}</Text>
      <Text variant="caption">Ph {props.pharmacy.phone}</Text>
      <Text variant="caption">
        GSTIN {props.pharmacy.gstin} · DL {props.pharmacy.drugLicenceNo}
      </Text>
      <Text as="span" className="py-1 font-extrabold">
        {props.title}
      </Text>
      <Stack direction="row" justify="between">
        <Text as="span">{sampleNumber(props.prefix)}</Text>
        <Text as="span">{formatWhen(soldAt)}</Text>
      </Stack>
      <Stack direction="row" justify="between">
        <Text as="span">Preview</Text>
        <Text as="span">UPI</Text>
      </Stack>
      <Box className="my-1 h-px w-full border-t border-dashed border-line" />
      {SAMPLE_LINES.map((item, index) => (
        <Stack key={item.name} gap={0} className="py-1 text-left">
          <Text as="span" className="font-bold">
            {index + 1}. {item.name}{" "}
            <Text as="span" variant="caption">
              · B:{item.batchNo}
            </Text>
          </Text>
          <Stack direction="row" justify="between">
            <Text as="span">
              {item.qty} × {formatInr2(item.price)}
            </Text>
            <Text as="span">{formatInr2(item.price * item.qty)}</Text>
          </Stack>
        </Stack>
      ))}
      <Box className="my-1 h-px w-full border-t border-dashed border-line" />
      <Stack direction="row" justify="between">
        <Text as="span">Taxable</Text>
        <Text as="span">{formatInr2(totals.taxable)}</Text>
      </Stack>
      {totals.lines.map((line) => (
        <Stack key={line.gst} direction="row" justify="between">
          <Text as="span">GST {line.gst}%</Text>
          <Text as="span">{formatInr2(line.cgst + line.sgst)}</Text>
        </Stack>
      ))}
      <Stack direction="row" justify="between" className="font-extrabold">
        <Text as="span" className="font-extrabold" style={{ color: props.accent }}>
          TOTAL
        </Text>
        <Text as="span" className="font-extrabold" style={{ color: props.accent }}>
          {formatInr(totals.payable)}
        </Text>
      </Stack>
      <Text variant="caption">You saved {formatInr(totals.savings)} on MRP</Text>
      {props.terms ? <Text variant="caption">{props.terms}</Text> : null}
      {props.showBank && props.bankLine ? <Text variant="caption">{props.bankLine}</Text> : null}
      <Text variant="caption">{FOOTER_NOTE}</Text>
      {stamp ? <img src={stamp} alt="stamp" className="mx-auto h-10 w-auto" /> : null}
      <Text variant="caption">{props.signatory}</Text>
      <Text variant="caption">{props.pharmacy.pharmacistName}</Text>
    </Stack>
  );
}

function LineRow({ item, index }: { item: InvoiceLine; index: number }) {
  return (
    <tr>
      <Cell>{index + 1}</Cell>
      <Cell>
        <b className="font-bold">{item.name}</b>
      </Cell>
      <Cell>{item.batchNo}</Cell>
      <Cell>{item.expiry}</Cell>
      <Cell align="right">{item.qty}</Cell>
      <Cell align="right">{formatInr2(item.mrp)}</Cell>
      <Cell align="right">{formatInr2(item.price)}</Cell>
      <Cell align="right">{item.gst}%</Cell>
      <Cell align="right">{formatInr2(item.price * item.qty)}</Cell>
    </tr>
  );
}

function Cell({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <td
      className={cn(
        "border-b border-[#e4e4e4] px-[9px] py-[7px]",
        align === "right" && "text-right",
      )}
    >
      {children}
    </td>
  );
}

function Meta({ label, children }: { label: string; children: string }) {
  return (
    <Text as="span">
      <Text as="span" variant="caption" className="font-bold">
        {label}{" "}
      </Text>
      <Text as="span" className="font-bold">
        {children}
      </Text>
    </Text>
  );
}

function MoneyRow({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}) {
  return (
    <tr className={strong ? "border-t-2 border-[#e4e4e4] font-extrabold text-dark" : undefined}>
      <td
        className={cn("py-1.5", !strong && "border-b border-[#e4e4e4]", strong && "font-extrabold")}
        style={color ? { color } : undefined}
      >
        {label}
      </td>
      <td
        className={cn(
          "py-1.5 text-right",
          !strong && "border-b border-[#e4e4e4]",
          strong && "font-extrabold",
        )}
        style={color ? { color } : undefined}
      >
        {value}
      </td>
    </tr>
  );
}

function TaxRow({ line }: { line: TaxLine }) {
  return (
    <MoneyRow
      label={`CGST ${line.gst / 2}% + SGST ${line.gst / 2}%`}
      value={formatInr2(line.cgst + line.sgst)}
    />
  );
}
