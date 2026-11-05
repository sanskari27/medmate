import type { hospitalAging } from "@/utils/calculations/hospitalAccount";

export type AccountTabProps = {
    outstanding: number;
    supplied: number;
    returns: number;
    received: number;
    aging: ReturnType<typeof hospitalAging>;
    onRemind: () => void;
};
