import type { InvProduct } from "@/utils";

export type RackMapProps = {
    groups: {
        code: string;
        zone: string;
        items: InvProduct[];
    }[];
    q: string;
    unassigned: InvProduct[];
    onGoAssign: () => void;
    createRack: (code: string) => Promise<boolean>;
    onOpen: (code: string) => void;
    onMed: (id: string) => void;
};
