import { Chip } from "@/components/molecules/Chip";
import { CategoryIcon } from "@/components/molecules/EntityMark";
import { Stack } from "@/components/atoms/Stack";
import type { CategoryFilterProps, CategoryOption } from "./CategoryFilter.types";

function CategoryChip({
  category,
  selected,
  onSelect,
}: {
  category: CategoryOption;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  function selectCategory() {
    onSelect(category.key);
  }
  return (
    <Chip
      selected={selected}
      className={`max-[767px]:min-h-10${selected ? " border-dark bg-dark text-white hover:bg-dark" : ""}`}
      onClick={selectCategory}
    >
      <CategoryIcon k={category.key} size={15} /> {category.label}
    </Chip>
  );
}

export function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  function selectAll() {
    onSelect("all");
  }
  function renderCategory(category: CategoryOption) {
    return (
      <CategoryChip
        key={category.key}
        category={category}
        selected={selectedCategory === category.key}
        onSelect={onSelect}
      />
    );
  }
  const allSelected = selectedCategory === "all";
  return (
    <Stack direction="row" wrap gap={2} className="mb-3.5">
      <Chip
        selected={allSelected}
        className={`max-[767px]:min-h-10${allSelected ? " border-dark bg-dark text-white hover:bg-dark" : ""}`}
        onClick={selectAll}
      >
        All
      </Chip>
      {categories.map(renderCategory)}
    </Stack>
  );
}
