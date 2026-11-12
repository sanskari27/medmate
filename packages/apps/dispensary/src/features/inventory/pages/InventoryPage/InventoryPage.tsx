import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { useListPurchasesQuery } from "@/features/purchases";
import {
  cost,
  expiringCost,
  inr,
  inventoryAccess,
  inventoryCsv,
  isExpiring,
  isLow,
  isOut,
  matches,
  nearestExpiry,
  retail,
  units,
  type InventoryFilter,
  type InventoryProduct,
} from "../../model";
import { useListInventoryQuery, useUpdateReorderMutation } from "../../inventory.api";

const FILTERS: { id: InventoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low", label: "Low stock" },
  { id: "out", label: "Out of stock" },
  { id: "expiring", label: "Expiring" },
];

export function InventoryPage() {
  const navigate = useNavigate();
  const { session } = useAuthState();
  const access = inventoryAccess(session?.account.pharmacyRole, session?.account.permissions);
  const list = useListInventoryQuery();
  const [updateReorder, updateState] = useUpdateReorderMutation();
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const products = list.data?.products ?? [];
  const visible = products.filter((product) => matches(product, filter, query));
  const stockUnits = products.reduce((sum, product) => sum + units(product), 0);
  const outCount = products.filter(isOut).length;

  if (list.isLoading) return <Text className="text-[13.5px] text-muted">Loading inventory</Text>;

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-4 flex items-start justify-between gap-4">
        <Box>
          <Heading level={2}>Inventory</Heading>
          <Text className="text-[13px] text-muted">Stock, batches and expiry</Text>
        </Box>
        <Box className="flex gap-2">
          {access.export ? (
            <Button type="button" variant="ghost" onClick={() => download(inventoryCsv(visible))}>
              Export
            </Button>
          ) : null}
          {access.purchase ? (
            <Button type="button" onClick={() => navigate("/purchases?new=1")}>
              Purchase
            </Button>
          ) : null}
        </Box>
      </Box>
      <Box className="mb-4 grid gap-3 md:grid-cols-5">
        <Stat label="Total SKUs" value={String(products.length)} hint={`${stockUnits} units`} />
        <Stat
          label="Stock value at cost"
          value={inr(products.reduce((sum, product) => sum + cost(product), 0))}
        />
        <Stat
          label="Retail value at MRP"
          value={inr(products.reduce((sum, product) => sum + retail(product), 0))}
        />
        <Stat
          label="Low and out of stock"
          value={String(products.filter((product) => isLow(product) || isOut(product)).length)}
          hint={`${outCount} out of stock`}
          onClick={() => setFilter("low")}
        />
        <Stat
          label="Expiring within 4 months"
          value={String(products.filter((product) => isExpiring(product)).length)}
          hint={inr(products.reduce((sum, product) => sum + expiringCost(product), 0))}
          onClick={() => setFilter("expiring")}
        />
      </Box>
      <Box className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={filter === item.id ? "primary" : "ghost"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
        <Input
          aria-label="Search inventory"
          placeholder="Search by name, composition, manufacturer…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Box>
      <table className="w-full border-separate border-spacing-0 text-[13.5px]">
        <thead>
          <tr>
            {["Product", "Type", "Batches", "Expiry", "Stock", "MRP", "Value"].map((heading) => (
              <th
                key={heading}
                className="bg-wash-2 px-3 py-2 text-left text-[11px] font-bold text-muted uppercase"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((product) => {
            const shown = product.batches.filter((batch) => batch.qty > 0);
            return (
              <tr key={product.productId}>
                <td className="border-t border-line px-3 py-2">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setSelected(product.productId)}
                  >
                    {product.name}
                  </Button>
                </td>
                <td className="border-t border-line px-3 py-2">{product.type}</td>
                <td className="border-t border-line px-3 py-2">{shown.length}</td>
                <td className="border-t border-line px-3 py-2">{nearestExpiry(product) ?? "—"}</td>
                <td className="border-t border-line px-3 py-2">{units(product)}</td>
                <td className="border-t border-line px-3 py-2">
                  {shown[0] ? inr(Number(shown[0].mrp)) : "—"}
                </td>
                <td className="border-t border-line px-3 py-2 font-bold">{inr(cost(product))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {selected ? (
        <ProductDialog
          product={products.find((product) => product.productId === selected) ?? null}
          canUpdate={access.update}
          saving={updateState.isLoading}
          onClose={() => setSelected(null)}
          onSave={async (reorderLevel) => {
            const result = await updateReorder({ productId: selected, reorderLevel });
            if ("error" in result)
              return problemMessage(result.error, "Could not update the reorder level");
            return null;
          }}
        />
      ) : null}
    </Box>
  );
}

function Stat({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <Box className="rounded-md border border-line bg-paper p-4" onClick={onClick}>
      <Text className="text-[11px] font-bold text-muted uppercase">{label}</Text>
      <Text className="text-[22px] font-bold text-dark">{value}</Text>
      {hint ? <Text className="text-[12px] text-muted">{hint}</Text> : null}
    </Box>
  );
}

function ProductDialog({
  product,
  canUpdate,
  saving,
  onClose,
  onSave,
}: {
  product: InventoryProduct | null;
  canUpdate: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (reorderLevel: number) => Promise<string | null>;
}) {
  const navigate = useNavigate();
  const history = useListPurchasesQuery(product?.productId, { skip: !product });
  const [tab, setTab] = useState<"details" | "batches">("details");
  const [level, setLevel] = useState(String(product?.reorderLevel ?? ""));
  const [error, setError] = useState<string | null>(null);
  const batches = useMemo(
    () => (product?.batches ?? []).filter((batch) => batch.qty > 0),
    [product],
  );
  if (!product) return null;
  return (
    <Box className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Box
        role="dialog"
        aria-label={product.name}
        className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-md border border-line bg-paper p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <Heading level={3}>{product.name}</Heading>
        <Box className="my-3 flex gap-2">
          <Button
            type="button"
            variant={tab === "details" ? "primary" : "ghost"}
            onClick={() => setTab("details")}
          >
            Details
          </Button>
          <Button
            type="button"
            variant={tab === "batches" ? "primary" : "ghost"}
            onClick={() => setTab("batches")}
          >
            Batches
          </Button>
        </Box>
        {tab === "details" ? (
          <Box>
            <Text>Marketer {product.marketer ?? "—"}</Text>
            <Text>Composition {product.composition ?? "—"}</Text>
            <Text>Form {product.form ?? "—"}</Text>
            <Text>Pack {product.pack ?? "—"}</Text>
            {canUpdate ? (
              <label className="mt-3 block">
                <Text>Reorder level</Text>
                <Input
                  aria-label="Reorder level"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                />
                <Button
                  type="button"
                  className="mt-2"
                  disabled={saving || !/^\d+$/.test(level)}
                  onClick={() => void onSave(Number(level)).then(setError)}
                >
                  Save reorder level
                </Button>
              </label>
            ) : null}
          </Box>
        ) : (
          <Box>
            {batches.map((batch) => (
              <Text key={batch.batchNo}>
                {batch.batchNo} · {batch.expiry} · {batch.qty} · {inr(Number(batch.rate))} ·{" "}
                {inr(Number(batch.mrp))}
              </Text>
            ))}
          </Box>
        )}
        <Heading level={4} className="mt-4">
          Purchase history
        </Heading>
        {(history.data?.purchases ?? []).map((row) => (
          <Button
            key={row.id}
            type="button"
            variant="link"
            onClick={() => navigate(`/purchases/${row.id}`)}
          >
            {row.id}
          </Button>
        ))}
        {error ? <Text className="mt-2 text-rose">{error}</Text> : null}
        <Button type="button" variant="ghost" className="mt-4" aria-label="Close" onClick={onClose}>
          Close
        </Button>
      </Box>
    </Box>
  );
}

function download(csv: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventory.csv";
  link.click();
  URL.revokeObjectURL(url);
}
