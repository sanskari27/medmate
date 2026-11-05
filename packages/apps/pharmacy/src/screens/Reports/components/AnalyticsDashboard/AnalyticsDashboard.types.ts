type Tab = "overview" | "sales" | "products" | "accounts";

export type AnalyticsDashboardProps = {
    initialTab: Tab;
    onBack: () => void;
};
