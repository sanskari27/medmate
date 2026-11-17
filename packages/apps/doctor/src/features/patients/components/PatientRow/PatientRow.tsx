import { Box, Text as TextComponent, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { ClinicPatient } from "@/types";

type PatientRowProps = {
  patient: ClinicPatient;
  hasClinicalRead: boolean;
  hasBillingRead: boolean;
};

const STATUS_TONES: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  waiting: "warning",
  "with-doctor": "info",
  seen: "success",
  inactive: "default",
};

export function PatientRow({ patient, hasClinicalRead, hasBillingRead }: PatientRowProps) {
  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="py-4">
        <Box className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <Box className="grid gap-2 sm:grid-cols-3">
            <Box className="flex items-center gap-3 min-w-0">
              <Box className="grid h-10 w-10 place-items-center rounded-control bg-surface-3">
                <Icon name="users" size={18} className="text-ink-2" />
              </Box>
              <Box className="min-w-0">
                <TextComponent className="text-[14px] font-bold text-ink truncate">
                  {patient.name}
                </TextComponent>
                <TextComponent className="text-[12px] text-muted">
                  {patient.age} yrs · {patient.sex}
                </TextComponent>
              </Box>
            </Box>
            <Box className="flex items-center gap-2 text-[13px] text-muted">
              <Icon name="phone" size={16} />
              <TextComponent className="font-mono">{patient.phone}</TextComponent>
            </Box>
            <Box className="flex items-center gap-2">
              <Badge tone={STATUS_TONES[patient.status] ?? "default"}>
                {patient.status.replace("-", " ")}
              </Badge>
            </Box>
          </Box>

          <Box className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0 sm:justify-end">
            {hasClinicalRead &&
              splitList(patient.conditions).map((condition) => (
                <Badge key={`condition-${condition}`} tone="info" className="gap-1">
                  <Icon name="lab" size={12} />
                  {condition}
                </Badge>
              ))}
            {hasClinicalRead &&
              splitList(patient.allergies).map((allergy) => (
                <Badge key={`allergy-${allergy}`} tone="danger" className="gap-1">
                  <Icon name="alert" size={12} />
                  {allergy}
                </Badge>
              ))}
            {hasClinicalRead && patient.abha && (
              <Badge tone="success" className="gap-1">
                <Icon name="check" size={12} />
                ABHA
              </Badge>
            )}
            {hasClinicalRead && patient.lastSeen && (
              <TextComponent className="text-[11px] text-muted">
                Last seen by {patient.lastSeen}
              </TextComponent>
            )}
            {hasBillingRead && patient.due !== undefined && patient.due > 0 && (
              <Badge tone="danger" className="gap-1">
                <Icon name="rupee" size={12} />₹{patient.due.toLocaleString("en-IN")}
              </Badge>
            )}
          </Box>
        </Box>
      </td>
    </tr>
  );
}

/** The API sends conditions and allergies as one comma separated list. */
function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
