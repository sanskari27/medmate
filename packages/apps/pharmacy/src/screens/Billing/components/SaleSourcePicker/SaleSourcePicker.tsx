import type { ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { SaleSourceIcon } from "@/components/molecules/EntityMark";
import { cn } from "@/utils/className";
import type { SaleSource } from "@/utils";
import { billingSelectClass, billingSelectStyle } from "../../Billing.utils";
import type { SaleSourcePickerProps, SourceOption, WardOption } from "./SaleSourcePicker.types";

function SourceChip({
  source,
  selected,
  onSource,
}: {
  source: SourceOption;
  selected: boolean;
  onSource: (source: SaleSource) => void;
}) {
  function selectSource() {
    onSource(source.key);
  }
  return (
    <Button
      variant="ghost"
      onClick={selectSource}
      className={cn(
        "h-auto gap-[5px] rounded-full border-[1.5px] px-2.5 py-1.5 text-[12.5px] font-bold",
        selected
          ? "border-mid bg-wash-2 text-dark hover:border-mid hover:bg-wash-2 hover:text-dark"
          : "border-line-2 bg-paper text-ink-2 hover:border-line-2 hover:bg-paper hover:text-ink-2",
      )}
    >
      <Box className="mr-[5px] inline-grid place-items-center text-muted">
        <SaleSourceIcon k={source.key} size={15} />
      </Box>
      {source.short}
    </Button>
  );
}

export function SaleSourcePicker({
  sources,
  source,
  ward,
  wards,
  patientId,
  onSource,
  onWard,
  onPatientId,
}: SaleSourcePickerProps) {
  function changeWard(event: ChangeEvent<HTMLSelectElement>) {
    onWard(event.target.value);
  }
  function changePatient(event: ChangeEvent<HTMLInputElement>) {
    onPatientId(event.target.value);
  }
  function renderSource(option: SourceOption) {
    return (
      <SourceChip
        key={option.key}
        source={option}
        selected={source === option.key}
        onSource={onSource}
      />
    );
  }
  function renderWard(item: WardOption) {
    return { value: String(item.name), label: String(item.name) + " (" + String(item.code) + ")" };
  }
  const needsPatient = source === "ward" || source === "emergency";

  return (
    <Box className="border-b border-line px-4 py-[11px]">
      <Text
        as="span"
        className="mb-2 flex items-center gap-[5px] text-[10px] font-extrabold tracking-[0.07em] text-faint uppercase"
      >
        Sale source{" "}
        <Text as="span" className="font-medium tracking-normal text-faint normal-case">
          · ward / emergency → Hospital Billing
        </Text>
      </Text>
      <Stack direction="row" wrap gap={1} className="gap-1.5">
        {sources.map(renderSource)}
      </Stack>
      {source === "ward" ? (
        <Select
          className={cn("mt-2", billingSelectClass)}
          style={billingSelectStyle}
          value={ward}
          onChange={changeWard}
          options={[{ value: "", label: "Select ward / room\u2026" }, ...wards.map(renderWard)]}
        />
      ) : null}
      {needsPatient ? (
        <Input
          className="mt-2"
          placeholder="Patient ID / UHID (for settlement)"
          value={patientId}
          onChange={changePatient}
        />
      ) : null}
    </Box>
  );
}
