# Clinic sign-in and patient list Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A clinic staff member signs in to a new doctor portal with their phone and PIN, lands on a screen built for their role, and sees their own clinic's patients with the clinical fields their grants allow.

**Architecture:** `medmate-server` keeps identity and adds a `CLINIC` account type whose access token carries `clinicId` and `clinicRole`. A new `medmate-clinic-api` service validates that token with the shared HS256 secret, resolves the clinic's own database through a `clinic_registry` table, and serves the clinic's patients, redacting by per-account grants held in that clinic's database. A new `doctor` portal on Vite and React 19 talks to the clinic API through its own origin.

**Tech Stack:** Java 21, Spring Boot 3.5.6, Maven, Nimbus JOSE, Flyway, Postgres 16, JUnit, AssertJ, `@WebMvcTest`, Failsafe `*IT`, Testcontainers. TypeScript, Vite 6, React 19, Tailwind v4, React Router 7, Redux Toolkit, RTK Query, React Hook Form, Zod, Vitest, Testing Library.

**Spec:** `packages/docs/doctor/requirements/2026-11-17-clinic-sign-in-and-patients.md`
**ADRs:** `packages/docs/medmate-server/decisions/0029-clinic-accounts.md`, `packages/docs/medmate-server/decisions/0030-clinic-tenant-claim.md`, `packages/docs/doctor/decisions/0001-clinic-api-and-database-per-clinic.md`

## Global Constraints

- Java 21 and Spring Boot 3.5.6. Maven reactor. Base package `com.medmate.server` for `medmate-server`; `com.medmate.clinic` for the clinic API.
- Runnable code lives in `medmate-clinic-api-app`. A new area is a sibling Maven module.
- Errors go through `ApiExceptionHandler` as `ProblemDetail`. No second error JSON shape.
- No Spring Security, JPA, or a new starter in `medmate-server` unless an ADR says so.
- Palantir Java Format is enforced on `verify`. `make api-verify` and `make clinic-api-verify` must pass.
- Unit tests run in Surefire. HTTP slices use `@WebMvcTest`. Full-process tests are named `*IT` and run in Failsafe.
- A new HTTP route adds a Bruno request under `bruno/medmate/<module>/` and reuses `examplePharmacyId`, `examplePhone` and `exampleRequestId`.
- The portal is TypeScript, Vite, React 19, Tailwind v4, React Router, Redux Toolkit, RTK Query, React Hook Form, Zod. RTK Query uses `fetch`. Axios and dayjs are not installed.
- The portal folder map is `app`, `components`, `features`, `hooks`, `services`, `lib`, `utils`, `constants`, `types`, `styles`, `tests`. `@/*` maps to `src/*`.
- A feature imports another feature only through that feature's `index.ts`. Shared UI does not import features. Presentational components do not call `fetch`.
- `eslint-plugin-boundaries` stops a feature importing another feature, and stops shared UI importing features.
- Error details are exact strings. `Session was not accepted`, `This action is not allowed.`, `Clinic records are unavailable`.
- The demo clinic id is `11111111-1111-1111-1111-111111111111`. The second clinic used by the isolation test is `22222222-2222-2222-2222-222222222222`. Both ids are fixed here because the identity seed and the clinic registry seed must agree on them.
- The demo clinic accounts are: Dr. Ananya Rao `9845012345` OWNER, Dr. Vikram Shenoy `9986041277` DOCTOR, Dr. Meghana Iyer `9741022981` DOCTOR, Mary Joseph `9886244120` NURSE, Priya Shetty `9900122331` FRONT_DESK, Kiran Bhat `9880433120` ADMIN, and a receptionist `9876500011` FRONT_DESK with no grants yet.
- The JWT secret is shared through the SSM parameter `/medmate-repo/common/jwt_secret`. Locally both services use `local-dev-jwt-secret-local-dev-jwt-32`.
- The next free Flyway version in the reactor is `V28`. The identity module's own migrations are numbered separately, but the reactor shares one history, so the clinic migration is `V28__clinic.sql`.
- `AccountPrincipal` is a record with eighteen construction sites: one in `AccountDirectory` and seventeen in test files across other modules. Adding two fields means updating every one of them.

## Review Focus

Five failure modes the spec implies but no task's own assertions would otherwise pin.

1. **A clinic token must never read another clinic's rows.** The token's `clinicId` selects the database. If a token from clinic A is replayed against clinic B's data, the answer is an empty result, never B's patients.
2. **A clinic with no registry row must fail closed.** An unknown clinic, or a database that cannot be reached, is 503 `Clinic records are unavailable`. It must never fall back to another clinic's database.
3. **A revoked grant takes effect on the next request.** The grants live in the clinic's own database, so removing `clinic:patients:read_clinical` stops the clinical fields on the very next call, without a new token.
4. **A patient's phone number is never returned in full.** It is masked as `••••• 28051` in every list response and on every screen, for every role, including the ones that hold the clinical grant.
5. **The role landing screen honours the same grants as the list.** A front desk account without `clinic:billing:read` must not see an amount anywhere, including in a landing screen total.

---

### Task 1: Clinic accounts and the tenant claim in `medmate-server`

**Files:**
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/access/AccountType.java`
- Create: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/access/ClinicRole.java`
- Create: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/access/ClinicPermissions.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/access/AccountPrincipal.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/web/SessionIssuer.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/session/AccountDirectory.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/web/AuthController.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/session/AccessTokens.java`
- Create: `packages/apps/medmate-server/medmate-server-identity/src/main/resources/db/migration/V28__clinic.sql`
- Test: `packages/apps/medmate-server/medmate-server-identity/src/test/java/com/medmate/server/identity/access/ClinicAccountRulesTest.java`
- Test: `packages/apps/medmate-server/medmate-server-identity/src/test/java/com/medmate/server/identity/session/ClinicTokenTest.java`

**Interfaces:**
- Consumes: nothing from later tasks.
- Produces: `ClinicRole` enum with `OWNER, DOCTOR, NURSE, FRONT_DESK, ADMIN` and `wire()` returning the lowercase name. `ClinicPermissions.KEYS` a `List<String>` of `clinic:patients:read`, `clinic:patients:read_clinical`, `clinic:billing:read`, `clinic:staff:read`, plus `ClinicPermissions.valid(String)`. `AccessTokens.issue(UUID accountId, UUID clinicId, String clinicRole, Instant now)` returning a signed HS256 JWT that carries `clinicId` and `clinicRole` only when `clinicId` is not null. `AccessTokens.parse(String token, Instant now)` unchanged, plus `AccessTokens.parseClaims(String token, Instant now)` returning the two tenant values, used when the identity module re-issues a token for a refreshed session. `AccountPrincipal` gains `UUID clinicId` and `String clinicRole`.

- [ ] **Step 1: Write the failing test**

`ClinicAccountRulesTest`: `ClinicRole.wire()` returns `owner` for `OWNER` and `front_desk` for `FRONT_DESK`; `ClinicPermissions.valid("clinic:patients:read")` is true; `ClinicPermissions.valid("patients:read")` is false, so a clinic key cannot be a pharmacy key.

`ClinicTokenTest`: a token issued with a clinic id carries that `clinicId` and `clinicRole` in its claims; a token issued without a clinic id carries neither; a token signed with the wrong secret does not parse.

`ClinicAccountRulesTest` also covers the sign-in path: a phone that holds a clinic account resolves to a principal with that `clinicId` and `clinicRole`, and the account type `clinic` parses from the wire value `clinic`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd packages/apps/medmate-server && ./mvnw -q -pl medmate-server-identity -Dtest='ClinicAccountRulesTest,ClinicTokenTest' test`
Expected: FAIL to compile, `cannot find symbol ClinicRole`.

- [ ] **Step 3: Implement `ClinicRole`, `ClinicPermissions`, the principal fields, the claims and the migration**

`AccountType` gains `CLINIC`. `ClinicRole` is an enum with the five roles. `ClinicPermissions.KEYS` holds the four grant keys. `AccountPrincipal` gains `UUID clinicId` and `String clinicRole`, null for every other account type. `AccessTokens.issue` takes the tenant and writes a `clinicId` claim and a `clinicRole` claim only when the tenant is not null; `parseClaims` reads them back. `V28__clinic.sql` adds nullable `clinic_id` and `clinic_role` to the account table and seeds the six demo accounts of the demo clinic, with their phones and roles. `AccountDirectory` fills the two clinic fields on the principal, `AuthController` accepts `accountType: "clinic"`, and `SessionIssuer` passes the tenant into the token.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd packages/apps/medmate-server && ./mvnw -q -pl medmate-server-identity -Dtest='ClinicAccountRulesTest,ClinicTokenTest' test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/apps/medmate-server/medmate-server-identity
git commit -m "Add clinic accounts and the clinic tenant claim"
```

---

### Task 2: The clinic API service and per-clinic database routing

**Files:**
- Create: `packages/apps/medmate-clinic-api/pom.xml`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/pom.xml`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/ClinicApiApplication.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/security/ClinicTokenVerifier.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/security/ClinicPrincipal.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/routing/ClinicRegistry.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/routing/ClinicRouting.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/resources/db/migration/V1__clinic_registry.sql`
- Create: `packages/apps/medmate-clinic-api/project.yaml`
- Test: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/test/java/com/medmate/clinic/routing/ClinicRoutingTest.java`

**Interfaces:**
- Consumes: the HS256 secret from the `medmate.jwt.secret` property, and the `clinicId` and `clinicRole` claims from Task 1.
- Produces: `ClinicTokenVerifier.verify(String bearer, Instant now)` returning `ClinicPrincipal(accountId, clinicId, clinicRole)` or throwing. `ClinicRegistry` with `Optional<ClinicRegistryRow> find(UUID clinicId)` where `ClinicRegistryRow` is `(UUID clinicId, String databaseName, String displayName)`. `ClinicRouting.route(ClinicPrincipal)` returning the `DataSource` for that clinic's database and throwing `ClinicUnavailableException` when the clinic is not registered or its database cannot be reached.

- [ ] **Step 1: Write the failing test**

`ClinicRoutingTest`: a registered clinic resolves to the database named in the registry row; an unknown clinic id raises `ClinicUnavailableException`; a row whose database cannot be reached raises `ClinicUnavailableException` rather than falling through to any other database. A bearer with no `clinicId` claim is rejected with 401 `Session was not accepted`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/apps/medmate-clinic-api && ./mvnw -q -pl medmate-clinic-api-app -Dtest=ClinicRoutingTest test`
Expected: FAIL to compile, `cannot find symbol ClinicRouting`.

- [ ] **Step 3: Implement the service skeleton, the verifier, the registry and the routing**

Two Maven modules in a reactor, the app module holding the runnable code in package `com.medmate.clinic`. `ClinicTokenVerifier` verifies the HS256 signature with the shared secret and reads the two tenant claims. `ClinicRegistry` reads `clinic_registry` from the shared instance; the table holds `clinic_id`, `database_name` and `display_name` and holds no credentials. `ClinicRouting` maps a `ClinicPrincipal` to that clinic's database and raises `ClinicUnavailableException` on an unknown clinic or an unreachable database. `V1__clinic_registry.sql` creates the table on the shared instance. `project.yaml` declares `kind: java`, `runtime.port: 8090`, `runtime.healthPath: /actuator/health`, and `resources.database.enabled: true`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/apps/medmate-clinic-api && ./mvnw -q -pl medmate-clinic-api-app -Dtest=ClinicRoutingTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/apps/medmate-clinic-api
git commit -m "Add the clinic API service and per-clinic database routing"
```

---

### Task 3: Grants, redaction and the patient list

**Files:**
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/grants/GrantChecker.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/patients/PatientList.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/patients/PatientController.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/java/com/medmate/clinic/me/MeController.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/resources/db/migration/V2__patients.sql`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/main/resources/db/migration/V3__clinic_grants.sql`
- Test: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/test/java/com/medmate/clinic/patients/PatientRedactionTest.java`
- Test: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/test/java/com/medmate/clinic/patients/ClinicPatientsControllerTest.java`

**Interfaces:**
- Consumes: `ClinicPrincipal` and `ClinicRouting` from Task 2.
- Produces: `GrantChecker.holds(ClinicPrincipal principal, String grantKey)` reading `clinic_grant` in the routed clinic's database. `PatientList.search(UUID clinicId, String q, String status, Boolean due, int page, int size, String sort)` returning a `PatientPage(items, page, size, total)`. `PatientItem` with `id, name, age, sex, phone, status, due, conditions, allergies, abha, lastSeen`. `GET /clinic/me` returns `{ "clinicId", "clinicName", "role", "grants" }`. `GET /clinic/patients` returns `{ "items", "page", "size", "total" }`.

- [ ] **Step 1: Write the failing test**

`PatientRedactionTest`: an item for an account holding only `clinic:patients:read` has `conditions`, `allergies`, `abha` and `lastSeen` absent, and `due` absent unless the account holds `clinic:billing:read`; an account holding `clinic:patients:read_clinical` sees the clinical fields; every item's `phone` is masked with the last four digits after a bullet run; removing `clinic:patients:read_clinical` from the grant store stops the clinical fields on the very next call, without a new token.

`ClinicPatientsControllerTest`: no session is 401 `Session was not accepted`; a valid clinic token without `clinic:patients:read` is 403 `This action is not allowed.`; `page` defaults to 1 and `size` to 25; a `size` of 101 is 400; `q` matches the name ignoring case; `status` filters; `due=true` selects patients with an outstanding amount; `sort=name` orders by last name then first name; a page past the end returns an empty item list with the real total.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd packages/apps/medmate-clinic-api && ./mvnw -q -pl medmate-clinic-api-app -Dtest='PatientRedactionTest,ClinicPatientsControllerTest' test`
Expected: FAIL to compile, `cannot find symbol GrantChecker`.

- [ ] **Step 3: Implement the grants, the redaction and the list**

`clinic_grant` holds `(account_id, grant_key)` in the clinic's own database. `GrantChecker` reads the account's keys. `PatientList` is a plain type that builds the query and maps rows; it takes the clinic id so it can never query another clinic's database. `PatientController` redaction omits a field entirely rather than nulling it. `V2__patients.sql` creates the patient table in a clinic's database; `V3__clinic_grants.sql` creates the grant table and seeds the demo grants for the six demo accounts.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd packages/apps/medmate-clinic-api && ./mvnw -q -pl medmate-clinic-api-app -Dtest='PatientRedactionTest,ClinicPatientsControllerTest' test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/apps/medmate-clinic-api
git commit -m "Add clinic grants, patient redaction and the patient list"
```

---

### Task 4: Two clinics, two databases, end to end

**Files:**
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/web/SessionIssuer.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/session/AccountDirectory.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/web/AuthController.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/session/AccountDirectory.java`
- Modify: `packages/apps/medmate-server/medmate-server-identity/src/main/java/com/medmate/server/identity/web/AuthController.java`
- Create: `packages/apps/medmate-clinic-api/medmate-clinic-api-app/src/test/java/com/medmate/clinic/ClinicApiIT.java`
- Create: `bruno/medmate/identity/auth/send-clinic-otp.bru`
- Create: `bruno/medmate/identity/auth/verify-clinic-otp.bru`
- Create: `bruno/medmate/clinic/me.bru`
- Create: `bruno/medmate/clinic/list-patients.bru`
- Modify: `Makefile`

**Interfaces:**
- Consumes: `AccessTokens.issue` and `AccountPrincipal` from Task 1, `ClinicRouting` and `GrantChecker` from Task 2, `PatientList` from Task 3.
- Produces: the sign-in path for a clinic account, and the Bruno requests the rest of the repo's tests use.

- [ ] **Step 1: Write the failing test**

`ClinicApiIT` provisions a second clinic itself - a second database, a second registry row and one patient - and then proves: a doctor signs in through `/auth/otp/send` and `/auth/otp/verify` with `accountType: "clinic"` and receives a session whose token carries the clinic id; `GET /clinic/patients` with that token returns the demo clinic's patients; the same token against the second clinic's registry row returns the second clinic's one patient and never the demo clinic's; a front desk account receives the same list with the clinical fields absent; an account with no grants receives 403; a token from a clinic with no registry row receives 503 `Clinic records are unavailable`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/apps/medmate-clinic-api && ./mvnw -q -pl medmate-clinic-api-app -Dtest=ClinicApiIT test`
Expected: FAIL, the clinic account cannot be signed in yet.

- [ ] **Step 3: Implement the sign-in path, the seeds and the Bruno requests**

The integration test provisions its own databases and registry rows. `Makefile` gains a `db-clinic-local` target that creates the demo clinic database and its registry row, so a developer can run the service against a seeded clinic. The four Bruno requests follow the shape of the existing identity requests, reusing `examplePhone`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/apps/medmate-clinic-api && ./mvnw -q -pl medmate-clinic-api-app -Dtest=ClinicApiIT test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/apps/medmate-server packages/apps/medmate-clinic-api bruno Makefile
git commit -m "Sign clinic accounts in and serve two clinics from two databases"
```

---

### Task 5: The doctor portal skeleton

**Files:**
- Create: `packages/apps/doctor/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `eslint.config.js`, `.prettierrc`
- Create: `packages/apps/doctor/src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/app/apiClient.ts`
- Create: `packages/apps/doctor/src/styles/globals.css`, `src/constants/index.ts`, `src/types/index.ts`
- Create: `packages/apps/doctor/src/components/ui/` (button, input, card, badge, chip, skeleton)
- Create: `packages/apps/doctor/src/lib/cn.ts`
- Create: `packages/apps/doctor/project.yaml`
- Test: `packages/apps/doctor/src/app/apiClient.test.ts`

**Interfaces:**
- Consumes: nothing from later tasks.
- Produces: `apiBaseUrl()` returning the base URL for RTK Query. A Redux `api` slice with the auth endpoints `sendOtp`, `verifyOtp`, `setPin`, `signOut` and the clinic endpoints `getMe` and `listPatients`. A Redux `auth` slice holding `session: { accessToken, refreshToken } | null`, `step: 'phone' | 'otp' | 'pin' | 'pin-setup'` and the thunks `sendOtp`, `verifyOtp`, `setPin`, `signOut`. The Vite dev proxy maps `/auth` to `http://127.0.0.1:8080`, `/sms-mock` to `http://127.0.0.1:8090` and `/clinic-api` to `http://127.0.0.1:8091`.

- [ ] **Step 1: Write the failing test**

`apiClient.test.ts`: the base query sets `Authorization: Bearer <accessToken>` from the auth slice; the base URL is empty in development and the configured URL otherwise; the sign-in endpoints are excluded from the refresh-on-401 path.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/apps/doctor && npm test -- apiClient`
Expected: FAIL, the module does not exist.

- [ ] **Step 3: Implement the skeleton**

Copy the stack, the folder map and the boundary rules from `packages/apps/dispensary`. React 19, Tailwind v4, React Router 7, Redux Toolkit, RTK Query, React Hook Form, Zod, Vitest, Testing Library, ESLint with `eslint-plugin-boundaries`, Prettier. `globals.css` holds the clinic palette as Tailwind theme tokens. `project.yaml` declares `kind: react` and the quality gates `typecheck`, `lint`, `format`, `test`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/apps/doctor && npm test -- apiClient && npm run typecheck && npm run lint`
Expected: PASS, no type errors, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add packages/apps/doctor
git commit -m "Add the doctor portal skeleton"
```

---

### Task 6: Sign-in in the portal

**Files:**
- Create: `packages/apps/doctor/src/features/authentication/schemas/auth.schema.ts`
- Create: `packages/apps/doctor/src/features/authentication/service/auth.service.ts`
- Create: `packages/apps/doctor/src/features/authentication/components/PhoneStep/`, `OtpStep/`, `PinStep/`, `PinSetup/`
- Create: `packages/apps/doctor/src/features/authentication/index.ts`
- Create: `packages/apps/doctor/src/features/authentication/utils/otpMessage.ts`
- Test: `packages/apps/doctor/src/features/authentication/utils/otpMessage.test.ts`
- Test: `packages/apps/doctor/src/features/authentication/DoctorAuth.test.tsx`

**Interfaces:**
- Consumes: the RTK Query `api` slice, the Redux auth slice and the thunks from Task 5.
- Produces: the `authentication` feature - its Zod schemas, its `PhoneStep`, `OtpStep`, `PinStep` and `PinSetup` components, the dev OTP box, and `src/features/authentication/index.ts`.

- [ ] **Step 1: Write the failing test**

`otpMessage.test.ts`: the code is found by walking the message list from the end and matching the normalised phone, the same way the Bruno Send OTP request does.

`DoctorAuth.test.tsx`: a phone is validated by Zod and a bad phone never calls the API; sending an OTP moves to the OTP step; verifying moves to the PIN step; an account with `pinSetupRequired` moves to PIN setup; a successful PIN sign-in stores the session and lands on the home screen; in development the OTP box shows the code from `/sms-mock/messages`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd packages/apps/doctor && npm test -- authentication`
Expected: FAIL, the feature does not exist.

- [ ] **Step 3: Implement the sign-in feature**

Three steps, one component each, in the order the dispensary uses. React Hook Form with a Zod schema per step. The send and verify calls go to `/auth` on the API root with `accountType: "clinic"`. The dev OTP box reads `/sms-mock/messages` and is not rendered in a production build.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd packages/apps/doctor && npm test -- authentication && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/apps/doctor/src/features/authentication
git commit -m "Add clinic sign-in to the doctor portal"
```

---

### Task 7: The role landing screen and the patient list

**Files:**
- Create: `packages/apps/doctor/src/features/landing/components/`, `src/features/landing/index.ts`
- Create: `packages/apps/doctor/src/features/patients/components/PatientList/`, `PatientRow/`, `PatientFilters/`, `src/features/patients/index.ts`
- Create: `packages/apps/doctor/src/features/patients/service/patients.service.ts`
- Modify: `packages/apps/doctor/src/app/router.tsx`
- Test: `packages/apps/doctor/src/features/landing/Landing.test.tsx`
- Test: `packages/apps/doctor/src/features/patients/DoctorPatients.test.tsx`

**Interfaces:**
- Consumes: the auth slice from Task 6, and `GET /clinic/me` and `GET /clinic/patients` from Tasks 3 and 4.
- Produces: the `landing` and `patients` routes, and the `clinicApi` endpoints `getMe` and `listPatients`.

- [ ] **Step 1: Write the failing test**

`Landing.test.tsx`: a doctor account lands on a screen whose headline is the doctor's own summary; a nurse lands on the patients needing attention; a front desk account lands on who is waiting and what is owed; an admin lands on the clinic's patients; the screen shows no amount when the account lacks `clinic:billing:read`.

`DoctorPatients.test.tsx`: the list renders the patients of the signed-in clinic; the search filters by name; the status and due filters are sent as query parameters; an empty clinic renders an empty state and not an error; every row shows a masked phone; a row shows the patient's own detail inline, because the patient record screen is not in this slice.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd packages/apps/doctor && npm test -- landing patients`
Expected: FAIL, the features do not exist.

- [ ] **Step 3: Implement the landing screen and the patient list**

The landing screen reads `/clinic/me` for the role and the grants, and the patient list for the counts, and links each count to the patient list with the matching filter. The patient list reads `GET /clinic/patients` with `page`, `size`, `q`, `status` and `due`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd packages/apps/doctor && npm test -- landing patients && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/apps/doctor/src
git commit -m "Add the role landing screen and the patient list"
```

---

### Task 8: Local wiring and the documentation

**Files:**
- Modify: `Makefile`
- Create: `packages/docs/doctor/README.md`
- Create: `packages/docs/medmate-clinic-api/README.md`
- Create: `packages/docs/medmate-clinic-api/architecture.md`
- Modify: `packages/docs/platform/onboarding.md`

**Interfaces:**
- Consumes: every earlier task.
- Produces: the local run and verify commands, and the docs for the two new applications.

- [ ] **Step 1: Write the failing check**

Extend `scripts/medmate_contract.py` so `validate_projects` also requires `packages/docs/<name>/README.md` for every application. The five existing applications already have one, so only the two new applications fail it.

- [ ] **Step 2: Run the check to verify it fails**

Run: `make check`
Expected: FAIL, naming `doctor` and `medmate-clinic-api` as missing their README.

- [ ] **Step 3: Implement the local wiring and the docs**

`Makefile` gains `doctor` on port 3206, `clinic-api` on port 8091, `clinic-api-verify`, and `db-clinic-local` which creates the demo clinic database and the registry row. `packages/docs/doctor/README.md` follows the template: hostname, what it does, where its records are stored, where its files are stored, how it is deployed. `packages/docs/medmate-clinic-api/README.md` and `architecture.md` do the same for the service. `packages/docs/platform/onboarding.md` names the two new applications.

- [ ] **Step 4: Run everything to verify it passes**

Run: `make check && make api-verify && make clinic-api-verify && cd packages/apps/doctor && npm test && npm run typecheck && npm run lint`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add Makefile packages/docs
git commit -m "Wire the doctor portal and clinic API into local development"
```
