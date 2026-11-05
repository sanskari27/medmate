import type { SupplyEntry } from "@/utils";

export type SupplyModalProps = {
  init?: SupplyEntry;
  onClose: () => void;
  onSave: (d: Omit<SupplyEntry, "id">) => void;
};
