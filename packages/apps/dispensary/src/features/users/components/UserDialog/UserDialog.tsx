import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  PERMISSION_AREAS,
  PERMISSION_KEYS,
  nationalPhone,
  togglePermission,
  type StaffDraft,
  type StaffMember,
} from "../../catalog";

export function UserDialog({
  member,
  saving,
  error,
  revealedPin,
  onClose,
  onSave,
}: {
  member: StaffMember | null;
  saving: boolean;
  error: string | null;
  revealedPin: string | null;
  onClose: () => void;
  onSave: (draft: StaffDraft) => void;
}) {
  const [displayName, setDisplayName] = useState(member?.displayName ?? "");
  const [phone, setPhone] = useState(member ? nationalPhone(member.phone) : "");
  const [pin, setPin] = useState("");
  const [permissions, setPermissions] = useState<string[]>(member?.permissions ?? []);
  const [localError, setLocalError] = useState<string | null>(null);
  const enabled = permissions.filter((key) => PERMISSION_KEYS.includes(key)).length;
  const title = member ? `Manage ${member.displayName}` : "Add team member";

  function save() {
    const name = displayName.trim();
    if (!name || name.length > 80) {
      setLocalError("Display name is required");
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      setLocalError("Enter an Indian mobile number");
      return;
    }
    if ((member ? pin.length > 0 : true) && !/^[0-9]{4}$/.test(pin)) {
      setLocalError("PIN must be 4 digits");
      return;
    }
    setLocalError(null);
    onSave({
      displayName: name,
      phone,
      pin,
      permissions: permissions.filter((key) => PERMISSION_KEYS.includes(key)),
    });
  }

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Box className="flex items-center justify-between border-b border-line px-5 py-4">
          <Heading level={3}>{revealedPin ? "PIN set" : title}</Heading>
          <Button type="button" variant="ghost" aria-label="Close" onClick={onClose}>
            ×
          </Button>
        </Box>
        {revealedPin ? (
          <Stack className="gap-3 p-5">
            <Text className="text-[13.5px] text-muted">This PIN is shown once.</Text>
            <Text className="font-mono text-[28px] font-extrabold tracking-[0.28em] text-ink">
              {revealedPin}
            </Text>
            <Button
              type="button"
              variant="line"
              onClick={() => {
                if (navigator.clipboard) void navigator.clipboard.writeText(revealedPin);
              }}
            >
              Copy PIN
            </Button>
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </Stack>
        ) : (
          <>
            <Box className="grid gap-4 overflow-y-auto p-5">
              <Box className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Full name" htmlFor="staff-name" className="sm:col-span-2">
                  <Input
                    id="staff-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="e.g. Priya Sharma"
                  />
                </Field>
                <Field label="Mobile number" htmlFor="staff-phone">
                  <Input
                    id="staff-phone"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                    placeholder="98860 12345"
                  />
                </Field>
                <Field
                  label="4-digit PIN"
                  htmlFor="staff-pin"
                  hint={member ? "Leave blank to keep the current PIN." : undefined}
                >
                  <Input
                    id="staff-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                  />
                </Field>
              </Box>
              <Stack className="gap-3">
                <Stack direction="row" align="center" className="gap-2">
                  <Heading level={3} className="text-[15px]">
                    Permissions
                  </Heading>
                  <Box className="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPermissions([...PERMISSION_KEYS])}
                  >
                    Select all
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPermissions([])}>
                    Clear
                  </Button>
                  <Text className="text-[12.5px] font-bold text-mid">
                    {enabled} of {PERMISSION_KEYS.length} enabled
                  </Text>
                </Stack>
                {PERMISSION_AREAS.map((area) => (
                  <Stack key={area.area} className="gap-3">
                    <Text className="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
                      {area.area}
                    </Text>
                    <Box className="grid gap-3 sm:grid-cols-2">
                      {area.modules.map((module) => (
                        <Box key={module.module} className="rounded-md border border-line p-3">
                          <Text className="mb-2 text-[13px] font-bold text-ink">{module.module}</Text>
                          <Stack className="gap-1.5">
                            {module.actions.map((action) => {
                              const checked = permissions.includes(action.key);
                              return (
                                <label
                                  key={action.key}
                                  className="flex items-center gap-2 text-[13px] text-ink-2"
                                >
                                  <input
                                    type="checkbox"
                                    aria-label={`${module.module} ${action.label}`}
                                    checked={checked}
                                    onChange={() =>
                                      setPermissions((current) => togglePermission(current, action.key))
                                    }
                                  />
                                  {action.label}
                                </label>
                              );
                            })}
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  </Stack>
                ))}
              </Stack>
              {localError || error ? (
                <Text className="text-[12.5px] font-bold text-rose">{localError || error}</Text>
              ) : null}
            </Box>
            <Stack direction="row" justify="end" className="gap-2 border-t border-line px-5 py-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={save}>
                {member ? "Save changes" : "Create user"}
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}
