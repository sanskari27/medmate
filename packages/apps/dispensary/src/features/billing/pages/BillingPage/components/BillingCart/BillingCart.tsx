import type { KeyboardEvent } from "react";
import type { InventoryProduct } from "@/features/inventory";
import type { Offer } from "@/features/offers";
import { Box } from "@/components/ui/Box";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { sellableBatches, type CartLine, type DiscountKind } from "../../../../model";
import { batchLabel, lineFigures, rupee } from "../../billingView";

export const smallCell =
  "h-6 w-full rounded-xs border border-line bg-paper px-1.5 text-[11px] text-ink outline-none focus:border-dark focus:shadow-[0_0_0_2px_#1b3d29,0_0_0_4px_rgba(27,61,41,0.16)]";

const headCell = "px-2 py-1.5 font-bold whitespace-nowrap";
const bodyCell = "px-2 py-1 align-middle";
const moneyCell = `${bodyCell} text-right font-mono text-[12px] leading-4 tabular-nums`;

export function BillingCart({
  lines,
  products,
  offers,
  qtyDraft,
  units,
  loading,
  notice,
  onChooseBatch,
  onQtyChange,
  onQtyBlur,
  onQtyKey,
  onDiscountType,
  onDiscountValue,
  onRemove,
}: {
  lines: CartLine[];
  products: InventoryProduct[];
  offers: Offer[];
  qtyDraft: Record<string, string>;
  units: number;
  loading: boolean;
  notice: string | null;
  onChooseBatch: (line: CartLine, batchNo: string) => void;
  onQtyChange: (line: CartLine, raw: string, max: number) => void;
  onQtyBlur: (key: string) => void;
  onQtyKey: (event: KeyboardEvent<HTMLInputElement>, line: CartLine, max: number) => void;
  onDiscountType: (line: CartLine, type: DiscountKind) => void;
  onDiscountValue: (line: CartLine, value: number) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <Box className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="min-h-0 flex-1 overflow-auto">
        <table aria-label="Cart" className="w-full min-w-[1080px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-canvas text-[10px] font-bold tracking-wide text-faint uppercase">
            <tr>
              <th className={headCell}>#</th>
              <th className={`${headCell} min-w-[180px]`}>Product</th>
              <th className={`${headCell} min-w-[200px]`}>Batch</th>
              <th className={headCell}>Qty</th>
              <th className={`${headCell} text-right`}>MRP</th>
              <th className={`${headCell} text-right`}>Offer</th>
              <th className={headCell}>Special</th>
              <th className={`${headCell} text-right`}>CGST</th>
              <th className={`${headCell} text-right`}>SGST</th>
              <th className={`${headCell} text-right`}>GST</th>
              <th className={`${headCell} text-right`}>Discount</th>
              <th className={`${headCell} text-right`}>Amount</th>
              <th className={`${headCell} w-9 text-center`} />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const product = products.find((item) => item.productId === line.productId);
              const batches = product ? sellableBatches(product) : [];
              const batch = batches.find((item) => item.batchNo === line.batchNo) ?? null;
              const view = lineFigures(line, product, batch, offers);
              const name = product?.name ?? line.productId;
              const max = batch?.qty ?? line.qty;
              return (
                <tr
                  key={line.key}
                  data-line-key={line.key}
                  className="border-t border-line align-middle focus-within:bg-wash-2"
                >
                  <td className={`${bodyCell} text-center font-mono text-[11px] text-faint`}>
                    {index + 1}
                  </td>
                  <td className={bodyCell}>
                    <Text as="span" className="block truncate text-[12px] leading-4 font-bold">
                      {name}{" "}
                      <Text as="span" className="font-medium text-faint">
                        {line.productId}
                      </Text>
                    </Text>
                  </td>
                  <td className={bodyCell}>
                    <select
                      aria-label={`Batch for ${name}`}
                      data-line-key={line.key}
                      data-col="batch"
                      value={line.batchNo ?? ""}
                      onChange={(event) => onChooseBatch(line, event.target.value)}
                      className={smallCell}
                    >
                      {line.batchNo ? null : <option value="">Choose batch</option>}
                      {batches.map((item) => (
                        <option key={item.batchNo} value={item.batchNo}>
                          {batchLabel(item)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={bodyCell}>
                    <input
                      aria-label={`Quantity for ${name}`}
                      data-line-key={line.key}
                      data-col="qty"
                      inputMode="numeric"
                      value={qtyDraft[line.key] ?? String(line.qty)}
                      onChange={(event) => onQtyChange(line, event.target.value, max)}
                      onBlur={() => onQtyBlur(line.key)}
                      onKeyDown={(event) => onQtyKey(event, line, max)}
                      className={`${smallCell} !w-12 text-center font-mono font-bold tabular-nums`}
                    />
                  </td>
                  <td className={moneyCell}>{view ? rupee(view.gross) : "—"}</td>
                  <td className={`${moneyCell} text-dark`}>
                    {view?.offer ? (
                      <>
                        <span className="block truncate text-[11px] leading-4 font-bold text-ink">
                          {view.offer.title}
                        </span>
                        <span className="block text-[11px] leading-4">
                          -{rupee(view.offerDiscount)}
                        </span>
                      </>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className={bodyCell}>
                    <Stack direction="row" align="center" gap={1}>
                      <select
                        aria-label={`Special discount for ${name}`}
                        data-line-key={line.key}
                        data-col="special"
                        value={line.discountType}
                        onChange={(event) =>
                          onDiscountType(line, event.target.value as DiscountKind)
                        }
                        className={`${smallCell} !w-14`}
                      >
                        <option value="none">None</option>
                        <option value="percent">%</option>
                        <option value="flat">₹</option>
                      </select>
                      <input
                        aria-label={`Special value for ${name}`}
                        data-line-key={line.key}
                        data-col="special-value"
                        inputMode="decimal"
                        value={line.discountValue}
                        onChange={(event) => onDiscountValue(line, Number(event.target.value))}
                        className={`${smallCell} !w-12 font-mono tabular-nums`}
                        disabled={line.discountType === "none"}
                      />
                    </Stack>
                  </td>
                  <td className={moneyCell}>{view ? rupee(view.cgst) : "—"}</td>
                  <td className={moneyCell}>{view ? rupee(view.sgst) : "—"}</td>
                  <td className={moneyCell} title={view ? `GST ${view.rate}% included` : undefined}>
                    {view ? (
                      <>
                        <span className="block leading-4">{rupee(view.gst)}</span>
                        <span className="block text-[10px] leading-4 text-faint">{view.rate}%</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`${moneyCell} text-dark`}>
                    {view && view.discount > 0 ? `-${rupee(view.discount)}` : "—"}
                  </td>
                  <td className={`${moneyCell} font-bold text-ink`}>
                    {view ? rupee(view.net) : "—"}
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      data-line-key={line.key}
                      data-col="delete"
                      title="Remove row (Alt+Backspace)"
                      className="grid h-7 w-7 place-items-center rounded-xs text-[16px] leading-none text-faint outline-none hover:bg-rose-bg hover:text-rose focus:shadow-[0_0_0_2px_#1b3d29]"
                      onClick={() => onRemove(line.key)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lines.length === 0 ? (
          <Box className="px-3 py-8 text-center">
            <Text as="span" className="block text-[13px] font-semibold">
              No items in this bill
            </Text>
            <Text as="span" className="mt-0.5 block text-[11px] text-muted">
              Type in search and press Enter. F3 jumps back to search.
            </Text>
          </Box>
        ) : null}
      </Box>
      <Box className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-canvas px-2.5 py-1 text-[10px] text-muted">
        <Text as="span" className="font-mono text-[10px] tabular-nums">
          Rows {lines.length} · Units {units}
          {loading ? " · Loading stock…" : ""}
        </Text>
        <Text
          as="span"
          role="status"
          className={`text-[10px] ${notice ? "text-rose" : "text-dark"}`}
        >
          {notice ?? "F3 search · Tab next cell · +/− quantity"}
        </Text>
      </Box>
    </Box>
  );
}
