import { computeInvoice, Sale } from "@/domain";

export const saleTotal = (s: Sale) => computeInvoice(s.items, s.discount).payable;
