import { useState } from "react";
import type { InventoryProduct } from "@/features/inventory";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Text } from "@/components/ui/Text";
import { IconX } from "@/components/ui/Icon";
import { locationCodes, units } from "../model";

export function RackDialog({
  code,
  items,
  products,
  canUpdate,
  fault,
  onClose,
  onAdd,
  onProduct,
}: {
  code: string;
  items: InventoryProduct[];
  products: InventoryProduct[];
  canUpdate: boolean;
  fault: string;
  onClose: () => void;
  onAdd: (productId: string) => void;
  onProduct: (productId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const text = query.trim().toLowerCase();
  const here = new Set(items.map((product) => product.productId));
  const results = products
    .filter((product) => {
      if (here.has(product.productId)) return false;
      if (!text) return false;
      const haystack =
        `${product.name} ${product.composition ?? ""} ${product.marketer ?? ""}`.toLowerCase();
      return haystack.includes(text);
    })
    .slice(0, 8);

  return (
    <Box
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={`Rack ${code}`}
        className="flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Box className="flex items-center justify-between border-b border-line px-5 py-4">
          <Heading level={3} className="text-[17px]">
            Rack <span className="font-mono">{code}</span>
          </Heading>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="overflow-y-auto p-5">
          {canUpdate ? (
            <Box className="mb-3.5">
              <Label htmlFor="rack-add">Add medicine to this rack</Label>
              <Input
                id="rack-add"
                aria-label="Search medicine by name, salt, brand"
                placeholder="Search medicine by name, salt, brand…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-1.5"
              />
              {text ? (
                <Box className="mt-2 rounded-md border border-line-2 bg-wash-2 p-2">
                  {results.length === 0 ? (
                    <Text className="px-3 py-2.5 text-[12.5px] text-muted">
                      No other medicine matches “{query}”.
                    </Text>
                  ) : (
                    results.map((product) => (
                      <Button
                        key={product.productId}
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start rounded-sm border-0 bg-transparent px-[11px] py-2 text-left font-normal shadow-none"
                        onClick={() => onAdd(product.productId)}
                      >
                        <Text className="text-[13px] font-bold text-dark">{product.name}</Text>
                        <Text className="text-[13px] font-normal text-muted">
                          {" "}
                          · {product.composition || product.marketer || "—"} · {units(product)} in
                          stock
                          {locationCodes(product).length
                            ? ` · now at ${locationCodes(product).join(" · ")}`
                            : ""}
                        </Text>
                      </Button>
                    ))
                  )}
                </Box>
              ) : null}
            </Box>
          ) : null}
          <Box className="mb-1.5 flex items-center justify-between">
            <Text className="text-[13px] font-bold text-ink">In this rack</Text>
            <Text className="text-[12px] text-muted">
              {items.length} item{items.length === 1 ? "" : "s"}
            </Text>
          </Box>
          {fault ? <Text className="mb-2 text-[12.5px] text-rose">{fault}</Text> : null}
          {items.length === 0 ? (
            <Text className="px-2.5 py-5 text-center text-[13px] text-muted">
              No medicines here yet. Search above to add some.
            </Text>
          ) : (
            <Box className="flex max-h-[320px] flex-col overflow-y-auto rounded-md border border-line">
              {items.map((product) => (
                <Button
                  key={product.productId}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-between rounded-none border-0 border-b border-line bg-transparent px-3.5 py-2 text-left font-normal shadow-none last:border-b-0"
                  onClick={() => onProduct(product.productId)}
                >
                  <Text className="truncate text-[12.5px] font-bold text-ink">
                    {product.name}
                    <Text className="text-[11px] font-normal text-muted">
                      {" "}
                      · {product.composition || "—"}
                    </Text>
                  </Text>
                  <Text className="rounded-full bg-gray-pill px-[9px] py-[3px] text-[11px] font-bold text-muted">
                    {units(product)}
                  </Text>
                </Button>
              ))}
            </Box>
          )}
        </Box>
        <Box className="flex justify-end border-t border-line px-5 py-3.5">
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
