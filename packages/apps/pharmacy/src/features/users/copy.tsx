import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  ROLE_DEFAULT_PERMS, UserRole, StaffUser, timeAgo, seatCeiling, includedSeats,
  PERMISSION_CATALOG, ALL_PERM_KEYS, PERM_LABEL, userPerms,
  genPassword, suggestUsername, waLink, smsLink,
} from "@/domain";
import {
  IconPlus, IconX, IconTrash, IconUsers, IconKey, IconShield, IconAlert,
  IconEdit, IconCopy, IconCheck, IconEye, IconEyeOff, IconRefresh, IconShare,
  IconWhatsApp, IconMessage, IconMail, IconLock,
} from "@/components/Icon";

const ROLES: UserRole[] = ["Owner", "Manager", "Pharmacist", "Cashier"];

const ROLE_PILL: Record<UserRole, string> = { Owner: "pill-gold", Manager: "pill-blue", Pharmacist: "pill-green", Cashier: "pill-teal" };

export function copy(text: string, done: () => void) {
  navigator.clipboard?.writeText(text).then(done, done);
}

export function Copy({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="pd-copybtn" title={`Copy ${label || ""}`} onClick={() => copy(text, () => { setOk(true); setTimeout(() => setOk(false), 1400); })}>
      {ok ? <IconCheck size={13} /> : <IconCopy size={13} />}
    </button>
  );
}
