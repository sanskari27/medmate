import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  Supplier, SupplyEntry, InvProduct, inr, inr2, allottedSupplierId,
  bestSupplyFor, effectiveSupplyPrice, schemeLabel, isDevice, mrpOf, catLabel, isValidGstin,
} from "@/domain";
import { IconPlus, IconX, IconTrash, IconEdit, IconTruck, IconMail, IconBox, IconCard, IconUsers, IconPhone, IconReceipt, IconRefresh, IconStar, IconScale, IconCash, IconTag, IconCheck } from "@/components/Icon";
import { Thumb } from "@/components/bits";

type Tab = "directory" | "supply" | "compare";

const BLANK_SUP: Omit<Supplier, "id"> = {
  name: "", gstin: "", phone: "", contactPerson: "", email: "", address: "",
  city: "", state: "Karnataka", dlNo: "", paymentTerms: "30 days credit", outstanding: 0, active: true,
};

export const multiSourceCount = (list: SupplyEntry[]) => {
  const m: Record<string, number> = {};
  list.forEach((e) => { m[e.productId] = (m[e.productId] || 0) + 1; });
  return Object.values(m).filter((n) => n > 1).length;
};
