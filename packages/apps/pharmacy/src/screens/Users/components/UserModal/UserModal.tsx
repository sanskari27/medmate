import { useState } from "react";
import {
  ROLE_DEFAULT_PERMS,
  UserRole,
  StaffUser,
  PERMISSION_CATALOG,
  ALL_PERM_KEYS,
  genPassword,
  suggestUsername,
} from "@/utils";
import {
  IconX,
  IconKey,
  IconShield,
  IconAlert,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconShare,
} from "@/components/Icon";

import { Copy } from "@/screens/Users/components/Copy";

const ROLES: UserRole[] = ["Owner", "Manager", "Pharmacist", "Cashier"];

export function UserModal({
  user,
  onClose,
  onSave,
  onShare,
}: {
  user: StaffUser | null;
  onClose: () => void;
  onSave: (payload: Partial<StaffUser>, id?: string) => Promise<unknown>;
  onShare: (u: StaffUser) => void;
}) {
  const isEdit = !!user;
  const [f, setF] = useState<Partial<StaffUser>>(
    () =>
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
      },
  );
  const [show, setShow] = useState(false);
  const set = (p: Partial<StaffUser>) => setF((s) => ({ ...s, ...p }));

  const perms = f.permissions ?? ROLE_DEFAULT_PERMS[(f.role as UserRole) || "Cashier"];
  const togglePerm = (key: string) =>
    set({ permissions: perms.includes(key) ? perms.filter((k) => k !== key) : [...perms, key] });
  const isOwner = f.role === "Owner";

  const applyRoleDefaults = (role: UserRole) =>
    set({ role, permissions: [...ROLE_DEFAULT_PERMS[role]] });
  const genPw = () => set({ password: genPassword(f.name) });
  const autoUser = () =>
    set({ username: suggestUsername(f.name || "user", (f.role as UserRole) || "Cashier") });

  const canSave = !!(f.name || "").trim();

  const commit = async (thenShare: boolean) => {
    const payload: Partial<StaffUser> = {
      name: (f.name || "").trim(),
      role: f.role,
      phone: f.phone,
      email: f.email,
      active: f.active ?? true,
      pin: f.pin || "0000",
      username:
        (f.username || "").trim() ||
        suggestUsername(f.name || "user", (f.role as UserRole) || "Cashier"),
      password: f.password || genPassword(f.name),
      permissions: isOwner ? [...ALL_PERM_KEYS] : perms,
    };
    const err = await onSave(payload, user?.id);
    if (err) return;
    if (thenShare)
      onShare({
        ...(user as StaffUser),
        ...payload,
        id: user?.id || "tmp",
        lastActiveMins: user?.lastActiveMins ?? 0,
      } as StaffUser);
  };

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal pd-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>{isEdit ? `Manage ${user!.name}` : "Add team member"}</h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          {/* profile */}
          <div className="pd-form-grid">
            <div className="pd-field pd-span2" data-field="name">
              <label>Full name</label>
              <input
                className="pd-input"
                value={f.name || ""}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div className="pd-field">
              <label>Role</label>
              <select
                className="pd-select"
                value={f.role}
                disabled={isEdit && user!.role === "Owner"}
                onChange={(e) => applyRoleDefaults(e.target.value as UserRole)}
              >
                {ROLES.filter((r) => r !== "Owner" || (isEdit && user!.role === "Owner")).map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="pd-field">
              <label>Counter PIN</label>
              <input
                className="pd-input pd-mono"
                maxLength={6}
                value={f.pin || ""}
                onChange={(e) => set({ pin: e.target.value })}
              />
            </div>
            <div className="pd-field" data-field="phone">
              <label>Phone</label>
              <input
                className="pd-input"
                value={f.phone || ""}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="+91 "
              />
            </div>
            <div className="pd-field" data-field="email">
              <label>Email</label>
              <input
                className="pd-input"
                value={f.email || ""}
                onChange={(e) => set({ email: e.target.value })}
              />
            </div>
          </div>

          {/* credentials */}
          <div className="pd-formsec">
            <IconKey size={15} /> Login credentials
          </div>
          <div className="pd-cred-panel">
            <div className="pd-form-grid">
              <div className="pd-field">
                <label>
                  Login ID{" "}
                  <button type="button" className="pd-minilink" onClick={autoUser}>
                    auto
                  </button>
                </label>
                <div className="pd-inpwrap">
                  <input
                    className="pd-input pd-mono"
                    value={f.username || ""}
                    onChange={(e) => set({ username: e.target.value.replace(/\s/g, "") })}
                    placeholder="name.role"
                  />
                  <Copy text={f.username || ""} label="login ID" />
                </div>
              </div>
              <div className="pd-field">
                <label>
                  Password{" "}
                  <button type="button" className="pd-minilink" onClick={genPw}>
                    <IconRefresh size={11} /> generate
                  </button>
                </label>
                <div className="pd-inpwrap">
                  <input
                    className="pd-input pd-mono"
                    type={show ? "text" : "password"}
                    value={f.password || ""}
                    onChange={(e) => set({ password: e.target.value })}
                    placeholder="Auto-generate or type"
                  />
                  <button
                    type="button"
                    className="pd-copybtn"
                    onClick={() => setShow((s) => !s)}
                    title={show ? "Hide" : "Show"}
                  >
                    {show ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                  </button>
                  <Copy text={f.password || ""} label="password" />
                </div>
              </div>
            </div>
            <p className="pd-hint">
              <IconAlert size={12} /> Share the ID &amp; password securely. Ask the user to change
              it after first sign-in.
            </p>
          </div>

          {/* permissions */}
          <div className="pd-formsec">
            <IconShield size={15} /> What this user can see &amp; use
          </div>
          {isOwner ? (
            <div className="pd-note-gold">
              <IconShield size={14} /> Owners always have full access to every module.
            </div>
          ) : (
            <>
              <div className="pd-permbar">
                <button
                  className="pd-chipbtn"
                  onClick={() => set({ permissions: [...ALL_PERM_KEYS] })}
                >
                  Select all
                </button>
                <button
                  className="pd-chipbtn"
                  onClick={() =>
                    set({ permissions: [...ROLE_DEFAULT_PERMS[(f.role as UserRole) || "Cashier"]] })
                  }
                >
                  Reset to {f.role} defaults
                </button>
                <button className="pd-chipbtn" onClick={() => set({ permissions: [] })}>
                  Clear
                </button>
                <span className="pd-permcount">
                  {perms.length} of {ALL_PERM_KEYS.length} enabled
                </span>
              </div>
              <div className="pd-permgrid">
                {PERMISSION_CATALOG.map((grp) => {
                  const keys = grp.items.map((i) => i.key);
                  const all = keys.every((k) => perms.includes(k));
                  return (
                    <div className="pd-permgroup" key={grp.group}>
                      <div className="pd-permgroup-h">
                        <span>{grp.group}</span>
                        <button
                          className="pd-minilink"
                          onClick={() =>
                            set({
                              permissions: all
                                ? perms.filter((k) => !keys.includes(k))
                                : [...new Set([...perms, ...keys])],
                            })
                          }
                        >
                          {all ? "none" : "all"}
                        </button>
                      </div>
                      {grp.items.map((it) => {
                        const on = perms.includes(it.key);
                        return (
                          <label key={it.key} className={`pd-permrow${on ? " on" : ""}`}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => togglePerm(it.key)}
                            />
                            <span className="pd-permrow-txt">
                              <b>{it.label}</b>
                              <small>{it.desc}</small>
                            </span>
                            <span className="pd-permcheck">
                              {on ? <IconCheck size={13} /> : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="pd-btn pd-btn-line" disabled={!canSave} onClick={() => commit(true)}>
            <IconShare size={14} /> {isEdit ? "Save &" : "Create &"} share
          </button>
          <button
            className="pd-btn pd-btn-primary"
            disabled={!canSave}
            onClick={() => commit(false)}
          >
            {isEdit ? "Save changes" : "Create user"}
          </button>
        </div>
      </div>
    </div>
  );
}
