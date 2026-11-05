import type { SaleSource } from "@/utils";

export type SourceOption = { key: SaleSource; short: string };
export type WardOption = { id: string; name: string; code: string };

export type SaleSourcePickerProps = {
  sources: SourceOption[];
  source: SaleSource;
  ward: string;
  wards: WardOption[];
  patientId: string;
  onSource: (source: SaleSource) => void;
  onWard: (ward: string) => void;
  onPatientId: (patientId: string) => void;
};
