import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { canReturn, formatWhen, inr2, type PurchaseDocument, typeLabel } from "../../model";

export function ReceiptDialog({
  document,
  canCreateReturn,
  onClose,
  onCreateReturn,
}: {
  document: PurchaseDocument;
  canCreateReturn: boolean;
  onClose: () => void;
  onCreateReturn: () => void;
}) {
  const showReturn = document.type === "purchase" && canCreateReturn && canReturn(document);

  return (
    <Box className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Box
        role="dialog"
        aria-label={`${document.id} receipt`}
        className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-md border border-line bg-paper p-5 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack direction="row" align="center" className="mb-3 justify-between">
          <Heading level={3}>
            {document.id} · {document.distributorName}
          </Heading>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Text className="mb-3 text-[12.5px] text-muted">
          {typeLabel(document.type)} · Invoice {document.invoiceNo} · {document.invoiceDate} ·
          Entered {formatWhen(document.recordedAt)}
        </Text>
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              {["Item", "Batch", "Exp", "Qty", "Free", "Rate", "MRP", "GST", "Amount"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="bg-wash-2 px-2 py-2 text-left text-[10.5px] font-bold text-muted uppercase"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {document.lines.map((line) => (
              <tr key={line.position}>
                <td className="border-t border-line px-2 py-2 font-bold">{line.name}</td>
                <td className="border-t border-line px-2 py-2">{line.batchNo}</td>
                <td className="border-t border-line px-2 py-2">{line.expiry}</td>
                <td className="border-t border-line px-2 py-2">{line.qty}</td>
                <td className="border-t border-line px-2 py-2">{line.freeQty || "—"}</td>
                <td className="border-t border-line px-2 py-2">{inr2(line.rate)}</td>
                <td className="border-t border-line px-2 py-2">{inr2(line.mrp)}</td>
                <td className="border-t border-line px-2 py-2">{line.gst}%</td>
                <td className="border-t border-line px-2 py-2 font-bold">{inr2(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Text className="mt-3 font-bold">
          Bill total ({document.units} units stocked) {inr2(document.total)}
        </Text>
        {showReturn ? (
          <Button type="button" className="mt-4" onClick={onCreateReturn}>
            Create return
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
