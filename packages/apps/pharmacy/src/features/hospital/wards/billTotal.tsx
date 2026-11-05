import { computeInvoice, Sale } from "@/domain";

export const billTotal = (s: Sale) => computeInvoice(s.items, s.discount).payable;
