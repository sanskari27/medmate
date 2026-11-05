import type { InvProduct } from "@/utils";

export type MedicineDetailModalProps = {
    p: InvProduct;
    now: number;
    onClose: () => void;
};
