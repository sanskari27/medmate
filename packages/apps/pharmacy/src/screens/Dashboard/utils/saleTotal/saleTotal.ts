import { computeInvoice, Sale } from "@/utils";

export const saleTotal = (s: Sale) => computeInvoice(s.items, s.discount).payable;
