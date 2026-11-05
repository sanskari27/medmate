export type ProductSearchProps = {
  scan: string;
  searchQuery: string;
  onScanChange: (value: string) => void;
  onScanSubmit: () => void;
  onSearchChange: (value: string) => void;
};
