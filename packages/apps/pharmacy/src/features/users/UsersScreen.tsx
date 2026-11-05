import { copy, Copy } from "./copy";
import { UserModal } from "./UserModal";
import { ShareCreds } from "./ShareCreds";
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

// small copy button with a transient tick

export default function UsersScreen() {
  const { users, addUser, toggleUser, removeUser, updateUser, subscription, extraSeats, profile, now } = usePharma();
  const [editing, setEditing] = useState<StaffUser | "new" | null>(null);
  const [share, setShare] = useState<StaffUser | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const included = includedSeats(subscription.plan);
  const seatLimit = seatCeiling(subscription.plan, extraSeats);
  const activeCount = users.filter((u) => u.active).length;
  const withLogin = users.filter((u) => u.username && u.password).length;

  return (
    <div className="pd-canvas-wide">
      <div className="pd-stats" >
        <div className="pd-stat"><div className="ic ic-green"><IconUsers size={18} /></div><div className="lbl">Team members</div><div className="val">{users.length}</div><div className="split">{activeCount} active</div></div>
        <div className="pd-stat"><div className="ic ic-blue"><IconKey size={18} /></div><div className="lbl">Seats used</div><div className="val">{activeCount} / {seatLimit == null ? "∞" : seatLimit}</div><div className="split">{included == null ? "Unlimited" : `${included} included`}{extraSeats ? ` + ${extraSeats} extra` : ""}</div></div>
        <div className="pd-stat"><div className="ic ic-gold"><IconLock size={18} /></div><div className="lbl">Login enabled</div><div className="val">{withLogin}</div><div className="split">have ID &amp; password</div></div>
        <div className="pd-stat"><div className="ic ic-teal"><IconShield size={18} /></div><div className="lbl">Access roles</div><div className="val">{ROLES.length}</div><div className="split">module-level control</div></div>
      </div>

      <div className="pd-toolbar">
        <h2 style={{ fontSize: 16 }}>Staff &amp; access control</h2>
        <div className="pd-spacer" />
        <button className="pd-btn pd-btn-primary" disabled={seatLimit != null && activeCount >= seatLimit} onClick={() => setEditing("new")}><IconPlus size={16} /> Add user</button>
      </div>
      {seatLimit != null && activeCount >= seatLimit && <p className="pd-muted" style={{ fontSize: 12.5, marginBottom: 12 }}><IconAlert size={14} /> Seat limit reached for the {subscription.plan} plan — deactivate a user or ask Namma MedMate for more seats.</p>}

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl pd-users-tbl">
            <thead><tr><th>Member</th><th>Role</th><th>Login credentials</th><th>Access</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => {
                const perms = userPerms(u);
                const full = u.role === "Owner" || perms.length >= ALL_PERM_KEYS.length;
                const show = reveal[u.id];
                return (
                  <tr key={u.id}>
                    <td><div className="prod"><span className="em" style={{ background: "var(--wash)", color: "var(--mid)", fontWeight: 800 }}>{u.name[0]}</span><span><span className="nm">{u.name}</span><div className="sub">{u.email || u.phone}</div></span></div></td>
                    <td>
                      <select className="pd-select pd-compact" style={{ maxWidth: 130 }} value={u.role} disabled={u.role === "Owner"} onChange={(e) => updateUser(u.id, { role: e.target.value as UserRole })}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      {u.username ? (
                        <div className="pd-cred">
                          <div className="pd-cred-row"><span className="k">ID</span><b className="pd-mono">{u.username}</b><Copy text={u.username} label="login ID" /></div>
                          <div className="pd-cred-row"><span className="k">PW</span><b className="pd-mono">{show ? u.password : "••••••••"}</b>
                            <button className="pd-copybtn" title={show ? "Hide" : "Reveal"} onClick={() => setReveal((r) => ({ ...r, [u.id]: !r[u.id] }))}>{show ? <IconEyeOff size={13} /> : <IconEye size={13} />}</button>
                            <Copy text={u.password || ""} label="password" />
                          </div>
                        </div>
                      ) : <button className="pd-linkbtn" onClick={() => setEditing(u)}>Set up login</button>}
                    </td>
                    <td>
                      {full
                        ? <span className="pd-pill pill-gold"><IconShield size={11} /> Full access</span>
                        : <button className="pd-accesschip" onClick={() => setEditing(u)}>{perms.length} / {ALL_PERM_KEYS.length} modules</button>}
                    </td>
                    <td><button className={`pd-switch${u.active ? " on" : ""}`} onClick={() => toggleUser(u.id)} disabled={u.role === "Owner"} aria-label="Toggle" /></td>
                    <td className="num">
                      <div className="pd-rowacts">
                        <button className="pd-iconbtn" title="Manage access" onClick={() => setEditing(u)}><IconEdit size={15} /></button>
                        <button className="pd-iconbtn" title="Share credentials" disabled={!u.username} onClick={() => setShare(u)}><IconShare size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <UserModal
          user={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (payload, id) => {
            const err = id ? await updateUser(id, payload) : await addUser(payload as Omit<StaffUser, "id" | "lastActiveMins">);
            if (!err) setEditing(null);
            return err;
          }}
          onShare={(u) => { setEditing(null); setShare(u); }}
        />
      )}
      {share && <ShareCreds user={share} pharmacy={profile.name} onClose={() => setShare(null)} />}
    </div>
  );
}

// ── Add / manage user ────────────────────────────────────────────

// ── Share credentials ────────────────────────────────────────────

