export type BillSummaryProps = {
  gross: number;
  taxable: number;
  totalTax: number;
  payable: number;
  discount: number;
  discountMode: "flat" | "percent";
  discountAmount: number;
  onDiscount: (value: number) => void;
  onDiscountMode: (mode: "flat" | "percent") => void;
};
