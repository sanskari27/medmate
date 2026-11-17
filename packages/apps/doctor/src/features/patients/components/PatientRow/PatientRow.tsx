import { Box, Text as TextComponent, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { ClinicPatient } from "@/types";

export function PatientRow({ patient, hasClinicalRead, hasBillingRead }: { patient: ClinicPatient; hasClinicalRead: boolean; hasBillingRead: boolean }) {
  const statusTones: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
    waiting: "warning",
    "with-doctor": "info",
    seen: "success",
    inactive: "default",
  };

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
                <TextComponent className="text-[14px] font-bold text-ink truncate">{patient.name}</TextComponent>
                <TextComponent className="text-[12px] text-muted">{patient.age} yrs · {patient.sex}</TextComponent>
              </Box>
            </Box>
            <Box className="flex items-center gap-2 text-[13px] text-muted">
              <Icon name="phone" size={16} />
              <TextComponent className="font-mono">{patient.phone}</TextComponent>
            </Box>
            <Box className="flex items-center gap-2">
              <Badge tone={statusTones[patient.status] ?? "default"}>
                {patient.status.replace("-", " ")}
              </Badge>
            </Box>
          </Box>

          <Box className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0 sm:justify-end">
            {hasClinicalRead && patient.conditions && (
              <Badge tone="info" className="gap-1">
                <Icon name="lab" size={12} />
                {patient.conditions}
              </Badge>
            )}
            {hasClinicalRead && patient.allergies && (
              <Badge tone="danger" className="gap-1">
                <Icon name="alert" size={12} />
                {patient.allergies}
              </Badge>
            )}
            {hasClinicalRead && patient.abha && (
              <Badge tone="success" className="gap-1">
                <Icon name="check" size={12} />
                ABHA
              </Badge>
            )}
            {hasClinicalRead && patient.lastSeen && (
              <TextComponent className="text-[11px] text-muted">Last seen {formatRelativeTime(patient.lastSeen)}</TextComponent>
            )}
            {hasBillingRead && patient.due !== undefined && patient.due > 0 && (
              <Badge tone="danger" className="gap-1">
                <Icon name="rupee" size={12} />
                ₹{patient.due.toLocaleString()}
              </Badge>
            )}
          </Box>
        </Box>
      </td>
    </tr>
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}