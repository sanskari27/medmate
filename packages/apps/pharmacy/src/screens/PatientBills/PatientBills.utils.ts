import { computeInvoice, type Sale } from "@/utils";

export const billTotal = (sale: Sale) => computeInvoice(sale.items, sale.discount).payable;
