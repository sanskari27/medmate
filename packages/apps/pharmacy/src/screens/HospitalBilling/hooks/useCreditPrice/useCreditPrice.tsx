import { useMemo } from "react";
import { usePharma } from "@/store/slices/session";
import { creditPriceOf } from "@/utils/calculations/hospitalAccount";

export function useCreditPrice() {
  const { inventory, hospitalAccount, hospitalPriceRules } = usePharma();
  return useMemo(
    () => (id: string) => {
      const p = inventory.find((x) => x.id === id);
      return p ? creditPriceOf(p, hospitalAccount, hospitalPriceRules) : 0;
    },
    [inventory, hospitalAccount, hospitalPriceRules],
  );
}
