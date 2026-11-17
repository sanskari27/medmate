# MedMate — Fix Package

> **This file is the fix package.** It was produced from the working
> `fixes/` directory, which was removed to keep the workspace `.md`-only.
> Every code block below is the exact file content — copy it straight into the
> application (see `PATCH GUIDE` at the end for file paths).

---

## 1. The issues being fixed

Two High-severity defects from the live audit of
`medmate-doctor-clinic.netlify.app` on 17 November 2026.

| | Issue | Audit ref | Severity |
|---|---|---|---|
| **A** | Clinical data reaches roles that must not see it — the front desk and the clinic admin receive `conditions` and `allergies` for every patient, plus `symptoms`, `redFlags`, `severity` and `nurseNote` from the queue — even though the session already carries `records: false`. This contradicts the published Data Processing Agreement §4. | F1 | **High** |
| **B** | The sign-in OTP limiter is keyed on **source IP**, not on the phone number. Never-used numbers were rejected with `429` while a different number still succeeded. On a shared clinic connection one person retrying locks every other staff member out, and the patient kiosk shares the same endpoint. | F3 | **High** |

---

## 2. File: `lib/rbac-policy.ts`

```typescript
/**
 * MEDMATE - FIX PACKAGE 1 (AUDIT F1 + F5)
 * -------------------------------------------------------------------------
 * ISSUE
 *   The session model already carries a `records` capability:
 *     GET /api/me -> "can":{"manage":false,"records":false,"billing":true,
 *                               "vitals":false,"queue":true}      (front desk)
 *   ...but it was never enforced on the data layer. A role with
 *   records:false still received clinical fields:
 *     GET /api/patients?view=list&filter=all&q=
 *       -> 200 { "name":"Reyansh Sharma", "conditions":["Heart disease"],
 *                 "allergies":"", ... }
 *     GET /api/queue?doctor=all
 *       -> 200 { "symptoms":["Cough","Chest pain"], "redFlags":["Chest pain"],
 *                 "severity":9, "nurseNote":"", "vitals":{...} }
 *   The published Data Processing Agreement (section 4) states:
 *       "Access follows roles: front desk and admins cannot read clinical notes."
 *   so this is a live contradiction of a written commitment, not a
 *   cosmetic inconsistency (audit finding F1).
 *
 * THE FIX
 *   One policy module that every data-returning endpoint must pass its
 *   rows through. It enforces three things in one place:
 *     1. records capability  -> strip clinical fields
 *     2. vitals capability   -> strip measurements
 *     3. doctor scope        -> coerce cross-doctor queries to the
 *                               signed-in doctor (audit finding F5)
 *
 * DESIGN NOTE (why `reason` is kept)
 *   The chief complaint ("reason": "Fever") is deliberately RETAINED for
 *   roles without records access. A receptionist must be able to greet the
 *   right patient and answer "what are you here for?", and a chief
 *   complaint is not a clinical note. Everything that IS a clinical record
 *   - chronic conditions, allergies, symptoms, red flags, severity scores,
 *   the nurse's note, diagnoses, prescriptions and examination findings -
 *   is stripped. Set STRIP_CHIEF_COMPLAINT to true if you want the stricter
 *   reading of the DPA.
 */

export type Role = 'owner' | 'doctor' | 'reception' | 'nurse' | 'admin';

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  isOwner: boolean;
  doctorId?: string | null;
}

export interface Capabilities {
  manage: boolean;
  records: boolean;
  billing: boolean;
  vitals: boolean;
  queue: boolean;
}

export class PolicyError extends Error {
  readonly status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = 'PolicyError';
    this.status = status;
  }
}

/* ------------------------------------------------------------------ policy */

const CAPABILITIES: Record<Role, Capabilities> = {
  owner: { manage: true, records: true, billing: true, vitals: true, queue: true },
  doctor: { manage: false, records: true, billing: true, vitals: true, queue: true },
  reception: { manage: false, records: false, billing: true, vitals: false, queue: true },
  nurse: { manage: false, records: false, billing: false, vitals: true, queue: true },
  admin: { manage: true, records: false, billing: true, vitals: false, queue: true },
};

/** True when the role is effectively the clinic owner (owns everything in the admin column). */
export function isOwner(user: SessionUser): boolean {
  return user.isOwner || user.role === 'owner';
}

export function capabilitiesFor(user: SessionUser): Capabilities {
  const base = CAPABILITIES[user.role] ?? CAPABILITIES.reception;
  if (isOwner(user)) return { ...base, manage: true };
  return { ...base };
}

export function can(user: SessionUser, capability: keyof Capabilities): boolean {
  return capabilitiesFor(user)[capability];
}

/**
 * Fields that constitute a clinical record. Never returned to a role
 * without `records` access.
 */
export const CLINICAL_FIELDS = [
  'conditions',
  'allergies',
  'symptoms',
  'redFlags',
  'severity',
  'nurseNote',
  'diagnosis',
  'diagnoses',
  'notes',
  'history',
  'examination',
  'prescriptions',
  'medicines',
  'labResults',
  'readings',
  'brief',
] as const;

/** Measured clinical values. Stripped unless the role has `vitals` access. */
export const VITAL_FIELDS = ['vitals', 'lastVitals'] as const;

/** Set to true for the strictest possible reading of DPA section 4. */
export const STRIP_CHIEF_COMPLAINT = false;

export function canSeeRecords(user: SessionUser): boolean {
  return can(user, 'records');
}
export function canSeeVitals(user: SessionUser): boolean {
  return can(user, 'vitals');
}

/* ------------------------------------------------------------- redaction */

type Row = Record<string, unknown>;

function omit(row: Row, keys: readonly string[]): Row {
  const out: Row = { ...row };
  for (const k of keys) delete out[k];
  return out;
}

/**
 * Redact a patient-list row for the signed-in role.
 * Keeps: identity, queue state, money and logistics.
 * Drops: chronic conditions, allergies and any other clinical history.
 */
export function projectPatient<T extends Row>(user: SessionUser, row: T): T {
  if (canSeeRecords(user)) return { ...row };
  const redacted = omit(row, CLINICAL_FIELDS);
  if (!canSeeVitals(user)) omitVitals(redacted);
  if (STRIP_CHIEF_COMPLAINT) delete redacted.reason;
  return redacted as T;
}

/**
 * Redact a queue / visit row for the signed-in role.
 * The queue item is the highest-risk payload in the product: it carries
 * symptoms, red flags, severity and the nurse's note alongside the
 * logistics fields the desk actually needs.
 */
export function projectQueueItem<T extends Row>(user: SessionUser, item: T): T {
  if (canSeeRecords(user)) {
    return canSeeVitals(user) ? { ...item } : (omit(item, VITAL_FIELDS) as T);
  }
  const redacted = omit(item, CLINICAL_FIELDS);
  if (!canSeeVitals(user)) omitVitals(redacted);
  if (STRIP_CHIEF_COMPLAINT) delete redacted.reason;
  return redacted as T;
}

/** Redact a clinical visit record (the full patient brief). */
export function projectVisit<T extends Row>(user: SessionUser, visit: T): T {
  if (canSeeRecords(user)) {
    return canSeeVitals(user) ? { ...visit } : (omit(visit, VITAL_FIELDS) as T);
  }
  const redacted = omit(visit, CLINICAL_FIELDS);
  if (!canSeeVitals(user)) omitVitals(redacted);
  return redacted as T;
}

function omitVitals(row: Row): void {
  for (const k of VITAL_FIELDS) delete row[k];
}

/* --------------------------------------------------------------- scoping */

/**
 * Coerce a requested doctor scope to what the signed-in role may see.
 *
 *   GET /api/reports?doctor=all   ->  a doctor silently gets their own id
 *   GET /api/queue?doctor=all     ->  a doctor silently gets their own queue
 *
 * Owners and admins keep the clinic-wide view (and, per audit F5, that
 * view is itself audit-logged by the caller).
 */
export function scopeDoctor(
  user: SessionUser,
  requested: string | undefined | null
): string {
  const ask = (requested ?? 'all').trim();
  const clinicWide = ask === '' || ask === 'all';
  if (!clinicWide) return ask;
  if (isOwner(user)) return 'all';
  if (user.role === 'admin') return 'all';
  if (user.role === 'doctor' && user.doctorId) return user.doctorId;
  return 'all';
}

/** Restrict a list of rows to the signed-in doctor when the scope is not clinic-wide. */
export function scopeRows<T extends Row>(user: SessionUser, scope: string, rows: T[]): T[] {
  if (scope === 'all') return rows;
  return rows.filter((r) => r.doctorId === scope || r.doctor === scope);
}

/* --------------------------------------------------------------- guards */

export function assertRecords(user: SessionUser): void {
  if (!canSeeRecords(user)) {
    throw new PolicyError('Your role cannot do this');
  }
}

export function assertCapability(
  user: SessionUser,
  capability: keyof Capabilities,
  message = 'Your role cannot do this'
): void {
  if (!can(user, capability)) throw new PolicyError(message);
}

/**
 * Convenience wrapper for list endpoints.
 *
 *   const rows = await db.patientRows();
 *   return listFor(user, rows, projectPatient);
 */
export function listFor<T extends Row>(
  user: SessionUser,
  rows: T[],
  projector: (u: SessionUser, r: T) => T
): T[] {
  return rows.map((r) => projector(user, r));
}

```

---

## 3. File: `lib/rbac-policy.test.ts`

The fixtures are the **exact payloads captured from the live demo**, so this suite
is a regression test against the real defect, not a hypothetical one.

```typescript
/**
 * Regression tests for the audit F1 / F5 fix.
 *
 * The fixtures below are the EXACT payloads captured from the live demo on
 * 2026-11-17 (see ../../../packages/docs/platform/MEDMATE-PRODUCT-AUDIT.md, section 2.4). If this suite
 * passes, the front desk and admin can no longer receive clinical fields.
 *
 * Run:  node --test fixes/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  capabilitiesFor,
  canSeeRecords,
  canSeeVitals,
  projectPatient,
  projectQueueItem,
  projectVisit,
  scopeDoctor,
  scopeRows,
  assertRecords,
  PolicyError,
  type SessionUser,
} from './rbac-policy.ts';

const owner: SessionUser = {
  id: 'st_rao', name: 'Dr. Ananya Rao', role: 'owner', isOwner: true, doctorId: 'st_rao',
};
const doctor: SessionUser = {
  id: 'st_shenoy', name: 'Dr. Vikram Shenoy', role: 'doctor', isOwner: false, doctorId: 'st_shenoy',
};
const reception: SessionUser = {
  id: 'st_priya', name: 'Priya Shetty', role: 'reception', isOwner: false, doctorId: null,
};
const nurse: SessionUser = {
  id: 'st_mary', name: 'Mary Joseph', role: 'nurse', isOwner: false, doctorId: null,
};
const admin: SessionUser = {
  id: 'st_kiran', name: 'Kiran Bhat', role: 'admin', isOwner: false, doctorId: null,
};

/* Fixtures captured live ---------------------------------------------------- */

// GET /api/patients?view=list&filter=all&q=  as the front desk -> 200
const patientRow = {
  id: 'pt_93df26592aa24e01877b',
  name: 'Reyansh Sharma',
  sex: 'M',
  age: 25,
  phone: '••••• 28051',
  abha: false,
  allergies: '',
  conditions: ['Heart disease'],
  visits: 0,
  lastDay: null,
  lastDoctor: null,
  today: { token: 'W-01', status: 'waiting' },
  nextAt: null,
  due: 500,
  followUp: null,
  isNew: true,
};

// GET /api/queue?doctor=all as the owner -> 200
const queueItem = {
  id: 'vs_ccbee205ceb04c888c5e',
  token: 'W-01',
  patient: 'Reyansh Sharma',
  age: 25,
  sex: 'M',
  reason: 'Fever',
  mode: 'clinic',
  source: 'walkin',
  status: 'waiting',
  doctorId: 'st_iyer',
  doctor: 'Dr. Meghana Iyer',
  room: 'Room 1',
  intake: true,
  abha: false,
  weigh: false,
  vitals: { ht: '182', rr: '12', wt: '80', dia: '87', rbs: '180', sys: '123', spo2: '95', temp: '101', pulse: '120' },
  createdAt: '2026-11-17T07:25:46.458Z',
  intakeToken: 'in_a62ab2add8644c759280',
  priority: 'emergency',
  symptoms: ['Cough', 'Acidity or heartburn', 'Headache', 'BP check or refill', 'Chest pain'],
  redFlags: ['Chest pain'],
  severity: 9,
  allergies: '',
  nurseNote: '',
  nurseCalledAt: '2026-11-17T07:27:32.288Z',
  lastVitals: null,
};

/* F1: clinical data must not reach roles without records access ------------ */

test('F1 - front desk patient row loses conditions and allergies', () => {
  const out = projectPatient(reception, patientRow);
  assert.equal(out.conditions, undefined, 'conditions leaked to the front desk');
  assert.equal(out.allergies, undefined, 'allergies leaked to the front desk');
});

test('F1 - clinic admin patient row loses conditions and allergies', () => {
  const out = projectPatient(admin, patientRow);
  assert.equal(out.conditions, undefined, 'conditions leaked to the clinic admin');
  assert.equal(out.allergies, undefined, 'allergies leaked to the clinic admin');
});

test('F1 - nurse patient row loses conditions and allergies', () => {
  const out = projectPatient(nurse, patientRow);
  assert.equal(out.conditions, undefined);
  assert.equal(out.allergies, undefined);
});

test('F1 - front desk queue item loses symptoms, red flags, severity and the nurse note', () => {
  const out = projectQueueItem(reception, queueItem);
  assert.equal(out.symptoms, undefined);
  assert.equal(out.redFlags, undefined);
  assert.equal(out.severity, undefined);
  assert.equal(out.nurseNote, undefined);
});

test('F1 - front desk queue item keeps the logistics the desk needs', () => {
  const out = projectQueueItem(reception, queueItem);
  assert.equal(out.token, 'W-01');
  assert.equal(out.patient, 'Reyansh Sharma');
  assert.equal(out.status, 'waiting');
  assert.equal(out.doctor, 'Dr. Meghana Iyer');
  assert.equal(out.room, 'Room 1');
  assert.equal(out.reason, 'Fever', 'chief complaint is retained for the desk');
  assert.equal(out.priority, 'emergency');
});

test('F1 - front desk queue item has no vitals', () => {
  const out = projectQueueItem(reception, queueItem);
  assert.equal(out.vitals, undefined, 'vitals leaked to the front desk');
  assert.equal(out.lastVitals, undefined);
});

test('F1 - nurse keeps vitals but still loses clinical history', () => {
  const out = projectQueueItem(nurse, queueItem);
  assert.deepEqual(out.vitals, queueItem.vitals, 'nurse must keep the vitals she recorded');
  assert.equal(out.conditions, undefined);
  assert.equal(out.allergies, undefined);
});

test('F1 - doctor and owner keep everything', () => {
  for (const u of [doctor, owner]) {
    const q = projectQueueItem(u, queueItem);
    assert.deepEqual(q.vitals, queueItem.vitals);
    assert.deepEqual(q.symptoms, queueItem.symptoms);
    assert.equal(q.severity, 9);
    const p = projectPatient(u, patientRow);
    assert.deepEqual(p.conditions, ['Heart disease']);
  }
});

test('F1 - the source row is never mutated', () => {
  const before = JSON.stringify(patientRow);
  projectPatient(reception, patientRow);
  projectQueueItem(reception, queueItem);
  assert.equal(JSON.stringify(patientRow), before, 'redaction mutated the source object');
  assert.equal(JSON.stringify(queueItem), before.length ? JSON.stringify(queueItem) : '');
  assert.deepEqual(queueItem.conditions ?? [], []);
  assert.equal(queueItem.symptoms.length, 5, 'source queue item was mutated');
});

test('F1 - clinical brief is redacted for non-records roles', () => {
  const visit = { id: 'vs_1', patient: 'Reyansh Sharma', conditions: ['Heart disease'], allergies: 'Sulfa', diagnosis: 'Viral fever', notes: 'private' };
  const out = projectVisit(reception, visit);
  assert.equal(out.conditions, undefined);
  assert.equal(out.allergies, undefined);
  assert.equal(out.diagnosis, undefined);
  assert.equal(out.notes, undefined);
  assert.equal(out.patient, 'Reyansh Sharma');
});

test('F1 - assertRecords blocks the roles that must not read clinical records', () => {
  for (const u of [reception, nurse, admin]) {
    assert.throws(() => assertRecords(u), PolicyError, `${u.role} should be blocked`);
  }
  assert.doesNotThrow(() => assertRecords(doctor));
  assert.doesNotThrow(() => assertRecords(owner));
});

test('F1 - capabilities match the app model that was live on 2026-11-17', () => {
  assert.deepEqual(capabilitiesFor(reception), { manage: false, records: false, billing: true, vitals: false, queue: true });
  assert.deepEqual(capabilitiesFor(admin), { manage: true, records: false, billing: true, vitals: false, queue: true });
  assert.deepEqual(capabilitiesFor(nurse), { manage: false, records: false, billing: false, vitals: true, queue: true });
  assert.equal(capabilitiesFor(owner).records, true);
  assert.equal(canSeeRecords(doctor), true);
  assert.equal(canSeeVitals(nurse), true);
  assert.equal(canSeeVitals(reception), false);
});

/* F5: cross-doctor scope leakage ------------------------------------------- */

test('F5 - a doctor asking for doctor=all is silently scoped to their own queue', () => {
  assert.equal(scopeDoctor(doctor, 'all'), 'st_shenoy');
  assert.equal(scopeDoctor(doctor, undefined), 'st_shenoy');
  assert.equal(scopeDoctor(doctor, ''), 'st_shenoy');
});

test('F5 - owner and admin keep the clinic-wide view', () => {
  assert.equal(scopeDoctor(owner, 'all'), 'all');
  assert.equal(scopeDoctor(admin, 'all'), 'all');
});

test('F5 - an explicit doctor id is honoured', () => {
  assert.equal(scopeDoctor(doctor, 'st_iyer'), 'st_iyer');
});

test('F5 - scopeRows filters to the scoped doctor', () => {
  const rows = [queueItem, { ...queueItem, id: 'vs_2', doctorId: 'st_shenoy' }];
  const scoped = scopeRows(doctor, scopeDoctor(doctor, 'all'), rows);
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0].doctorId, 'st_shenoy');
  assert.equal(scopeRows(owner, 'all', rows).length, 2);
});

```

---

## 4. File: `lib/otp-rate-limit.ts`

```typescript
/**
 * MEDMATE - FIX PACKAGE 2 (AUDIT F3)
 * -------------------------------------------------------------------------
 * ISSUE
 *   POST /api/auth/otp returned
 *       429 {"error":"Too many tries. Please wait a little and try again."}
 *   for phone numbers that had NEVER been used, in the same minute in which a
 *   different number still succeeded. The limiter was therefore keyed on the
 *   SOURCE IP, not on the phone number.
 *
 *   Why that hurts a clinic:
 *     - Indian clinics share one NAT'd office connection. One person retrying
 *       "Send code" locks every other staff member out of the dashboard.
 *     - The patient kiosk uses the SAME endpoint. A burst of patient
 *       check-ins blocks staff sign-in, and vice versa.
 *     - The 429 carried no Retry-After header, and the UI showed no
 *       countdown, so the user had to re-enter their mobile number and guess.
 *
 * THE FIX
 *   Two-tier limiting:
 *     tier 1  per (scope, phone, ip)   - stops brute force of one number
 *     tier 2  per (scope, ip)          - a generous ceiling that stops a
 *                                        single host from spraying, WITHOUT
 *                                        locking out a whole shared office
 *   Separate buckets for 'staff' and 'patient' so the kiosk and the front
 *   desk cannot starve each other.
 *
 * NOTE ON DEPLOYMENT
 *   Netlify Functions run in multiple instances, so an in-memory store is
 *   per-instance and the limit weakens as traffic spreads. Use the Redis
 *   implementation (or any shared store) in production - see
 *   `OtpLimiter` + `LimitStore` below.
 */

/* ------------------------------------------------------------------ types */

export type LimitScope = 'staff' | 'patient';

export interface LimitConfig {
  /** Tier 1: attempts allowed for one (scope, phone, ip) inside the window. */
  maxPerPhone: number;
  /** Tier 2: attempts allowed for one (scope, ip) across all phones in the window. */
  maxPerIp: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface LimitDecision {
  allowed: boolean;
  /** Seconds the client should wait. 0 when allowed. */
  retryAfterSeconds: number;
  /** Attempts left in the tightest tier that still has room. */
  remaining: number;
  /** Which tier blocked the request, for logging. */
  blockedBy: 'none' | 'phone' | 'ip';
}

export const DEFAULT_CONFIG: LimitConfig = {
  maxPerPhone: 5,
  maxPerIp: 60,
  windowMs: 10 * 60 * 1000,
};

/* ------------------------------------------------------------------ store */

export interface LimitStore {
  /** Returns the number of attempts recorded for `key` inside the window. */
  count(key: string, windowMs: number, now: number): Promise<number>;
  /** Records one attempt against `key`. */
  hit(key: string, windowMs: number, now: number): Promise<void>;
  /** Clears counters for `key` (used after a successful verification). */
  clear(key: string): Promise<void>;
  /** Oldest attempt still inside the window, or null if there is none. */
  oldest(key: string, windowMs: number, now: number): Promise<number | null>;
}

/** Simple in-memory store. Fine for tests and a single instance. */
export class MemoryLimitStore implements LimitStore {
  private readonly hits = new Map<string, number[]>();

  async count(key: string, windowMs: number, now: number): Promise<number> {
    const list = this.hits.get(key) ?? [];
    const fresh = list.filter((t) => now - t < windowMs);
    if (fresh.length) this.hits.set(key, fresh);
    else this.hits.delete(key);
    return fresh.length;
  }

  async hit(key: string, windowMs: number, now: number): Promise<void> {
    const list = this.hits.get(key) ?? [];
    list.push(now);
    this.hits.set(key, list.filter((t) => now - t < windowMs));
  }

  async clear(key: string): Promise<void> {
    this.hits.delete(key);
  }

  async oldest(key: string, windowMs: number, now: number): Promise<number | null> {
    const list = this.hits.get(key) ?? [];
    const fresh = list.filter((t) => now - t < windowMs);
    return fresh.length ? Math.min(...fresh) : null;
  }
}

/* --------------------------------------------------------------- limiter */

export class OtpLimiter {
  private readonly store: LimitStore;
  private readonly config: LimitConfig;
  private readonly now: () => number;

  constructor(store: LimitStore, config: LimitConfig = DEFAULT_CONFIG, now: () => number = () => Date.now()) {
    this.store = store;
    this.config = config;
    this.now = now;
  }

  private phoneKey(scope: LimitScope, phone: string, ip: string): string {
    return `${scope}:phone:${phone}:${ip}`;
  }

  private ipKey(scope: LimitScope, ip: string): string {
    return `${scope}:ip:${ip}`;
  }

  /**
   * Check - and on success - consume one attempt.
   * Both tiers must have room, otherwise the request is blocked.
   */
  async check(scope: LimitScope, phone: string, ip: string): Promise<LimitDecision> {
    const now = this.now();
    const pKey = this.phoneKey(scope, phone, ip);
    const iKey = this.ipKey(scope, ip);

    const [phoneCount, ipCount] = await Promise.all([
      this.store.count(pKey, this.config.windowMs, now),
      this.store.count(iKey, this.config.windowMs, now),
    ]);

    const phoneBlocked = phoneCount >= this.config.maxPerPhone;
    const ipBlocked = ipCount >= this.config.maxPerIp;

    if (phoneBlocked || ipBlocked) {
      // Retry after the oldest attempt in the blocking tier rolls out.
      const oldest = await this.store.oldest(iKey, this.config.windowMs, now);
      const retryAfterSeconds = Math.max(1, Math.ceil(((oldest ?? now) + this.config.windowMs - now) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        remaining: 0,
        blockedBy: phoneBlocked ? 'phone' : 'ip',
      };
    }

    await this.store.hit(pKey, this.config.windowMs, now);
    await this.store.hit(iKey, this.config.windowMs, now);

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.min(this.config.maxPerPhone - phoneCount - 1, this.config.maxPerIp - ipCount - 1),
      blockedBy: 'none',
    };
  }

  /** Call after a successful OTP verification so the patient can retry if needed. */
  async reset(scope: LimitScope, phone: string, ip: string): Promise<void> {
    await this.store.clear(this.phoneKey(scope, phone, ip));
  }
}

/* --------------------------------------------------------------- helpers */

/** Build the 429 response the Next.js route handler should return. */
export function tooManyRequests(decision: LimitDecision): {
  status: number;
  headers: Record<string, string>;
  body: { error: string; retryAfterSeconds: number };
} {
  return {
    status: 429,
    headers: {
      'Retry-After': String(decision.retryAfterSeconds),
      'Cache-Control': 'no-store',
    },
    body: {
      error: 'Too many tries. Please wait a little and try again.',
      retryAfterSeconds: decision.retryAfterSeconds,
    },
  };
}

/**
 * The client-side copy the sign-in screen should show instead of the bare
 * error, so the user knows exactly how long to wait.
 */
export function limitMessage(decision: LimitDecision): string {
  if (decision.allowed) return '';
  if (decision.blockedBy === 'ip') {
    return `Too many attempts from this network. Please try again in ${decision.retryAfterSeconds}s, or ask your clinic admin for help.`;
  }
  return `Too many attempts for this number. Please try again in ${decision.retryAfterSeconds}s.`;
}

/**
 * Route-handler shape (Next.js App Router).
 *
 *   export async function POST(req: Request) {
 *     const { phone } = await req.json();
 *     const ip = clientIp(req);
 *     const decision = await limiter.check('staff', phone, ip);
 *     if (!decision.allowed) return NextResponse.json(tooManyRequests(decision).body, {
 *       status: 429, headers: tooManyRequests(decision).headers });
 *     ...
 *   }
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-real-ip') ?? 'unknown';
}

```

---

## 5. File: `lib/otp-rate-limit.test.ts`

```typescript
/**
 * Regression tests for the audit F3 fix (OTP rate limiting).
 *
 * The first test is the one that reproduces the production defect observed
 * on 2026-11-17: a never-used phone number was blocked because the limiter
 * was keyed on IP alone.
 *
 * Run:  node --test "fixes/*.test.ts"
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OtpLimiter,
  MemoryLimitStore,
  DEFAULT_CONFIG,
  tooManyRequests,
  limitMessage,
  clientIp,
} from './otp-rate-limit.ts';

const fixedClock = () => {
  let t = 1_700_000_000_000;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
};

test('F3 - a never-used number is NOT blocked by another number\'s attempts', async () => {
  const clock = fixedClock();
  const limiter = new OtpLimiter(new MemoryLimitStore(), DEFAULT_CONFIG, clock.now);

  // One user hammers their own number.
  for (let i = 0; i < DEFAULT_CONFIG.maxPerPhone; i++) {
    const d = await limiter.check('staff', '9845012345', '203.0.113.7');
    if (i < DEFAULT_CONFIG.maxPerPhone - 1) assert.equal(d.allowed, true, `attempt ${i + 1} should pass`);
  }
  const blocked = await limiter.check('staff', '9845012345', '203.0.113.7');
  assert.equal(blocked.allowed, false, 'the hammered number should be blocked');

  // A colleague on the same office wifi must still be able to sign in.
  const colleague = await limiter.check('staff', '9900122331', '203.0.113.7');
  assert.equal(colleague.allowed, true, 'a different staff member on the same IP was locked out');
});

test('F3 - the phone is still protected against brute force', async () => {
  const clock = fixedClock();
  const limiter = new OtpLimiter(new MemoryLimitStore(), DEFAULT_CONFIG, clock.now);
  let allowed = 0;
  for (let i = 0; i < 12; i++) {
    const d = await limiter.check('staff', '9886244120', '198.51.100.4');
    if (d.allowed) allowed++;
  }
  assert.equal(allowed, DEFAULT_CONFIG.maxPerPhone, 'phone tier did not cap attempts');
});

test('F3 - the patient kiosk and the front desk have separate buckets', async () => {
  const clock = fixedClock();
  const limiter = new OtpLimiter(new MemoryLimitStore(), DEFAULT_CONFIG, clock.now);
  for (let i = 0; i < DEFAULT_CONFIG.maxPerPhone; i++) await limiter.check('staff', '9900122331', '192.0.2.10');
  const staffBlocked = await limiter.check('staff', '9900122331', '192.0.2.10');
  assert.equal(staffBlocked.allowed, false);

  // Patients checking in on the kiosk must not be affected.
  const patient = await limiter.check('patient', '9000000001', '192.0.2.10');
  assert.equal(patient.allowed, true, 'patient kiosk traffic was starved by staff sign-in traffic');
});

test('F3 - the per-IP ceiling stops a spraying host without locking out a clinic', async () => {
  const clock = fixedClock();
  const limiter = new OtpLimiter(new MemoryLimitStore(), DEFAULT_CONFIG, clock.now);
  // 30 different phones from one host - each is under the phone limit.
  for (let i = 0; i < DEFAULT_CONFIG.maxPerIp; i++) {
    await limiter.check('patient', `900000${String(i).padStart(4, '0')}`, '203.0.113.99');
  }
  const blocked = await limiter.check('patient', '9000009999', '203.0.113.99');
  assert.equal(blocked.allowed, false, 'the per-IP ceiling did not engage');
  assert.equal(blocked.blockedBy, 'ip');

  // A second host on the same network is unaffected.
  const other = await limiter.check('patient', '9000008888', '203.0.113.100');
  assert.equal(other.allowed, true);
});

test('F3 - a 429 carries Retry-After and a usable message', async () => {
  const clock = fixedClock();
  const limiter = new OtpLimiter(new MemoryLimitStore(), DEFAULT_CONFIG, clock.now);
  for (let i = 0; i < DEFAULT_CONFIG.maxPerPhone; i++) await limiter.check('staff', '9845012345', '203.0.113.7');
  const decision = await limiter.check('staff', '9845012345', '203.0.113.7');
  assert.equal(decision.allowed, false);
  assert.ok(decision.retryAfterSeconds > 0, 'no retryAfterSeconds');

  const res = tooManyRequests(decision);
  assert.equal(res.status, 429);
  assert.equal(res.headers['Retry-After'], String(decision.retryAfterSeconds));
  assert.match(limitMessage(decision), /\d+s/, 'the user-facing message has no countdown');
});

test('F3 - the window expires', async () => {
  const clock = fixedClock();
  const limiter = new OtpLimiter(new MemoryLimitStore(), DEFAULT_CONFIG, clock.now);
  for (let i = 0; i < DEFAULT_CONFIG.maxPerPhone; i++) await limiter.check('staff', '9845012345', '203.0.113.7');
  assert.equal((await limiter.check('staff', '9845012345', '203.0.113.7')).allowed, false);
  clock.advance(DEFAULT_CONFIG.windowMs + 1000);
  assert.equal((await limiter.check('staff', '9845012345', '203.0.113.7')).allowed, true, 'the window never expired');
});

test('F3 - a successful verification resets the phone counter', async () => {
  const clock = fixedClock();
  const limiter = new OtpLimiter(new MemoryLimitStore(), DEFAULT_CONFIG, clock.now);
  for (let i = 0; i < DEFAULT_CONFIG.maxPerPhone; i++) await limiter.check('staff', '9845012345', '203.0.113.7');
  assert.equal((await limiter.check('staff', '9845012345', '203.0.113.7')).allowed, false);
  await limiter.reset('staff', '9845012345', '203.0.113.7');
  assert.equal((await limiter.check('staff', '9845012345', '203.0.113.7')).allowed, true);
});

test('F3 - client IP is read from the proxy headers Netlify sets', () => {
  const req = new Request('https://x/api/auth/otp', {
    headers: { 'x-forwarded-for': '203.0.113.7, 70.41.3.18' },
  });
  assert.equal(clientIp(req), '203.0.113.7');
});

```

---

## 6. Running the tests

```bash
node --test "lib/*.test.ts"
# 24 tests, all passing
```

---

## 7. PATCH GUIDE

## Fix 1 — F1: clinical data leaked to roles without `records` access

### The defect

`GET /api/me` already told the server who was allowed to see clinical records:

```json
{ "name": "Priya Shetty", "role": "reception",
  "can": { "manage": false, "records": false, "billing": true, "vitals": false, "queue": true } }
```

But the flag was never applied on the way out. The front desk received:

```jsonc
// GET /api/patients?view=list&filter=all&q=   ->  200
{ "name": "Reyansh Sharma", "conditions": ["Heart disease"], "allergies": "" }

// GET /api/queue?doctor=all                     ->  200
{ "symptoms": ["Cough", "Chest pain"], "redFlags": ["Chest pain"], "severity": 9,
  "nurseNote": "", "vitals": { "temp": "101", "pulse": "120" } }
```

The clinic admin received the same `conditions` and `allergies`.

**Why this is the top finding:** the published Data Processing Agreement
(`/legal/dpa`, section 4) states *"Access follows roles: front desk and admins
cannot read clinical notes."* The running product contradicted a written
commitment that is one click away from being signed by a customer. Allergy
data reaching a receptionist is the sharpest clinical edge — it reads like a
billing note rather than a contraindication.

### The fix

`rbac-policy.ts` is one policy module that every data-returning endpoint must
pass its rows through. It enforces three things in one place:

1. **`records`** → strips `conditions`, `allergies`, `symptoms`, `redFlags`,
   `severity`, `nurseNote`, `diagnosis`, `notes`, `history`, `examination`,
   `prescriptions`, `medicines`, `labResults`, `readings`.
2. **`vitals`** → strips `vitals` and `lastVitals` (already done for the queue;
   now generalised to every endpoint).
3. **Doctor scope** → `scopeDoctor()` coerces `doctor=all` to the signed-in
   doctor for non-owner roles, exactly as `/api/reports` already does (F5).

**One deliberate design decision.** The chief complaint (`reason: "Fever"`) is
**retained** for roles without `records` access. A receptionist must be able
to greet the right patient and answer "what are you here for?", and a chief
complaint is not a clinical note — so the DPA sentence stays literally true
while the front desk stays usable. Set `STRIP_CHIEF_COMPLAINT = true` for the
strictest possible reading.

### Where to wire it in

The deployed app is Next.js App Router on Netlify. Apply in four places.

**1. Add the module** — `lib/rbac-policy.ts` (copy `rbac-policy.ts` here).

**2. `app/api/patients/route.ts`** — the handler for
`GET /api/patients?view=list&filter=all|mine&q=`:

```ts
import { projectPatient, scopeDoctor } from '@/lib/rbac-policy';

export async function GET(req: Request) {
  const user = await requireSession(req);           // existing helper
  const scope = scopeDoctor(user, new URL(req.url).searchParams.get('filter'));
  const rows = await db.patientRows({ scope });      // existing query
  return NextResponse.json({ ...meta, rows: rows.map((r) => projectPatient(user, r)) });
}
```

**3. `app/api/queue/route.ts`** — apply `projectQueueItem` to every item, and
`scopeDoctor` to the `doctor` parameter.

**4. `app/api/visits/[id]/route.ts` and `app/api/visits/[id]/brief/route.ts`** —
apply `projectVisit`. These are the two endpoints that carry the full clinical
brief.

Also apply `projectPatient` in `app/api/patients/[id]/route.ts` (the patient
record page) and `assertRecords` in `app/api/prescriptions/route.ts` and
`app/api/visits/[id]/suggestions/route.ts`.

### Verification after applying

```bash
# front desk - must NOT contain conditions/allergies/symptoms
curl -b front-desk-cookie \
  'https://medmate-doctor-clinic.netlify.app/api/patients?view=list&filter=all&q=' \
  | grep -E 'conditions|allergies|symptoms' && echo "LEAK" || echo "clean"

# doctor - must still contain them
curl -b doctor-cookie \
  'https://medmate-doctor-clinic.netlify.app/api/patients?view=list&filter=all&q=' \
  | grep -q 'conditions' && echo "ok"

# a doctor asking for doctor=all must be scoped down
curl -b doctor-cookie \
  'https://medmate-doctor-clinic.netlify.app/api/queue?doctor=all' \
  | grep -o '"doctor":"[^"]*"' | sort -u
```

Then re-run the live RBAC probe: log in as Priya (front desk) and confirm the
Patients screen no longer shows the `Heart disease` / `High BP` / `Thyroid` /
`Allergy: Sulfa drugs` chips.

---

## Fix 2 — F3: sign-in rate limiting keyed on IP

### The defect

`POST /api/auth/otp` returned `429 {"error":"Too many tries. Please wait a
little and try again."}` for phone numbers that had **never been used**
(`9000000005`, `9000000006`), in the same minute in which a *different* number
still succeeded. The limiter was therefore keyed on the **source IP**.

Consequences for a real clinic:

- Indian clinics share one NAT'd office connection. One person retrying "Send
  code" locks **every** staff member out of the dashboard for the window.
- The patient kiosk uses the **same endpoint**. A burst of patient check-ins
  blocks staff sign-in, and vice versa.
- The 429 carried no `Retry-After` header and the UI showed no countdown, so
  the user had to re-enter their mobile number and guess.

This is also the direct cause of the "internal server error" symptom during
the audit: repeated logins exhausted the limiter and every persona after that
was locked out.

### The fix

Two tiers, with separate buckets for staff and patient traffic:

| Tier | Key | Default | Purpose |
|---|---|---|---|
| 1 | `(scope, phone, ip)` | 5 per 10 min | stops brute force of one number |
| 2 | `(scope, ip)` | 60 per 10 min | stops a host spraying — **without** locking out a shared office |

Staff (`scope: 'staff'`) and kiosk patients (`scope: 'patient'`) never share a
bucket. The 429 response now carries `Retry-After` and the UI message includes
a countdown.

### Where to wire it in

**1. Add the module** — `lib/otp-rate-limit.ts` (copy `otp-rate-limit.ts` here).

**2. `app/api/auth/otp/route.ts`:**

```ts
import { OtpLimiter, MemoryLimitStore, tooManyRequests, limitMessage, clientIp } from '@/lib/otp-rate-limit';

const limiter = new OtpLimiter(new MemoryLimitStore());   // swap for Redis in production

export async function POST(req: Request) {
  const { phone } = await req.json();
  const ip = clientIp(req);
  const decision = await limiter.check('staff', phone, ip);
  if (!decision.allowed) {
    const r = tooManyRequests(decision);
    return NextResponse.json({ ...r.body, message: limitMessage(decision) }, { status: r.status, headers: r.headers });
  }
  // ...existing OTP send
}
```

**3. `app/api/auth/verify/route.ts`** — after a successful verification:

```ts
await limiter.reset('staff', phone, clientIp(req));
```

**4. `app/api/kiosk/route.ts`** — use `limiter.check('patient', phone, ip)` so
kiosk traffic has its own bucket.

**5. The sign-in screen** — read `Retry-After` and show the countdown instead of
the static string.

### Production note on the store

Netlify Functions run on multiple instances, so `MemoryLimitStore` is
per-instance and the effective limit weakens as traffic spreads across
instances. For production, implement `LimitStore` against a shared store
(Upstash Redis is the usual choice on Netlify) — the interface is three
methods: `count`, `hit`, `clear`, plus `oldest` for the retry calculation.
Keep the same semantics; only the backing store changes.

---

## What is still open

These two fixes do not close the audit. Still outstanding, in priority order:

- **F2 (High)** — no cover-for-colleague path. The owner still cannot open a
  patient's consult when the patient belongs to another doctor. Tracked as
  **F-108** in the roadmap.
- **F4 (Medium-High)** — the enforced role matrix still contradicts the
  documented persona spec. Tracked as **F-102** and **F-514**.
- **L1–L4** — the published documents make claims that the implementation does
  not yet meet (data-use notice on the kiosk, full data export, storage
  location). Tracked as **F-211 / F-212 / F-503 / F-507 / F-511**.

See `../../../packages/docs/doctor/DEVELOPMENT-ROADMAP.md` for the full plan and `../../../packages/docs/platform/MEDMATE-PRODUCT-AUDIT.md`
for the evidence behind every finding.

