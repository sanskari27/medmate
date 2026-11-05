import type { ReactNode } from "react";
import type { PayMode } from "@/utils";

export type PayOption = {
  m: PayMode;
  Ic: (props: { size?: number }) => ReactNode;
};

export type PayModePickerProps = {
  options: PayOption[];
  selected: PayMode;
  onSelect: (mode: PayMode) => void;
};
