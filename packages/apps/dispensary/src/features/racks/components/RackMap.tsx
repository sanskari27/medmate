import { useState, type KeyboardEvent } from "react";
import type { InventoryProduct } from "@/features/inventory";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { IconHelp, IconPlus, IconStore } from "@/components/ui/Icon";
import { matchesRack, units, type RackGroup } from "../model";

export function RackMap({
  groups,
  query,
  unassigned,
  canCreate,
  onCreate,
  onOpen,
  onProduct,
  onAssign,
}: {
  groups: RackGroup[];
  query: string;
  unassigned: number;
  canCreate: boolean;
  onCreate: (code: string) => Promise<string | null>;
  onOpen: (code: string) => void;
  onProduct: (productId: string) => void;
  onAssign: () => void;
}) {
  const [nextRack, setNextRack] = useState("");
  const [fault, setFault] = useState("");
  const text = query.trim().toLowerCase();
  const shown = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((product) => matchesRack(product, query)),
    }))
    .filter((group) => !text || group.items.length > 0 || group.code.toLowerCase().includes(text));

  async function submit() {
    if (!nextRack.trim()) return;
    const problem = await onCreate(nextRack);
    if (problem) {
      setFault(problem);
      return;
    }
    setFault("");
    setNextRack("");
  }

  return (
    <Box>
      {canCreate ? (
        <Box className="mb-3.5 flex flex-wrap items-center gap-3 rounded-md border border-line bg-paper p-[18px] shadow-sm">
          <Text className="text-[13px] font-bold text-ink">Create a rack</Text>
          <Input
            aria-label="Rack code"
            value={nextRack}
            onChange={(event) => setNextRack(event.target.value.toUpperCase())}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") void submit();
            }}
            placeholder="e.g. A3-12"
            className="w-[130px] shrink-0 font-mono"
          />
          <Button type="button" size="sm" disabled={!nextRack.trim()} onClick={() => void submit()}>
            <IconPlus size={14} /> Add rack
          </Button>
          <Text className="w-full text-[11.5px] leading-normal text-muted">
            Make the on-screen code identical to the printed shelf label. Click any rack below to
            add medicines inside it.
          </Text>
          {fault ? <Text className="w-full text-[12.5px] text-rose">{fault}</Text> : null}
        </Box>
      ) : null}
      {unassigned > 0 && !text ? (
        <Box className="mb-3.5 flex flex-wrap items-center gap-3 rounded-md border border-line bg-amber-bg p-[18px] shadow-sm">
          <IconHelp size={22} />
          <Box className="min-w-0 flex-1">
            <Text className="text-[13.5px] font-bold text-ink">
              {unassigned} medicine{unassigned === 1 ? "" : "s"} have no rack location yet
            </Text>
            <Text className="text-[12px] text-muted">
              Assign them so staff can find stock on the shelves quickly.
            </Text>
          </Box>
          <Button type="button" size="sm" onClick={onAssign}>
            Assign now
          </Button>
        </Box>
      ) : null}
      {shown.length === 0 ? (
        <Box className="rounded-md border border-line bg-paper px-5 py-9 text-center shadow-sm">
          <IconStore size={28} />
          <Text className="mx-auto mt-3 max-w-[340px] text-[13px] text-muted">
            {query ? `No locations match “${query}”.` : "No racks yet — create one above."}
          </Text>
        </Box>
      ) : (
        <Box className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start gap-3.5">
          {shown.map((group) => (
            <Box
              key={group.code}
              className="overflow-hidden rounded-md border border-line bg-paper"
            >
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-between rounded-none border-0 border-b border-line bg-wash-2 px-3.5 py-[11px] text-left font-normal shadow-none"
                onClick={() => onOpen(group.code)}
              >
                <Text className="font-mono text-base font-extrabold tracking-[0.04em] text-dark">
                  {group.code}
                </Text>
                <Text className="text-[11.5px] font-normal text-muted">
                  {group.items.length} item{group.items.length === 1 ? "" : "s"} · manage
                </Text>
              </Button>
              <Box className="flex max-h-[210px] flex-col overflow-y-auto">
                {group.items.length === 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full rounded-none border-0 bg-transparent px-3.5 py-2 text-[12px] font-normal text-muted shadow-none"
                    onClick={() => onOpen(group.code)}
                  >
                    Empty — click to add medicines
                  </Button>
                ) : (
                  group.items.map((product) => (
                    <ProductLine key={product.productId} product={product} onProduct={onProduct} />
                  ))
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function ProductLine({
  product,
  onProduct,
}: {
  product: InventoryProduct;
  onProduct: (productId: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full justify-start gap-[9px] rounded-none border-0 border-b border-line bg-transparent px-3.5 py-2 text-left font-normal shadow-none last:border-b-0"
      onClick={() => onProduct(product.productId)}
    >
      <Text className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink">
        {product.name}
      </Text>
      <Text
        className={
          units(product) === 0
            ? "rounded-full bg-rose-bg px-[9px] py-[3px] text-[11px] font-bold text-rose"
            : "rounded-full bg-gray-pill px-[9px] py-[3px] text-[11px] font-bold text-muted"
        }
      >
        {units(product)}
      </Text>
    </Button>
  );
}
