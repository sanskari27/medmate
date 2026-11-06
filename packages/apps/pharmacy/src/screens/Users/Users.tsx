import { useState, type ChangeEvent, type ReactNode } from "react";
import { useAppSelector, useConfirmedDispatch } from "@/hooks";
import { faultFrom } from "@/hooks/useConfirmedDispatch";
import { addUser, toggleUser, updateUser } from "@/store/thunks/auth.thunk";
import {
  ALL_PERM_KEYS,
  seatCeiling,
  includedSeats,
  userPerms,
  type StaffUser,
  type UserRole,
} from "@/utils";
import {
  Avatar,
  Box,
  Button,
  Heading,
  IconButton,
  Pill,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import {
  IconAlert,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLock,
  IconPlus,
  IconShare,
  IconShield,
  IconUsers,
} from "@/components/atoms";
import { CopyButton } from "./components/CopyButton";
import { ShareCreds } from "./components/ShareCreds";
import { UserModal } from "./components/UserModal";
import { USER_ROLES } from "./Users.types";
import { countActiveUsers, countUsersWithLogin, userHasFullAccess } from "./Users.utils";

export default function UsersScreen() {
  const confirm = useConfirmedDispatch();
  const users = useAppSelector((state) => state.auth.users);
  const subscription = useAppSelector((state) => state.auth.subscription);
  const extraSeats = useAppSelector((state) => state.auth.extraSeats);
  const profile = useAppSelector((state) => state.auth.profile);
  const [editing, setEditing] = useState<StaffUser | "new" | null>(null);
  const [share, setShare] = useState<StaffUser | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const included = includedSeats(subscription.plan);
  const seatLimit = seatCeiling(subscription.plan, extraSeats);
  const activeCount = countActiveUsers(users);
  const withLogin = countUsersWithLogin(users);
  const seatsFull = seatLimit != null && activeCount >= seatLimit;

  function handleAddUser() {
    setEditing("new");
  }

  function handleCloseEditor() {
    setEditing(null);
  }

  function handleCloseShare() {
    setShare(null);
  }

  function toggleUserActive(id: string) {
    void confirm(toggleUser(id), { kind: "edit" });
  }

  function changeUser(id: string, patch: Partial<StaffUser>) {
    void confirm(updateUser({ id, patch }), { kind: "edit" });
  }

  async function handleSave(payload: Partial<StaffUser>, id?: string) {
    const error = id
      ? faultFrom(await confirm(updateUser({ id, patch: payload }), { kind: "edit" }))
      : faultFrom(await confirm(addUser(payload as Omit<StaffUser, "id" | "lastActiveMins">)));
    if (!error) setEditing(null);
    return error;
  }

  function handleShareFromModal(user: StaffUser) {
    setEditing(null);
    setShare(user);
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <StatCard
          tone="green"
          icon={<IconUsers size={18} />}
          label="Team members"
          value={String(users.length)}
          hint={`${activeCount} active`}
        />
        <StatCard
          tone="blue"
          icon={<IconKey size={18} />}
          label="Seats used"
          value={`${activeCount} / ${seatLimit == null ? "∞" : seatLimit}`}
          hint={`${included == null ? "Unlimited" : `${included} included`}${extraSeats ? ` + ${extraSeats} extra` : ""}`}
        />
        <StatCard
          tone="gold"
          icon={<IconLock size={18} />}
          label="Login enabled"
          value={String(withLogin)}
          hint="have ID & password"
        />
        <StatCard
          tone="teal"
          icon={<IconShield size={18} />}
          label="Access roles"
          value={String(USER_ROLES.length)}
          hint="module-level control"
        />
      </Box>

      <Stack direction="row" align="center" wrap gap={2} className="mb-4">
        <Heading level={2} className="text-[16px]">
          Staff & access control
        </Heading>
        <Box className="flex-1" />
        <Button variant="primary" disabled={seatsFull} onClick={handleAddUser}>
          <IconPlus size={16} /> Add user
        </Button>
      </Stack>
      {seatsFull ? (
        <Text variant="muted" className="mb-3 flex items-center gap-1.5 text-[12.5px]">
          <IconAlert size={14} /> Seat limit reached for the {subscription.plan} plan — deactivate a
          user or ask Namma MedMate for more seats.
        </Text>
      ) : null}

      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <Table className="border-separate border-spacing-0 text-[13px] [&_td]:text-ink-2">
            <TableHead>
              <TableRow className="border-0">
                <HeaderCell>Member</HeaderCell>
                <HeaderCell>Role</HeaderCell>
                <HeaderCell>Login credentials</HeaderCell>
                <HeaderCell>Access</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>{""}</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <UserRows
                users={users}
                reveal={reveal}
                setReveal={setReveal}
                onEdit={setEditing}
                onShare={setShare}
                onToggle={toggleUserActive}
                onRole={changeUser}
              />
            </TableBody>
          </Table>
        </Box>
      </Box>

      {editing ? (
        <UserModal
          user={editing === "new" ? null : editing}
          onClose={handleCloseEditor}
          onSave={handleSave}
          onShare={handleShareFromModal}
        />
      ) : null}
      {share ? (
        <ShareCreds user={share} pharmacy={profile.name} onClose={handleCloseShare} />
      ) : null}
    </Box>
  );
}

function HeaderCell({ children }: { children: string }) {
  return (
    <TableHeaderCell className="sticky top-0 z-[1] bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">
      {children}
    </TableHeaderCell>
  );
}

function UserRows({
  users,
  reveal,
  setReveal,
  onEdit,
  onShare,
  onToggle,
  onRole,
}: {
  users: StaffUser[];
  reveal: Record<string, boolean>;
  setReveal: (value: Record<string, boolean>) => void;
  onEdit: (user: StaffUser) => void;
  onShare: (user: StaffUser) => void;
  onToggle: (id: string) => void;
  onRole: (id: string, patch: Partial<StaffUser>) => void;
}) {
  return users.map(function renderUser(user) {
    return (
      <UserRow
        key={user.id}
        user={user}
        revealed={Boolean(reveal[user.id])}
        reveal={reveal}
        setReveal={setReveal}
        onEdit={onEdit}
        onShare={onShare}
        onToggle={onToggle}
        onRole={onRole}
      />
    );
  });
}

function UserRow({
  user,
  revealed,
  reveal,
  setReveal,
  onEdit,
  onShare,
  onToggle,
  onRole,
}: {
  user: StaffUser;
  revealed: boolean;
  reveal: Record<string, boolean>;
  setReveal: (value: Record<string, boolean>) => void;
  onEdit: (user: StaffUser) => void;
  onShare: (user: StaffUser) => void;
  onToggle: (id: string) => void;
  onRole: (id: string, patch: Partial<StaffUser>) => void;
}) {
  const permissions = userPerms(user);
  const full = userHasFullAccess(user);

  function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
    onRole(user.id, { role: event.target.value as UserRole });
  }

  function handleReveal() {
    setReveal({ ...reveal, [user.id]: !reveal[user.id] });
  }

  function handleToggle() {
    onToggle(user.id);
  }

  function handleEdit() {
    onEdit(user);
  }

  function handleShare() {
    onShare(user);
  }

  return (
    <TableRow className="hover:bg-wash-2">
      <TableCell className="px-3.5 py-[11px]">
        <Stack direction="row" align="center" gap={2}>
          <Avatar
            name={user.name}
            initials={(user.name.trim()[0] ?? "?").toUpperCase()}
            className="!h-[34px] !w-[34px] !rounded-[9px] !bg-wash !text-[17px] !font-extrabold !text-mid"
          />
          <Stack gap={0}>
            <Text as="span" className="font-bold text-ink">
              {user.name}
            </Text>
            <Text variant="caption">{user.email || user.phone}</Text>
          </Stack>
        </Stack>
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        <Select
          className="w-auto max-w-[130px] py-[5px] pr-[30px] pl-2 text-[12.5px] ![background-position:right_7px_center]"
          value={user.role}
          disabled={user.role === "Owner"}
          onChange={handleRoleChange}
          aria-label={`Role for ${user.name}`}
          options={[...RoleOptions()]}
        />
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        {user.username ? (
          <Stack gap={1}>
            <Stack direction="row" align="center" gap={1}>
              <Text
                as="span"
                className="w-[22px] text-[9px] font-extrabold tracking-[0.05em] text-muted"
              >
                ID
              </Text>
              <Text as="span" className="min-w-24 font-mono text-[12.5px] font-bold text-ink">
                {user.username}
              </Text>
              <CopyButton text={user.username} label="login ID" />
            </Stack>
            <Stack direction="row" align="center" gap={1}>
              <Text
                as="span"
                className="w-[22px] text-[9px] font-extrabold tracking-[0.05em] text-muted"
              >
                PW
              </Text>
              <Text as="span" className="min-w-24 font-mono text-[12.5px] font-bold text-ink">
                {revealed ? user.password : "••••••••"}
              </Text>
              <IconButton
                label={revealed ? "Hide" : "Reveal"}
                variant="ghost"
                className="h-[26px] w-[26px] rounded-[7px] border border-line bg-paper text-ink-2 hover:border-line-2 hover:bg-wash-2 hover:text-green"
                onClick={handleReveal}
              >
                {revealed ? <IconEyeOff size={13} /> : <IconEye size={13} />}
              </IconButton>
              <CopyButton text={user.password || ""} label="password" />
            </Stack>
          </Stack>
        ) : (
          <Button
            variant="link"
            className="text-[12.5px] font-bold text-green underline"
            onClick={handleEdit}
          >
            Set up login
          </Button>
        )}
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        {full ? (
          <Pill tone="gold">
            <IconShield size={11} /> Full access
          </Pill>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full border-line-2 bg-wash-2 px-[11px] py-1 text-[12px] font-bold text-ink-2 hover:border-line-2 hover:bg-wash hover:text-mid"
            onClick={handleEdit}
          >
            {permissions.length} / {ALL_PERM_KEYS.length} modules
          </Button>
        )}
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        <Switch
          checked={user.active}
          label={`Toggle ${user.name}`}
          disabled={user.role === "Owner"}
          onClick={handleToggle}
        />
      </TableCell>
      <TableCell align="right" className="px-3.5 py-[11px]">
        <Stack direction="row" gap={1}>
          <IconButton label="Manage access" onClick={handleEdit}>
            <IconEdit size={15} />
          </IconButton>
          <IconButton label="Share credentials" disabled={!user.username} onClick={handleShare}>
            <IconShare size={15} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function RoleOptions() {
  return USER_ROLES.map(renderRoleOption);
}

function renderRoleOption(role: UserRole) {
  return { value: String(role), label: String(role) };
}

function StatCard({
  tone,
  icon,
  label,
  value,
  hint,
}: {
  tone: "green" | "blue" | "gold" | "teal";
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  const toneClass = {
    green: "bg-wash text-mid",
    blue: "bg-blue-bg text-blue",
    gold: "bg-amber-bg text-gold-d",
    teal: "bg-teal-bg text-teal",
  }[tone];
  return (
    <Stack className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Box className={`grid h-8 w-8 place-items-center rounded-[9px] ${toneClass}`}>{icon}</Box>
      <Text
        variant="label"
        className="mt-3 text-[11px] font-bold uppercase tracking-[0.05em] text-muted"
      >
        {label}
      </Text>
      <Text className="mb-2.5 mt-[3px] font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark tabular-nums">
        {value}
      </Text>
      <Text variant="caption" className="mt-auto border-t border-line pt-[9px] text-[12px]">
        {hint}
      </Text>
    </Stack>
  );
}
