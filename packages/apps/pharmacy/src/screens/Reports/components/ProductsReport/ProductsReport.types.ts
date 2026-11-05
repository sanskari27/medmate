export type ProductsReportProps = {
    enriched: any[];
    inventory: any[];
    costOf: (id: string) => number;
};
