import { useMemo } from "react";
import { useAppSelector } from "@/hooks";
import { creditPriceOf } from "@/utils/calculations/hospitalAccount";

export function useCreditPrice() {
  const inventory = useAppSelector((state) => state.inventory.inventory);
  const hospitalAccount = useAppSelector((state) => state.hospital.hospitalAccount);
  const hospitalPriceRules = useAppSelector((state) => state.hospital.hospitalPriceRules);
  return useMemo(
    () => (productId: string) => {
      const product = inventory.find((item) => item.id === productId);
      return product ? creditPriceOf(product, hospitalAccount, hospitalPriceRules) : 0;
    },
    [inventory, hospitalAccount, hospitalPriceRules],
  );
}
