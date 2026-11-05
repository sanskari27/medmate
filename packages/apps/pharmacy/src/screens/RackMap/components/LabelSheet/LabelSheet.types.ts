import type { InvProduct } from "@/utils";

export type LabelSheetProps = {
  groups: {
    code: string;
    zone: string;
    items: InvProduct[];
  }[];
  onClose: () => void;
};
