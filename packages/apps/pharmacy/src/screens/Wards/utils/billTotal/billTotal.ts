import { computeInvoice, Sale } from "@/utils";

export const billTotal = (s: Sale) => computeInvoice(s.items, s.discount).payable;
