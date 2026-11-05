import { InvProduct } from "@/utils";
import { WardIndent } from "@/utils/calculations/hospital";

import { norm } from "@/screens/HospitalBilling/utils/norm";

export function indentToRows(
  indent: WardIndent,
  inventory: InvProduct[],
  cp: (id: string) => number,
) {
  return indent.items
    .map((it) => {
      const p = inventory.find((pp) => {
        const a = norm(pp.name),
          b = norm(it.name);
        return a === b || b.includes(a) || a.includes(b);
      });
      return p ? { productId: p.id, qty: it.qty, price: cp(p.id) } : null;
    })
    .filter(Boolean) as { productId: string; qty: number; price: number }[];
}
