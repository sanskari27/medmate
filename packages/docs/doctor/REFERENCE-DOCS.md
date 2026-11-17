# MedMate

The clinic and doctor management dashboard, built from scratch in this workspace.

```bash
node server/server.mjs          # http://127.0.0.1:8812  — app + API
node --test "test/*.test.mjs"   # 50 tests
```

Open <http://127.0.0.1:8812>, enter a mobile number and press **Send code** — the
6-digit code is shown on screen (demo mode). Sign in as any persona:

| Mobile | Person | Sees |
|---|---|---|
| `9845012345` | Dr. Ananya Rao | Owner / doctor — everything, clinic-wide queue, takeover |
| `9986041277` | Dr. Vikram Shenoy | Doctor — own queue, clinical records |
| `9741022981` | Dr. Meghana Iyer | Doctor — own queue, clinical records |
| `9886244120` | Mary Joseph | Nurse — vitals and routing, no clinical records |
| `9900122331` | Priya Shetty | Front desk — desk and money, no clinical records |
| `9880433120` | Kiran Bhat | Clinic admin — money, staff, locations, no clinical records |

---

## What is built

The Wave 0 security stories from the audit, implemented server-side and verified
end to end:

| Story | What it does | Where |
|---|---|---|
| **F-101** | Sign in with a mobile OTP and a personal PIN | `server/server.mjs`, `js/app.js` |
| **F-102** | One capability model drives the menu *and* the API | `server/lib/rbac-policy.mjs` |
| **F-103** | Roles without `records` receive **no** clinical fields | `server/lib/rbac-policy.mjs` |
| **F-104** | Queue and patient lists are redacted per role | same |
| **F-107** | Sign-in limiting keyed on phone **and** IP, with `Retry-After` | `server/lib/otp-rate-limit.mjs` |
| **F-108** | Cover for a colleague — take over a visit, with a reason, logged | `POST /api/visits/:id/claim` |
| **F-109** | A doctor's queue, invoices and day close are scoped to them | `scopeDoctor`, `scopeRows` |
| **F-205** | The kiosk lists the doctors who are actually seeing patients | `GET /api/kiosk` |
| **F-311** | Allergy, interaction and dose checks at the point of prescribing | `server/lib/clinical.mjs`, `js/prescribing.js` |
| **F-514** | Each role lands on the screen its work starts from | `GET /api/landing`, `js/screens.js` |

Screens built against the product's own stylesheet: sign-in, dashboard, doctor
console (queue + consult + takeover), reception desk, billing, patient records,
staff and roles, patient kiosk.

---

## Structure

```
index.html            app shell
js/
  api.js              API client (same-origin session cookie)
  app.js              router, shell, sign-in, live data loading
  screens.js          screen renderers - pure functions over fetched data
  icons.js            the 38-icon set, byte-exact from the MVP
  data.js             captured API payloads, shared with the server seed
styles/
  medmate.css         the product's own stylesheet, verbatim from the deployment
  app.css             shell wiring only - no token is redefined
server/
  server.mjs          zero-dependency HTTP server: static files + API
  lib/rbac-policy.mjs the permission model and the redaction projections
  lib/otp-rate-limit.mjs the two-tier sign-in limiter
  data/seed.mjs       seeded records (the browser fixtures are the same data)
test/                 node:test suites, including end-to-end HTTP tests
verify/               UI fidelity check: 38 properties + every icon glyph
assets/               the extracted icon set, live measurements, the tracker payload
```

**No dependencies.** Node's standard library only. The stylesheet is the
product's own, so anything built with the app's class vocabulary inherits the
exact geometry automatically.

---

## UI fidelity

The build is verified against the deployed MVP by measurement, not by eye.
`verify/check-fidelity.js` compares computed styles and icon glyphs:

```
layout  38 properties checked, 0 drift
icons   every rendered glyph byte-identical to the verified set
```

Run it by pasting the script into DevTools on a running build, or through
Playwright. `../../../packages/docs/doctor/UI-SPEC.md` is the design contract: type scale, colour tokens,
geometry, icons, motion and the rules for new work.

---

## Documentation

| Document | What it holds |
|---|---|
| `../../../packages/docs/doctor/DEVELOPMENT-ROADMAP.md` | The plan, the waves, the gates, and the status of all 77 stories |
| `../../../packages/docs/platform/MEDMATE-PRODUCT-AUDIT.md` | The audit, with the live evidence behind every finding |
| `../../../packages/docs/platform/MEDMATE-ARCHITECTURE.md` | How the product works, in plain language |
| `../../../packages/docs/doctor/UI-SPEC.md` | The design contract for anything built on this |
| `../../../packages/docs/platform/FIX-PACKAGE.md` | The two fix packages with their tests |
| `../../../packages/docs/platform/GOOGLE-SHEET-REQUIREMENTS.md` | The tracker of record and the sheet payload |

The live tracker:
<https://docs.google.com/spreadsheets/d/19Ngyy5OJtdjqLI7Z0hP-LBRZQxF8cpBBMpwcsX6XGgM/edit>
