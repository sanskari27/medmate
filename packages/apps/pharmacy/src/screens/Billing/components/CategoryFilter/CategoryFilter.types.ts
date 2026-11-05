export type CategoryOption = { key: string; label: string };

export type CategoryFilterProps = {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelect: (key: string) => void;
};
