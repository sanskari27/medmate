import type { SaleSource } from "@/utils";
import type { SourceCard } from "../../SalesRegister.utils";

export type SourceCardsProps = {
  cards: SourceCard[];
  selected: "all" | SaleSource;
  onSelect: (source: SaleSource) => void;
};
