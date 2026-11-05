import type { InvProduct } from "@/utils";

export type AssignLocationsProps = {
    inventory: InvProduct[];
    q: string;
    setProductLocation: (id: string, rack: string, rackAlt?: string) => Promise<unknown>;
    bulkAssignLocation: (ids: string[], rack: string) => Promise<unknown>;
    toast: (m: string) => void;
};
