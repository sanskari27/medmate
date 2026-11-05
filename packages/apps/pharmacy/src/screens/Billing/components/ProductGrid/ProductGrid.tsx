import { Box } from "@/components/atoms/Box";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconSearch } from "@/components/atoms/Icon";
import type { InvProduct } from "@/utils";
import { ProductCard } from "../ProductCard";
import type { ProductGridProps } from "./ProductGrid.types";

export function ProductGrid({
  products,
  searchQuery,
  packQty,
  looseQty,
  onAddPack,
  onAddLoose,
}: ProductGridProps) {
  function renderProduct(product: InvProduct) {
    return (
      <ProductCard
        key={product.id}
        product={product}
        packCount={packQty(product.id)}
        looseCount={looseQty(product.id)}
        onAddPack={onAddPack}
        onAddLoose={onAddLoose}
      />
    );
  }

  return (
    <Box className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
      {products.map(renderProduct)}
      {products.length === 0 ? (
        <Stack align="center" className="col-span-full px-5 py-9 text-center">
          <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
            <IconSearch size={28} />
          </Box>
          <Text variant="muted" className="max-w-[340px] text-[13px]">
            No medicines match “{searchQuery}”.
          </Text>
        </Stack>
      ) : null}
    </Box>
  );
}
