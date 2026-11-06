import { cva } from "class-variance-authority";
import { Alert } from "@/components/molecules/Alert";
import { Box } from "@/components/atoms/Box";
import { Heading } from "@/components/atoms/Heading";
import { Image } from "@/components/atoms/Image";
import { Stack } from "@/components/atoms/Stack";
import { Table } from "@/components/atoms/Table";
import { TableBody } from "@/components/atoms/TableBody";
import { TableCell } from "@/components/atoms/TableCell";
import { TableHead } from "@/components/atoms/TableHead";
import { TableHeaderCell } from "@/components/atoms/TableHeaderCell";
import { TableRow } from "@/components/atoms/TableRow";
import { Text } from "@/components/atoms/Text";
import { IconAlert } from "@/components/atoms/Icon";
import { useAppSelector } from "@/hooks";
import {
  PAY_LABEL,
  channelLabel,
  computeInvoice,
  fmtDateTime,
  inr,
  inr2,
  type InvoiceSettings,
  type PharmacyProfile,
  type Sale,
  type SaleItem,
  type TaxLine,
} from "@/utils";
import { cn } from "@/utils/className";
import type { InvoiceProps } from "./Invoice.types";

const invoiceVariants = cva("bg-paper text-ink", {
  variants: {
    template: {
      classic: "rounded-md border border-line text-[12.5px]",
      modern:
        "rounded-md border border-x border-b border-t-4 border-line border-t-dark text-[12.5px]",
      minimal: "rounded-md border border-line text-[12.5px]",
      thermal: "mx-auto w-[80mm] px-3 py-4 text-center font-mono text-[11px]",
    },
  },
});

function HsnHeader({ show }: { show: boolean }) {
  if (!show) return null;
  return <TableHeaderCell>HSN</TableHeaderCell>;
}

function HsnCell({ show, value }: { show: boolean; value: string }) {
  if (!show) return null;
  return <TableCell>{value}</TableCell>;
}

function InvoiceItemRow({
  item,
  index,
  showHsn,
}: {
  item: SaleItem;
  index: number;
  showHsn: boolean;
}) {
  return (
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        <b className="font-bold">{item.name}</b>
      </TableCell>
      <HsnCell show={showHsn} value={item.hsn} />
      <TableCell>{item.batchNo}</TableCell>
      <TableCell>{item.expiry}</TableCell>
      <TableCell align="right">{item.qty}</TableCell>
      <TableCell align="right">{inr2(item.mrp)}</TableCell>
      <TableCell align="right">{inr2(item.price)}</TableCell>
      <TableCell align="right">{item.gst}%</TableCell>
      <TableCell align="right">{inr2(item.price * item.qty)}</TableCell>
    </TableRow>
  );
}

function InvoiceItems({ items, showHsn }: { items: SaleItem[]; showHsn: boolean }) {
  return items.map(function renderItem(item, index) {
    return (
      <InvoiceItemRow
        key={item.productId + item.batchNo}
        item={item}
        index={index}
        showHsn={showHsn}
      />
    );
  });
}

function MoneyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <TableRow className={strong ? "font-extrabold text-dark" : undefined}>
      <TableCell className={strong ? "font-extrabold" : undefined}>{label}</TableCell>
      <TableCell align="right" className={strong ? "font-extrabold" : undefined}>
        {value}
      </TableCell>
    </TableRow>
  );
}

function DiscountRow({ discount }: { discount: number }) {
  if (discount <= 0) return null;
  return <MoneyRow label="Discount" value={`− ${inr2(discount)}`} />;
}

function TaxRows({ lines }: { lines: TaxLine[] }) {
  return lines.map(function renderTax(line) {
    return (
      <MoneyRow
        key={line.gst}
        label={`CGST ${line.gst / 2}% + SGST ${line.gst / 2}%`}
        value={inr2(line.cgst + line.sgst)}
      />
    );
  });
}

function RoundOffRow({ roundOff }: { roundOff: number }) {
  if (Math.abs(roundOff) < 0.005) return null;
  const sign = roundOff >= 0 ? "+" : "−";
  return <MoneyRow label="Round off" value={`${sign} ${inr2(Math.abs(roundOff))}`} />;
}

function PendingBanner() {
  return (
    <Alert tone="rose" className="my-2.5 text-center tracking-wide">
      <Stack direction="row" align="center" justify="center" gap={2}>
        <IconAlert size={13} />
        <Text as="span" className="text-[12.5px] font-extrabold text-rose">
          PAYMENT PENDING — COLLECT AT RECEPTION / BILLING COUNTER
        </Text>
      </Stack>
    </Alert>
  );
}

function MetaLine({ label, children }: { label: string; children: string }) {
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

function PhoneLine({ phone }: { phone?: string }) {
  if (!phone) return null;
  return (
    <Text as="span">
      <Text as="span" variant="caption" className="font-bold">
        Phone:{" "}
      </Text>
      {phone}
    </Text>
  );
}

function DoctorLine({ doctor, include }: { doctor?: string; include: boolean }) {
  if (!include || !doctor) return null;
  return (
    <Text as="span">
      <Text as="span" variant="caption" className="font-bold">
        Prescribed by:{" "}
      </Text>
      {doctor}
    </Text>
  );
}

function AddressLine({ address }: { address?: string }) {
  if (!address) return null;
  return (
    <Text as="span" className="sm:col-span-2">
      <Text as="span" variant="caption" className="font-bold">
        Address:{" "}
      </Text>
      {address}
    </Text>
  );
}

function ThermalItem({ item, index }: { item: SaleItem; index: number }) {
  return (
    <Stack gap={0} className="py-1 text-left">
      <Text as="span" className="font-bold">
        {index + 1}. {item.name}{" "}
        <Text as="span" variant="caption">
          · B:{item.batchNo}
        </Text>
      </Text>
      <Stack direction="row" justify="between">
        <Text as="span">
          {item.qty} × {inr2(item.price)}
        </Text>
        <Text as="span">{inr2(item.price * item.qty)}</Text>
      </Stack>
    </Stack>
  );
}

function ThermalItems({ items }: { items: SaleItem[] }) {
  return items.map(function renderThermal(item, index) {
    return <ThermalItem key={item.productId + item.batchNo} item={item} index={index} />;
  });
}

function ThermalTax({ lines }: { lines: TaxLine[] }) {
  return lines.map(function renderLine(line) {
    return (
      <Stack key={line.gst} direction="row" justify="between">
        <Text as="span">GST {line.gst}%</Text>
        <Text as="span">{inr2(line.cgst + line.sgst)}</Text>
      </Stack>
    );
  });
}

function ThermalInvoice({
  sale,
  profile,
  settings,
  className,
}: {
  sale: Sale;
  profile: PharmacyProfile;
  settings: InvoiceSettings;
  className?: string;
}) {
  const totals = computeInvoice(sale.items, sale.discount);
  const logo = settings.showLogo && profile.logo ? profile.logo : null;
  return (
    <Stack
      data-slot="invoice"
      gap={1}
      className={cn(invoiceVariants({ template: "thermal" }), className)}
    >
      {logo ? <Image src={logo} alt="logo" className="mx-auto h-10 w-auto" /> : null}
      <Heading level={4}>{profile.name}</Heading>
      <Text variant="caption">{profile.address}</Text>
      <Text variant="caption">Ph {profile.phone}</Text>
      <Text variant="caption">
        GSTIN {profile.gstin} · DL {profile.dlNo}
      </Text>
      <Text as="span" className="py-1 font-extrabold">
        {settings.title}
      </Text>
      <Stack direction="row" justify="between">
        <Text as="span">{sale.id}</Text>
        <Text as="span">{fmtDateTime(sale.createdAt)}</Text>
      </Stack>
      <Stack direction="row" justify="between">
        <Text as="span">{sale.customer.name}</Text>
        <Text as="span">{PAY_LABEL[sale.payMode]}</Text>
      </Stack>
      <Box className="my-1 h-px w-full border-t border-dashed border-line" />
      <ThermalItems items={sale.items} />
      <Box className="my-1 h-px w-full border-t border-dashed border-line" />
      <Stack direction="row" justify="between">
        <Text as="span">Taxable</Text>
        <Text as="span">{inr2(totals.taxable)}</Text>
      </Stack>
      <ThermalTax lines={totals.lines} />
      {totals.discount > 0 ? (
        <Stack direction="row" justify="between">
          <Text as="span">Discount</Text>
          <Text as="span">− {inr2(totals.discount)}</Text>
        </Stack>
      ) : null}
      <Stack direction="row" justify="between" className="font-extrabold">
        <Text as="span" className="font-extrabold">
          TOTAL
        </Text>
        <Text as="span" className="font-extrabold">
          {inr(totals.payable)}
        </Text>
      </Stack>
      {settings.showSavings && totals.savings > 0 ? (
        <Text variant="caption">You saved {inr(totals.savings)} on MRP</Text>
      ) : null}
      <Box className="my-1 h-px w-full border-t border-dashed border-line" />
      <Text variant="caption">{settings.footerNote}</Text>
    </Stack>
  );
}

function PageInvoice({
  sale,
  profile,
  settings,
  className,
}: {
  sale: Sale;
  profile: PharmacyProfile;
  settings: InvoiceSettings;
  className?: string;
}) {
  const totals = computeInvoice(sale.items, sale.discount);
  const logo = settings.showLogo && profile.logo ? profile.logo : null;
  const pending = sale.paid === false;
  return (
    <Box
      data-slot="invoice"
      className={cn(invoiceVariants({ template: settings.template }), className)}
    >
      <Stack direction="row" justify="between" align="start" gap={4} className="mb-4">
        <Stack direction="row" gap={3}>
          {logo ? <Image src={logo} alt="logo" className="h-14 w-14 object-contain" /> : null}
          <Stack gap={1}>
            <Heading level={3} className="text-[19px] text-dark">
              {profile.name}
            </Heading>
            <Text variant="caption">{profile.address}</Text>
            <Text variant="caption">
              Ph: {profile.phone} · {profile.email}
            </Text>
            <Text variant="caption">
              <Text as="span" className="font-bold">
                GSTIN:
              </Text>{" "}
              {profile.gstin}{" "}
              <Text as="span" className="font-bold">
                D.L. No:
              </Text>{" "}
              {profile.dlNo}
            </Text>
          </Stack>
        </Stack>
        <Stack align="end" gap={1}>
          <Heading level={4} className="text-[15px] tracking-[0.05em] text-dark">
            {settings.title}
          </Heading>
          <Text as="span" variant="caption" className="text-right font-bold text-ink">
            {sale.id}
          </Text>
          <Text variant="caption" className="text-right">
            {fmtDateTime(sale.createdAt)}
          </Text>
          <Text variant="caption" className="text-right">
            {channelLabel(sale.channel)} sale
          </Text>
        </Stack>
      </Stack>

      <Box className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <MetaLine label="Billed to:">
          {sale.ward ? `${sale.customer.name} · ${sale.ward}` : sale.customer.name}
        </MetaLine>
        <Text as="span">
          <Text as="span" variant="caption" className="font-bold">
            Payment:{" "}
          </Text>
          <Text as="span" className={pending ? "font-bold text-rose" : "font-bold"}>
            {pending ? "PENDING — pay at reception" : PAY_LABEL[sale.payMode]}
          </Text>
        </Text>
        <PhoneLine phone={sale.customer.phone} />
        <DoctorLine doctor={sale.customer.doctor} include={settings.includeDoctor} />
        <AddressLine address={sale.customer.address} />
      </Box>

      {pending ? <PendingBanner /> : null}

      <Table className="!border-collapse !text-[11.5px] [&_th]:!bg-wash [&_th]:!px-[9px] [&_th]:!py-[7px] [&_th]:!text-[10px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.03em] [&_td]:!px-[9px] [&_td]:!py-[7px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell>#</TableHeaderCell>
            <TableHeaderCell>Item</TableHeaderCell>
            <HsnHeader show={settings.showHsn} />
            <TableHeaderCell>Batch</TableHeaderCell>
            <TableHeaderCell>Exp</TableHeaderCell>
            <TableHeaderCell align="right">Qty</TableHeaderCell>
            <TableHeaderCell align="right">MRP</TableHeaderCell>
            <TableHeaderCell align="right">Rate</TableHeaderCell>
            <TableHeaderCell align="right">GST%</TableHeaderCell>
            <TableHeaderCell align="right">Amount</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <InvoiceItems items={sale.items} showHsn={settings.showHsn} />
        </TableBody>
      </Table>

      <Stack align="end" className="mt-3">
        <Table className="w-72">
          <TableBody>
            <MoneyRow label="Gross (incl. GST)" value={inr2(totals.gross)} />
            <DiscountRow discount={totals.discount} />
            <MoneyRow label="Taxable value" value={inr2(totals.taxable)} />
            <TaxRows lines={totals.lines} />
            <RoundOffRow roundOff={totals.roundOff} />
            <MoneyRow label="Amount payable" value={inr(totals.payable)} strong />
          </TableBody>
        </Table>
      </Stack>

      <Stack direction="row" justify="between" align="end" gap={4} className="mt-6">
        <Stack gap={1} className="max-w-[56%]">
          {settings.showSavings && totals.savings > 0 ? (
            <Text as="span">
              <Text as="span" className="font-bold text-dark">
                You saved {inr(totals.savings)}
              </Text>{" "}
              on MRP.
            </Text>
          ) : null}
          <Text variant="caption">{settings.terms}</Text>
          {settings.showBank ? <Text variant="caption">{settings.bankLine}</Text> : null}
          {settings.footerNote ? <Text variant="caption">{settings.footerNote}</Text> : null}
        </Stack>
        <Stack align="end" gap={1}>
          <Text as="span">
            For{" "}
            <Text as="span" className="font-bold">
              {profile.name}
            </Text>
          </Text>
          <Stack direction="row" align="center" gap={2}>
            {settings.showStamp && settings.stamp ? (
              <Image src={settings.stamp} alt="stamp" className="h-10 w-auto" />
            ) : null}
            {profile.signature ? (
              <Image src={profile.signature} alt="signature" className="h-10 w-auto" />
            ) : null}
          </Stack>
          <Text variant="caption">{settings.signatory}</Text>
          <Text variant="caption">{profile.pharmacist}</Text>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function Invoice({ sale, profile, className }: InvoiceProps) {
  const invoiceSettings = useAppSelector((state) => state.auth.invoiceSettings);
  if (invoiceSettings.template === "thermal") {
    return (
      <ThermalInvoice
        sale={sale}
        profile={profile}
        settings={invoiceSettings}
        className={className}
      />
    );
  }
  return (
    <PageInvoice sale={sale} profile={profile} settings={invoiceSettings} className={className} />
  );
}

export type { InvoiceProps };
