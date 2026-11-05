import type { Supplier } from "@/utils";

export type DistributorModalProps = {
    init?: Supplier;
    onClose: () => void;
    onSave: (d: Omit<Supplier, "id">) => void;
};
