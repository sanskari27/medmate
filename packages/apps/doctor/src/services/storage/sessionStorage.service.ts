import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session, SignStep } from "@/types";

export type PersistedAuth = {
  session: Session;
  pinReset: boolean;
  step: SignStep;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSession(value: unknown): value is Session {
  if (!isRecord(value)) return false;
  return (
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    (typeof value.expiresIn === "number" || typeof value.expiresIn === "undefined")
  );
}

/** Reads `{ session, pinReset, step }`, or a legacy session object with `pinReset` false and step "phone". */
export function readPersistedAuth(): PersistedAuth | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if ("session" in parsed) {
      if (!isSession(parsed.session)) return null;
      return {
        session: parsed.session,
        pinReset: parsed.pinReset === true,
        step: (parsed.step as SignStep) ?? "phone",
      };
    }
    if (!isSession(parsed)) return null;
    return { session: parsed, pinReset: false, step: "phone" };
  } catch {
    return null;
  }
}

export function writePersistedAuth(auth: PersistedAuth) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(auth));
}

export function writeSession(session: Session, pinReset = false, step: SignStep = "phone") {
  writePersistedAuth({ session, pinReset, step });
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
