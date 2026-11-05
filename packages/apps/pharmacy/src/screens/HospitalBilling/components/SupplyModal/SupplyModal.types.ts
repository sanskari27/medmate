export type SupplyModalProps = {
    mode: "issue" | "return";
    onClose: () => void;
    prefillIndentId?: string | null;
};
