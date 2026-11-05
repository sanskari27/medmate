import { useState, type ChangeEvent } from "react";
import {
  ALL_PERM_KEYS,
  PERMISSION_CATALOG,
  ROLE_DEFAULT_PERMS,
  genPassword,
  suggestUsername,
  type PermGroup,
  type StaffUser,
  type UserRole,
} from "@/utils";
import { Box, Button, Checkbox, Input, Select, Stack, Text } from "@/components/atoms";
import { IconAlert, IconCheck, IconEye, IconEyeOff, IconKey, IconRefresh, IconShare, IconShield } from "@/components/atoms";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import { CopyButton } from "@/screens/Users/components/CopyButton";
import { USER_ROLES } from "@/screens/Users/Users.types";
import { groupFullyEnabled, setPermissionGroup, staffNameIsValid, togglePermission, usernameWithoutSpaces } from "@/screens/Users/Users.utils";

import type { UserModalProps } from "./UserModal.types";


export function UserModal({ user, onClose, onSave, onShare }: UserModalProps) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState<Partial<StaffUser>>(function initialForm() {
    return (
      user ?? {
        name: "",
        role: "Cashier",
        phone: "",
        email: "",
        active: true,
        pin: "0000",
        username: "",
        password: "",
        permissions: [...ROLE_DEFAULT_PERMS.Cashier],
      }
    );
  });
  const [showPassword, setShowPassword] = useState(false);

  function updateForm(patch: Partial<StaffUser>) {
    setForm(function mergeForm(current) {
      return { ...current, ...patch };
    });
  }

  const role = (form.role as UserRole) || "Cashier";
  const permissions = form.permissions ?? ROLE_DEFAULT_PERMS[role];
  const isOwner = form.role === "Owner";
  const canSave = staffNameIsValid(form.name);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    updateForm({ name: event.target.value });
  }

  function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRole = event.target.value as UserRole;
    updateForm({ role: nextRole, permissions: [...ROLE_DEFAULT_PERMS[nextRole]] });
  }

  function handlePinChange(event: ChangeEvent<HTMLInputElement>) {
    updateForm({ pin: event.target.value });
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    updateForm({ phone: event.target.value });
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    updateForm({ email: event.target.value });
  }

  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    updateForm({ username: usernameWithoutSpaces(event.target.value) });
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    updateForm({ password: event.target.value });
  }

  function handleAutoUsername() {
    updateForm({ username: suggestUsername(form.name || "user", role) });
  }

  function handleGeneratePassword() {
    updateForm({ password: genPassword(form.name) });
  }

  function handleTogglePassword() {
    setShowPassword(function flip(current) {
      return !current;
    });
  }

  function handleSelectAll() {
    updateForm({ permissions: [...ALL_PERM_KEYS] });
  }

  function handleResetDefaults() {
    updateForm({ permissions: [...ROLE_DEFAULT_PERMS[role]] });
  }

  function handleClearPermissions() {
    updateForm({ permissions: [] });
  }

  async function commit(thenShare: boolean) {
    const payload: Partial<StaffUser> = {
      name: (form.name || "").trim(),
      role: form.role,
      phone: form.phone,
      email: form.email,
      active: form.active ?? true,
      pin: form.pin || "0000",
      username: (form.username || "").trim() || suggestUsername(form.name || "user", role),
      password: form.password || genPassword(form.name),
      permissions: isOwner ? [...ALL_PERM_KEYS] : permissions,
    };
    const error = await onSave(payload, user?.id);
    if (error) return;
    if (!thenShare) return;
    onShare({
      ...(user as StaffUser),
      ...payload,
      id: user?.id || "tmp",
      lastActiveMins: user?.lastActiveMins ?? 0,
    } as StaffUser);
  }

  function handleSaveAndShare() {
    void commit(true);
  }

  function handleSave() {
    void commit(false);
  }

  return (
    <Modal
      size="lg"
      title={isEdit ? `Manage ${user!.name}` : "Add team member"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="line" disabled={!canSave} onClick={handleSaveAndShare}>
            <IconShare size={14} /> {isEdit ? "Save &" : "Create &"} share
          </Button>
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>
            {isEdit ? "Save changes" : "Create user"}
          </Button>
        </>
      }
    >
      <Box className="max-h-[60vh] overflow-y-auto">
        <Box className="grid grid-cols-2 gap-3.5">
          <Field label="Full name" htmlFor="user-name" className="col-span-2">
            <Input id="user-name" data-field="name" value={form.name || ""} onChange={handleNameChange} placeholder="e.g. Priya Sharma" />
          </Field>
          <Field label="Role" htmlFor="user-role">
            <Select id="user-role" value={form.role} disabled={isEdit && user!.role === "Owner"} onChange={handleRoleChange} options={[...RoleChoices({includeOwner: isEdit && user!.role === "Owner"})]} />
          </Field>
          <Field label="Counter PIN" htmlFor="user-pin">
            <Input id="user-pin" className="font-mono" maxLength={6} value={form.pin || ""} onChange={handlePinChange} />
          </Field>
          <Field label="Phone" htmlFor="user-phone">
            <Input id="user-phone" data-field="phone" value={form.phone || ""} onChange={handlePhoneChange} placeholder="+91 " />
          </Field>
          <Field label="Email" htmlFor="user-email">
            <Input id="user-email" data-field="email" value={form.email || ""} onChange={handleEmailChange} />
          </Field>
        </Box>

        <Stack direction="row" align="center" gap={2} className="mb-2.5 mt-5 border-b border-line pb-[7px] font-display text-[13.5px] font-extrabold text-mid">
          <IconKey size={15} /> Login credentials
        </Stack>
        <Box className="rounded-md border border-line bg-wash-2 p-3.5">
          <Box className="grid grid-cols-2 gap-3.5">
            <Field label="Login ID" htmlFor="user-username">
              <Stack direction="row" align="center" justify="between">
                <Text as="span" className="sr-only">
                  Login ID
                </Text>
              </Stack>
              <UsernameLabel onAuto={handleAutoUsername} />
              <Stack direction="row" align="center" gap={2}>
                <Input id="user-username" className="font-mono" value={form.username || ""} onChange={handleUsernameChange} placeholder="name.role" />
                <CopyButton text={form.username || ""} label="login ID" />
              </Stack>
            </Field>
            <Field label="Password" htmlFor="user-password">
              <PasswordLabel onGenerate={handleGeneratePassword} />
              <Stack direction="row" align="center" gap={2}>
                <Input
                  id="user-password"
                  className="font-mono"
                  type={showPassword ? "text" : "password"}
                  value={form.password || ""}
                  onChange={handlePasswordChange}
                  placeholder="Auto-generate or type"
                />
                <Button variant="ghost" size="sm" className="h-[26px] w-[26px] px-0" title={showPassword ? "Hide" : "Show"} onClick={handleTogglePassword}>
                  {showPassword ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                </Button>
                <CopyButton text={form.password || ""} label="password" />
              </Stack>
            </Field>
          </Box>
          <Text variant="caption" className="mt-2.5 flex items-start gap-1.5">
            <IconAlert size={12} /> Share the ID & password securely. Ask the user to change it after first sign-in.
          </Text>
        </Box>

        <Stack direction="row" align="center" gap={2} className="mb-2.5 mt-5 border-b border-line pb-[7px] font-display text-[13.5px] font-extrabold text-mid">
          <IconShield size={15} /> What this user can see & use
        </Stack>
        {isOwner ? (
          <Box className="flex items-center gap-2 rounded-[10px] border border-[#e8d28e] bg-[#fbf3df] px-[13px] py-[11px] text-[12.5px] font-semibold text-[#7a5a12]">
            <IconShield size={14} /> Owners always have full access to every module.
          </Box>
        ) : (
          <>
            <Stack direction="row" align="center" wrap gap={2} className="mb-3">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetDefaults}>
                Reset to {form.role} defaults
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearPermissions}>
                Clear
              </Button>
              <Text as="span" className="ml-auto text-[12px] font-bold text-green">
                {permissions.length} of {ALL_PERM_KEYS.length} enabled
              </Text>
            </Stack>
            <PermissionGrid permissions={permissions} onChange={updateForm} />
          </>
        )}
      </Box>
    </Modal>
  );
}

function UsernameLabel({ onAuto }: { onAuto: () => void }) {
  return (
    <Button variant="link" className="mb-1 text-[11px] text-green" onClick={onAuto}>
      auto
    </Button>
  );
}

function PasswordLabel({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Button variant="link" className="mb-1 text-[11px] text-green" onClick={onGenerate}>
      <IconRefresh size={11} /> generate
    </Button>
  );
}

function RoleChoices({ includeOwner }: { includeOwner: boolean }) {
  const roles = USER_ROLES.filter(function keepRole(role) {
    return role !== "Owner" || includeOwner;
  });
  return roles.map(renderRoleChoice);
}

function renderRoleChoice(role: UserRole) {
  return { value: String(role), label: String(role) };
}

function PermissionGrid({
  permissions,
  onChange,
}: {
  permissions: string[];
  onChange: (patch: Partial<StaffUser>) => void;
}) {
  function renderGroup(group: PermGroup) {
        return <PermissionGroup key={group.group} group={group} permissions={permissions} onChange={onChange} />;
      }
  return (
    <Box className="grid grid-cols-2 gap-3">
      {PERMISSION_CATALOG.map(renderGroup)}
    </Box>
  );
}

function PermissionGroup({
  group,
  permissions,
  onChange,
}: {
  group: PermGroup;
  permissions: string[];
  onChange: (patch: Partial<StaffUser>) => void;
}) {
  const keys = group.items.map(function itemKey(item) {
    return item.key;
  });
  const allSelected = groupFullyEnabled(permissions, keys);

  function handleGroupToggle() {
    onChange({ permissions: setPermissionGroup(permissions, keys, allSelected) });
  }

  function renderItem(item: PermGroup["items"][number]) {
        return (
          <PermissionRow
            key={item.key}
            label={item.label}
            description={item.desc}
            permissionKey={item.key}
            checked={permissions.includes(item.key)}
            permissions={permissions}
            onChange={onChange}
          />
        );
      }
  return (
    <Box className="rounded-md border border-line bg-paper px-3 py-2.5">
      <Stack direction="row" align="center" justify="between" className="mb-2">
        <Text variant="caption" className="text-[10.5px] font-extrabold uppercase tracking-[0.05em]">
          {group.group}
        </Text>
        <Button variant="link" className="text-[11px] text-green" onClick={handleGroupToggle}>
          {allSelected ? "none" : "all"}
        </Button>
      </Stack>
      {group.items.map(renderItem)}
    </Box>
  );
}

function PermissionRow({
  label,
  description,
  permissionKey,
  checked,
  permissions,
  onChange,
}: {
  label: string;
  description: string;
  permissionKey: string;
  checked: boolean;
  permissions: string[];
  onChange: (patch: Partial<StaffUser>) => void;
}) {
  function handleToggle() {
    onChange({ permissions: togglePermission(permissions, permissionKey) });
  }

  return (
    <Box className={checked ? "mb-1 rounded-[9px] border border-line-2 bg-wash-2 px-2 py-[7px]" : "mb-1 rounded-[9px] border border-transparent px-2 py-[7px]"}>
      <Checkbox checked={checked} onChange={handleToggle} aria-label={label}>
        <Stack gap={0} className="min-w-0 flex-1">
          <Text as="span" className="text-[12.5px] font-bold text-ink">
            {label}
          </Text>
          <Text variant="caption">{description}</Text>
        </Stack>
        <Box className="inline-flex w-3.5 text-mid">{checked ? <IconCheck size={13} /> : null}</Box>
      </Checkbox>
    </Box>
  );
}
