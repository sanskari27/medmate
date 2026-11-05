import type { Admission } from "@/utils/calculations/hospital";
import type { Sale } from "@/utils";

export type AdmissionsTableProps = {
    admissions: Admission[];
    sales: Sale[];
    now: number;
    onOpen: (id: string) => void;
};
