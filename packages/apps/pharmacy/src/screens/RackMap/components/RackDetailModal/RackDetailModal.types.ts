import type { InvProduct } from "@/utils";

export type RackDetailModalProps = {
    code: string;
    items: InvProduct[];
    inventory: InvProduct[];
    onClose: () => void;
    onAdd: (id: string) => void;
    onRemoveItem: (id: string) => void;
    onDeleteRack: () => void;
    onMed: (id: string) => void;
};
