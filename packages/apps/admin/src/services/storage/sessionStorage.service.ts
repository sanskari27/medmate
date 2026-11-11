import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";

export type PersistedAuth = {
  session: Session;
  pinReset: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSession(value: unknown): value is Session {
  if (!isRecord(value)) return false;
  return (
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    typeof value.expiresIn === "number" &&
    isRecord(value.account)
  );
}

function persisted(session: Session, pinReset: boolean): PersistedAuth {
  return { session, pinReset };
}

/** Reads `{ session, pinReset }`, or a legacy session object with `pinReset` false. */
export function readPersistedAuth(): PersistedAuth | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if ("session" in parsed) {
      if (!isSession(parsed.session)) return null;
      return persisted(parsed.session, parsed.pinReset === true);
    }
    if (!isSession(parsed)) return null;
    return { session: parsed, pinReset: false };
  } catch {
    return null;
  }
}

export function writePersistedAuth(auth: PersistedAuth) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(auth));
}

export function writeSession(session: Session, pinReset = false) {
  writePersistedAuth({ session, pinReset });
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
