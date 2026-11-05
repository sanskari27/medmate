import type { InvProduct } from "@/utils";

export type AssignRowProps = {
  p: InvProduct;
  checked: boolean;
  onToggle: () => void;
  onSave: (v: string) => void;
  fillCode: string;
};
