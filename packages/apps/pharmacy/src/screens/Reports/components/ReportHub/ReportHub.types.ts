import type { ReportMeta } from "@/utils/calculations/reportCatalog";

export type ReportHubProps = {
    onOpen: (m: ReportMeta) => void;
};
