import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { CardLine, FitText } from "@/components/ui/FitText";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { problemMessage } from "@/features/authentication";
import { cn } from "@/utils/className";
import { UserDialog } from "../../components/UserDialog";
import { accessLabel, type StaffDraft, type StaffMember } from "../../catalog";
import { useCreateStaffMutation, useListStaffQuery, useUpdateStaffMutation } from "../../users.api";

export function UsersPage() {
  const staff = useListStaffQuery();
  const [createStaff, created] = useCreateStaffMutation();
  const [updateStaff, updated] = useUpdateStaffMutation();
  const [editing, setEditing] = useState<StaffMember | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const rows = staff.data ?? [];
  const active = rows.filter((member) => !member.disabled).length;
  const withPin = rows.filter((member) => member.pinSet).length;

  function closeDialog() {
    setEditing(null);
    setError(null);
    setRevealedPin(null);
  }

  async function save(draft: StaffDraft) {
    setError(null);
    const member = editing !== "new" && editing ? editing : null;
    const result = member
      ? await updateStaff({
          id: member.id,
          body: {
            displayName: draft.displayName,
            phone: draft.phone,
            permissions: draft.permissions,
            ...(draft.pin ? { pin: draft.pin } : {}),
          },
        })
      : await createStaff(draft);
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not save this user"));
      return;
    }
    if (draft.pin) setRevealedPin(draft.pin);
    else closeDialog();
  }

  async function setDisabled(member: StaffMember, disabled: boolean) {
    await updateStaff({ id: member.id, body: { disabled } });
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-[22px] grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <StatCard label="Team members" value={String(rows.length)} hint={`${active} active`} />
        <StatCard label="Login enabled" value={String(withPin)} hint="have a PIN" />
      </Box>
      <Stack direction="row" align="center" className="mb-4 gap-2">
        <Heading level={2} className="text-[16px]">
          Staff & access control
        </Heading>
        <Box className="flex-1" />
        <Button
          type="button"
          onClick={() => {
            setError(null);
            setRevealedPin(null);
            setEditing("new");
          }}
        >
          Add user
        </Button>
      </Stack>
      {staff.isError ? (
        <Text className="mb-3 text-[12.5px] font-bold text-rose">
          {problemMessage(staff.error, "Could not load staff")}
        </Text>
      ) : null}
      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {["Member", "Login", "Access", "Status", ""].map((label) => (
                  <th
                    key={label || "actions"}
                    className="bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((member) => (
                <tr key={member.id} className="border-t border-line">
                  <td className="px-3.5 py-3 font-bold text-ink">{member.displayName}</td>
                  <td className="px-3.5 py-3 text-ink-2">{member.phone}</td>
                  <td className="px-3.5 py-3 text-ink-2">{accessLabel(member.permissions)}</td>
                  <td className="px-3.5 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!member.disabled}
                      aria-label={`Status for ${member.displayName}`}
                      onClick={() => void setDisabled(member, !member.disabled)}
                      className={cn(
                        "relative h-[22px] w-[38px] shrink-0 rounded-[11px] border-0 p-0 after:absolute after:top-0.5 after:left-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:bg-paper after:shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:transition after:content-['']",
                        member.disabled ? "bg-[#cddcd3]" : "bg-mid after:translate-x-4",
                      )}
                    />
                  </td>
                  <td className="px-3.5 py-3">
                    <Stack direction="row" className="justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${member.displayName}`}
                        onClick={() => {
                          setError(null);
                          setRevealedPin(null);
                          setEditing(member);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Disable ${member.displayName}`}
                        disabled={member.disabled || updated.isLoading}
                        onClick={() => void setDisabled(member, true)}
                      >
                        Disable
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>
      {editing ? (
        <UserDialog
          member={editing === "new" ? null : editing}
          saving={created.isLoading || updated.isLoading}
          error={error}
          revealedPin={revealedPin}
          onClose={closeDialog}
          onSave={(draft) => void save(draft)}
        />
      ) : null}
    </Box>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Box className="min-w-0 max-w-full overflow-hidden rounded-md border border-line bg-paper p-4 shadow-sm">
      <CardLine className="text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
        {label}
      </CardLine>
      <FitText className="mt-1 font-display text-[26px] font-extrabold text-ink">{value}</FitText>
      <CardLine className="text-[12px] text-muted">{hint}</CardLine>
    </Box>
  );
}
