import { useId, type ChangeEvent } from "react";
import { FilterField } from "../FilterField";
import { Input } from "../Input";

export function DateFields({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const id = useId();
  return (
    <>
      <FilterField label="From" htmlFor={`${id}-from`}>
        <Input
          id={`${id}-from`}
          aria-label="From"
          type="date"
          value={from}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onFrom(event.target.value)}
          className="h-10 w-[160px]"
        />
      </FilterField>
      <FilterField label="To" htmlFor={`${id}-to`}>
        <Input
          id={`${id}-to`}
          aria-label="To"
          type="date"
          value={to}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onTo(event.target.value)}
          className="h-10 w-[160px]"
        />
      </FilterField>
    </>
  );
}
