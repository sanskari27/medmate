import { useEffect } from "react";
import { invoiceSettingsApi, InvoicePaper, type InvoiceSale } from "@/features/invoice-settings";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { PostedBill } from "../../../../billing.slice";

export function PostedInvoice({
  posted,
  settings,
  onNew,
}: {
  posted: PostedBill;
  settings: ReturnType<typeof invoiceSettingsApi.useReadInvoiceSettingsQuery>["data"];
  onNew: () => void;
}) {
  const sale: InvoiceSale = {
    number: posted.number,
    soldAt: Date.parse(posted.soldAt),
    patientName: posted.patientName,
    patientPhone: posted.patientPhone,
    prescribedBy: posted.prescribedBy,
    payMode: posted.payMode,
    billDiscount: Number(posted.extraAmount ?? 0),
    lines: posted.lines.map((line) => ({
      name: line.name,
      batchNo: line.batchNo,
      expiry: line.expiry,
      qty: line.qty,
      mrp: Number(line.mrp),
      price: Number(line.unitPrice),
      gst: line.gst,
    })),
  };
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onNew();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNew]);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={posted.payMode === "credit" ? `Invoice ${posted.number} · on khata` : "Invoice"}
      data-posted-bill=""
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
    >
      <Box className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-paper shadow-pop">
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="shrink-0 border-b border-line bg-dark px-3 py-2 text-white print:hidden"
        >
          <Text as="span" className="text-[13px] font-bold text-white">
            {posted.payMode === "credit"
              ? `Invoice ${posted.number} · on khata`
              : `Invoice ${posted.number}`}
          </Text>
          <Stack direction="row" gap={2}>
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            <Button type="button" variant="primary" onClick={onNew}>
              New bill
            </Button>
          </Stack>
        </Stack>
        <Box className="min-h-0 flex-1 overflow-auto bg-canvas p-3">
          {settings ? (
            <InvoicePaper
              template={settings.template}
              accent={settings.accent}
              title={settings.title}
              prefix={settings.prefix}
              signatory={settings.signatory}
              bankLine={settings.bankLine}
              showBank={settings.showBank}
              terms={settings.terms}
              showLogo={settings.showLogo && Boolean(settings.logo)}
              showStamp={settings.showStamp && Boolean(settings.signature)}
              logoUrl={settings.logo?.url ?? null}
              stampUrl={settings.signature?.url ?? null}
              pharmacy={settings.pharmacy}
              bill={sale}
              className="print-area"
            />
          ) : (
            <Text as="span" className="font-bold">
              {posted.number}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
