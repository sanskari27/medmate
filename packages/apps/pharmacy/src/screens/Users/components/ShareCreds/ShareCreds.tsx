import { useMemo, useState } from "react";
import { StaffUser, ALL_PERM_KEYS, PERM_LABEL, userPerms, waLink, smsLink } from "@/utils";
import {
  IconX,
  IconAlert,
  IconCopy,
  IconCheck,
  IconWhatsApp,
  IconMessage,
  IconMail,
} from "@/components/Icon";

import { copy, Copy } from "@/screens/Users/components/Copy";

export function ShareCreds({
  user,
  pharmacy,
  onClose,
}: {
  user: StaffUser;
  pharmacy: string;
  onClose: () => void;
}) {
  const perms = userPerms(user);
  const full = user.role === "Owner" || perms.length >= ALL_PERM_KEYS.length;
  const msg = useMemo(
    () =>
      [
        `Namma MedMate — your login for ${pharmacy}`,
        ``,
        `Login ID: ${user.username}`,
        `Password: ${user.password}`,
        `Role: ${user.role}`,
        ``,
        `Access: ${
          full
            ? "Full access"
            : perms
                .map((k) => PERM_LABEL[k])
                .filter(Boolean)
                .join(", ")
        }`,
        ``,
        `Please sign in and change your password after first login.`,
      ].join("\n"),
    [user, pharmacy, perms, full],
  );

  const [ok, setOk] = useState(false);
  const mail = `mailto:${user.email || ""}?subject=${encodeURIComponent(`Your ${pharmacy} login`)}&body=${encodeURIComponent(msg)}`;

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>Share login with {user.name}</h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <div className="pd-cred-cards">
            <div className="pd-cred-card">
              <span>Login ID</span>
              <b className="pd-mono">{user.username}</b>
              <Copy text={user.username || ""} label="login ID" />
            </div>
            <div className="pd-cred-card">
              <span>Password</span>
              <b className="pd-mono">{user.password}</b>
              <Copy text={user.password || ""} label="password" />
            </div>
          </div>
          <div className="pd-msgbox">{msg}</div>
          <div className="pd-share-row">
            <button
              className="pd-btn pd-btn-line"
              onClick={() =>
                copy(msg, () => {
                  setOk(true);
                  setTimeout(() => setOk(false), 1600);
                })
              }
            >
              {ok ? <IconCheck size={15} /> : <IconCopy size={15} />}{" "}
              {ok ? "Copied" : "Copy message"}
            </button>
            <a
              className="pd-btn pd-btn-wa"
              href={user.phone ? waLink(user.phone, msg) : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!user.phone}
            >
              <IconWhatsApp size={15} /> WhatsApp
            </a>
            <a
              className="pd-btn pd-btn-line"
              href={user.phone ? smsLink(user.phone, msg) : undefined}
              aria-disabled={!user.phone}
            >
              <IconMessage size={15} /> SMS
            </a>
            <a className="pd-btn pd-btn-line" href={mail}>
              <IconMail size={15} /> Email
            </a>
          </div>
          <p className="pd-hint">
            <IconAlert size={12} /> Namma MedMate opens WhatsApp / SMS / email prefilled — you press
            send. Nothing is sent automatically.
          </p>
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
