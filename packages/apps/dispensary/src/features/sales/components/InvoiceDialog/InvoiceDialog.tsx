import { useEffect } from "react";
import { InvoicePaper, invoiceSettingsApi, type InvoiceSale } from "@/features/invoice-settings";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { SaleDocument } from "../../model";

export function InvoiceDialog({
  sale,
  settings,
  canReturn,
  onClose,
  onReturn,
}: {
  sale: SaleDocument;
  settings: ReturnType<typeof invoiceSettingsApi.useReadInvoiceSettingsQuery>["data"];
  canReturn: boolean;
  onClose: () => void;
  onReturn: () => void;
}) {
  const paper = toPaper(sale);
  const remaining = sale.lines.some((line) => line.qty - (line.returnedQty ?? 0) > 0);
  const sheet = settings
    ? {
        template: settings.template,
        accent: settings.accent,
        title: settings.title,
        prefix: settings.prefix,
        signatory: settings.signatory,
        bankLine: settings.bankLine,
        showBank: settings.showBank,
        terms: settings.terms,
        showLogo: settings.showLogo && Boolean(settings.logo),
        showStamp: settings.showStamp && Boolean(settings.signature),
        logoUrl: settings.logo?.url ?? null,
        stampUrl: settings.signature?.url ?? null,
        pharmacy: settings.pharmacy,
        bill: paper,
      }
    : null;
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Invoice"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
    >
      <Box className="flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop">
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="shrink-0 border-b border-line bg-dark px-3 py-2 text-white print:hidden"
        >
          <Text as="span" className="text-[13px] font-bold text-white">
            Invoice {sale.invoiceNumber}
          </Text>
          <Stack direction="row" gap={2}>
            {canReturn && remaining ? (
              <Button type="button" variant="secondary" onClick={onReturn}>
                Return
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            <Button type="button" variant="primary" onClick={onClose}>
              Close
            </Button>
          </Stack>
        </Stack>
        <Box className="min-h-0 flex-1 overflow-auto bg-canvas p-3">
          {sheet ? (
            sheet.template === "thermal" ? (
              <InvoicePaper {...sheet} className="print-area mx-auto" />
            ) : (
              <Box className="invoice-a4-frame">
                <Box className="invoice-a4-sizer">
                  <InvoicePaper {...sheet} className="invoice-a4-fit print-area" />
                </Box>
              </Box>
            )
          ) : (
            <Text as="span" className="font-bold">
              {sale.invoiceNumber}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function toPaper(sale: SaleDocument): InvoiceSale {
  return {
    number: sale.invoiceNumber,
    soldAt: Date.parse(sale.recordedAt),
    patientName: sale.patientName,
    patientPhone: sale.patientPhone,
    prescribedBy: sale.prescribedBy,
    billDiscount: Number(sale.extraAmount ?? 0),
    lines: sale.lines.map((line) => ({
      name: line.name,
      batchNo: line.batchNo,
      expiry: line.expiry,
      qty: line.qty,
      mrp: Number(line.mrp ?? 0),
      price: Number(line.unitPrice ?? 0),
      gst: line.gst ?? 0,
    })),
  };
}
