import { useEffect, useState, type ReactNode } from "react";
import type { InventoryProduct } from "@/features/inventory";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Text } from "@/components/ui/Text";
import { IconCheck } from "@/components/ui/Icon";
import { composeRack, hasLocation, locationCodes, matchesRack, units } from "../model";

export function AssignLocations({
  products,
  query,
  canUpdate,
  fault,
  onSave,
  onBulk,
}: {
  products: InventoryProduct[];
  query: string;
  canUpdate: boolean;
  fault: string;
  onSave: (productId: string, rack: string) => Promise<string | null>;
  onBulk: (ids: string[], rack: string) => Promise<string | null>;
}) {
  const [onlyUnset, setOnlyUnset] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");
  const [bin, setBin] = useState("");
  const [notice, setNotice] = useState("");
  const code = composeRack(rack, shelf, bin);
  const list = products.filter((product) => {
    if (onlyUnset && hasLocation(product)) return false;
    return matchesRack(product, query);
  });
  const allShown = list.length > 0 && list.every((product) => selected.has(product.productId));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allShown) list.forEach((product) => next.delete(product.productId));
      else list.forEach((product) => next.add(product.productId));
      return next;
    });
  }

  async function assignSelected() {
    if (!code || selected.size === 0) return;
    const problem = await onBulk([...selected], code);
    setNotice(problem ?? `${selected.size} medicine${selected.size === 1 ? "" : "s"} → ${code}`);
    if (!problem) setSelected(new Set());
  }

  return (
    <Box>
      {canUpdate ? (
        <Box className="mb-3.5 rounded-md border border-line bg-paper p-[18px] shadow-sm">
          <Box className="flex flex-wrap items-end gap-4">
            <Field label="Rack">
              <Input
                aria-label="Rack"
                value={rack}
                maxLength={4}
                placeholder="A"
                onChange={(event) => setRack(event.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Shelf">
              <Input
                aria-label="Shelf"
                value={shelf}
                maxLength={3}
                placeholder="3"
                onChange={(event) => setShelf(event.target.value)}
              />
            </Field>
            <Field label="Bin">
              <Input
                aria-label="Bin"
                value={bin}
                maxLength={4}
                placeholder="12"
                onChange={(event) => setBin(event.target.value)}
              />
            </Field>
            <Box className="pb-0.5">
              <Text className="text-[11px] text-muted">Location code</Text>
              <Text className="font-mono text-[22px] leading-none font-extrabold tracking-[0.04em] text-green">
                {code || "—"}
              </Text>
            </Box>
            <Button
              type="button"
              disabled={!code || selected.size === 0}
              onClick={() => void assignSelected()}
            >
              <IconCheck size={16} /> Assign to {selected.size || ""} selected
            </Button>
          </Box>
          <Text className="mt-2.5 text-[11.5px] text-muted">
            Read like an address: Rack (cupboard A, B, C…) → Shelf (top = 1) → Bin (slot left to
            right). Keep the on-screen code identical to the printed shelf label. Tip: keep
            fast-movers in racks nearest the counter.
          </Text>
        </Box>
      ) : null}
      <Box className="mb-2 flex items-center justify-between gap-2.5">
        <Label className="flex items-center gap-1.5 text-[13px] font-normal tracking-normal">
          <input
            type="checkbox"
            className="h-4 w-4 accent-mid"
            checked={onlyUnset}
            onChange={(event) => setOnlyUnset(event.target.checked)}
          />
          Show only medicines with no location
        </Label>
        <Text className="text-[12.5px] text-muted">
          {list.length} shown · {selected.size} selected
        </Text>
      </Box>
      {fault ? <Text className="mb-2 text-[12.5px] text-rose">{fault}</Text> : null}
      {notice ? <Text className="mb-2 text-[12.5px] text-muted">{notice}</Text> : null}
      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px] [&_tbody_tr:last-child_td]:border-b-0">
            <thead>
              <tr>
                <th className={head}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-mid"
                    checked={allShown}
                    aria-label="Select all shown"
                    onChange={toggleAll}
                  />
                </th>
                {["Medicine", "Stock", "Current location", "Set location"].map((heading) => (
                  <th key={heading} className={head}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-9 text-center text-[13px] text-muted">
                    {onlyUnset
                      ? "Every medicine has a location. Nice and tidy!"
                      : "No medicines match."}
                  </td>
                </tr>
              ) : (
                list.map((product) => (
                  <AssignRow
                    key={product.productId}
                    product={product}
                    checked={selected.has(product.productId)}
                    fillCode={code}
                    canUpdate={canUpdate}
                    onToggle={() => toggle(product.productId)}
                    onSave={async (value) => {
                      const problem = await onSave(product.productId, value);
                      setNotice(problem ?? `${product.name} → ${value}`);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </Box>
      </Box>
    </Box>
  );
}

const head =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase";
const cell = "border-b border-line px-3.5 py-[11px] align-middle text-[13px] text-ink-2";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box className="flex w-[90px] flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </Box>
  );
}

function AssignRow({
  product,
  checked,
  fillCode,
  canUpdate,
  onToggle,
  onSave,
}: {
  product: InventoryProduct;
  checked: boolean;
  fillCode: string;
  canUpdate: boolean;
  onToggle: () => void;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(product.rack ?? "");
  useEffect(() => {
    setValue(product.rack ?? "");
  }, [product.rack]);
  const dirty = value.trim().toUpperCase() !== (product.rack ?? "").trim().toUpperCase();
  return (
    <tr>
      <td className={cell}>
        <input
          type="checkbox"
          className="h-4 w-4 accent-mid"
          checked={checked}
          aria-label={`Select ${product.name}`}
          onChange={onToggle}
        />
      </td>
      <td className={cell}>
        <Text className="text-[13px] font-bold text-ink">{product.name}</Text>
        <Text className="text-[11.5px] text-muted">{product.composition || "—"}</Text>
      </td>
      <td className={cell}>
        <Text
          className={
            units(product) === 0
              ? "rounded-full bg-rose-bg px-[9px] py-[3px] text-[11px] font-bold text-rose"
              : "rounded-full bg-gray-pill px-[9px] py-[3px] text-[11px] font-bold text-muted"
          }
        >
          {units(product)}
        </Text>
      </td>
      <td className={`${cell} font-mono`}>
        {locationCodes(product).length ? locationCodes(product).join(" · ") : "—"}
      </td>
      <td className={cell}>
        {canUpdate ? (
          <Box className="flex items-center gap-1.5">
            <Input
              aria-label={`Location for ${product.name}`}
              value={value}
              placeholder={fillCode || "A3-12"}
              onChange={(event) => setValue(event.target.value.toUpperCase())}
              className="w-[96px] font-mono"
            />
            {fillCode && value.trim().toUpperCase() !== fillCode ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Use ${fillCode}`}
                onClick={() => setValue(fillCode)}
              >
                ←
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={!dirty || !value.trim()}
              onClick={() => void onSave(value.trim())}
            >
              Save
            </Button>
          </Box>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}
