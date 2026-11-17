# React for MedMate — technical assessment

**Date:** 17 November 2026
**Scope:** which frontend framework should MedMate's real codebase be built on?

---

## 0. The question is smaller than it looks

Before weighing frameworks, the evidence says **React is already the framework in
production**. The deployed MVP (`medmate-doctor-clinic.netlify.app`) was
analysed from its own bundle:

| Evidence | Finding |
|---|---|
| `self.__next_f` flight payload in the client chunks | React Server Components — **Next.js App Router** |
| `turbopack-*.js` chunk naming, `turbopack=!0` | Next 16 on **Turbopack** |
| Version string in the flight payload | **Next.js 16.3.8** |
| `useState` / `useEffect` / `useRef` in the client bundle | **React 19** (ships with Next 16) |
| `tailwindcss` — **0 matches** in the CSS and every chunk | **No Tailwind.** 168 KB hand-written CSS, ~1,049 classes, 30 CSS custom properties |
| `recharts`, `@tanstack/*`, `react-table`, `swr`, `@radix-ui`, `react-hook-form`, `zod`, `date-fns` — **0 matches each** | **Zero UI dependencies.** Charts, tables, forms and dates are all hand-rolled (`.se-ring`, `.rp-heat`, `.hbar-track`, `.tbl`, `.grid-wrap`) |

So the real question is not *"should we adopt React?"* but:

> **Do we keep React (matching what is deployed and what the team knows), or
> pay a rewrite to move off it?**

And a second, cheaper question:

> **The current workspace build (vanilla ESM + Node) is not React. Is that a
> problem?**

**Short answers:** React is the right call for the product. And the current
build is a legitimate *reference implementation*, but it should not become the
long-lived product codebase unless you consciously want a zero-framework
stack.

---

## 1. Where React is genuinely strong for MedMate

**1.1 It is the status quo, so the rebuild converges instead of diverging.**
The demo, the Netlify target, the deployment story and any future teammate's
knowledge all assume Next.js. A React rebuild lands on the same rails; a
rewrite to anything else means two stacks, two deploy pipelines and two
mentality models for a product whose whole point is being trusted with medical
data.

**1.2 The product's state is server state, and React's ecosystem solves it
properly.** MedMate's screens are mostly live views of the clinic, not local
editors: the 10-second queue refresh, role capabilities, invoices, the
schedule grid. Getting that right by hand is where real bugs live. I wrote
this codebase's data layer by hand and it produced real defects — a loader
receiving `URLSearchParams` where it expected a `URL`, a session helper
returning a copy so kiosk lockdown silently did not persist. **TanStack Query**
makes that whole class of bug impossible: query keys, caching, invalidation
after "collect fee" or "sign prescription", background refetch, and stale-while-
revalidate all become declarative.

**1.3 Five role dashboards × ~20 screens is exactly what components are for.**
One shell, one navigation model, and per-role landing pages. The server already
owns the capability model (`GET /api/me` → `can: { manage, records, billing,
vitals, queue }`), so role-aware rendering is one `useMe()` hook, not five
copies of conditional markup.

**1.4 The forms are the product.** The consultation form (complaints → exam →
diagnosis → medicines → tests → advice → follow-up) is the highest-traffic form
in any clinic software. **React Hook Form + Zod** gives uncontrolled inputs
(so typing does not re-render the whole form), schema validation, and typed
values that flow straight into the safety checks. This is exactly where React
pays for itself.

**1.5 Accessibility is a known audit finding, not a nice-to-have.**
Finding **F-209** is that the kiosk has no accessible names, conveys
selection with a CSS class alone, and has no `aria-pressed`. **Radix UI** or
**React Aria** primitives deliver focus management, roles, keyboard behaviour
and announcements for free. Hand-rolling that for a kiosk is a poor use of
anyone's time.

**1.6 The things the MVP hand-rolled are exactly what the ecosystem has.**
The MVP ships its own conic-gradient rings (`.se-ring`), heatmap cells
(`.rp-heat`), horizontal bars (`.hbar-track`), tables (`.tbl`), and date
handling. **Recharts** or **ECharts**, **TanStack Table**, and **date-fns**
replace that code with something maintainable.

**1.7 Printing is a hard requirement.** Prescriptions print on letterhead.
**react-to-print** (or `@react-pdf/renderer`) handles the print stylesheet and
the paper format properly.

**1.8 Ecosystem and hiring.** React has the deepest talent pool and the most
examples of "clinical/regulated software built in React".

---

## 2. Where React is genuinely weak for MedMate

**2.1 Bundle weight on exactly the hardware that matters.**
Next 16 + React 19 + router + TanStack Query ≈ 90–120 KB gzip before any
screen code. MedMate's kiosk runs on entry-level Android tablets over clinic
wi-fi or 3G. The current vanilla build ships **0 KB of framework**. This is a
real, measurable regression for the one screen where a patient is waiting.

*Mitigations:* keep the kiosk route dependency-light (route-level code
splitting, `next/dynamic` for the kiosk, a separate static kiosk bundle, or
Preact for that route only). Do not ship the admin bundle to the kiosk.

**2.2 SSR buys almost nothing for 90% of the product.**
Everything except `/book` and `/portal` sits behind a login. For those
screens, App Router's server/client boundary, RSC waterfalls, `"use client"`
on nearly everything, and hydration cost are complexity without benefit. The
MVP already pays this tax; a rewrite should not pay it twice.

**2.3 App Router data waterfalls.**
A landing page that needs the queue, invoices, the day close and staff activity
will run four sequential server fetches unless you use `Promise.all`, Suspense
boundaries or client-side queries. This is the most common App Router
performance trap, and it is invisible until the clinic is large.

**2.4 The framework is not where the risk is.**
The RBAC model, the clinical safety rules (F-311), the rate limiter (F-107),
the ABHM/FHIR integration and the data-export promise are **domain and backend
work**. React is maybe 15% of the total effort of MedMate. Spending the
remaining budget on the framework instead of on those guarantees is a bad
trade, whichever framework wins.

**2.5 Moving costs more than it looks.**
A framework rewrite is not "port the components". It is: re-implement routing
and data loading, re-implement every form's validation, re-implement print,
re-implement the kiosk's device-mode behaviour, and re-earn the visual
fidelity that took real work to match (the current build is **38/38 measured
CSS properties and 0 drift** against the live MVP).

**2.6 Version churn.** React 19 + Next 16 + Turbopack is a fast-moving stack,
and the MVP sits on a very recent major (16.3.8). App Router has broken
routinely between majors. Pin exact versions and expect periodic migration
work.

---

## 3. Alternatives, scored for *this* product

| Option | Fit for MedMate | Effort / risk | Verdict |
|---|---|---|---|
| **Next.js 16 + React 19 + TS** (the deployed stack) | **High** — same stack, same Netlify target, same visual language; SSR where SEO matters (/book, /portal) | Rewrite of the current build; bundle weight on the kiosk | **Recommended** |
| **React SPA (Vite) + separate API** | Medium — fine for the admin app, but `/book` and `/portal` would ship an empty HTML shell (bad for patients searching "book doctor online") | Simpler mental model, one less server | Only if public-page SEO is not a goal |
| **Vue 3 + Vite (+ Nuxt for the public pages)** | Good — smaller runtime, `<script setup>` ergonomics, Pinia, first-class router | Full rewrite, loses Next continuity | A credible alternative, not a better one here |
| **Svelte / SvelteKit** | Good DX, smallest runtime | Thinner ecosystem for tables, forms, print, a11y; smaller talent pool | Not worth the migration now |
| **Angular** | Strong for regulated teams: typed reactive forms, strict change control | Heavy for a small team; the ceremony costs more than it returns today | Right answer at 15+ engineers, wrong today |
| **Preact + Vite** | ~90% of React DX at ~4 KB | React-specific libs need aliases | A good **perf escape hatch for the kiosk bundle**, not a whole-stack choice |
| **HTMX + server-rendered pages** | Excellent for forms, lists and printing; almost no JS; degrades gracefully on a bad connection | Awkward for the live queue, the prescribing UI and the kiosk | Consider for the **patient portal only** |
| **Vanilla ESM (the current build)** | Fast, dependency-free, pixel-exact | You hand-build the data grid, forms, charts, a11y and caching — and you own those bugs forever | Excellent **reference implementation and test harness**; a poor long-term product codebase |
| **SolidJS / Qwik / Angular (others)** | Viable; Qwik's resumability is interesting for the kiosk's hydration cost | Small ecosystems for this domain | Not compelling over the status quo |

---

## 4. Recommendation

### 4.1 Stack

**Next.js 16.3.8 + React 19 + TypeScript (strict), deployed on Netlify** — the
same stack the MVP already runs, so the rebuild converges on the product
rather than splitting away from it.

| Concern | Choice | Why |
|---|---|---|
| Styling | **Keep the product's hand-written CSS** | It is the brand: 1,049 classes, 30 tokens, measured to 0 drift. Do **not** introduce Tailwind unless you budget a deliberate visual migration. |
| Server state | **TanStack Query** | The 10-second queue refresh, cross-screen invalidation, and role-scoped caches. Removes a whole class of bug. |
| Forms | **React Hook Form + Zod** | The consultation form is the product's hottest path; schemas are shared with the server for the safety checks. |
| Data grids | **TanStack Table** | Patient ledger, schedule, reports, activity log — all currently hand-rolled `.tbl` markup. |
| Accessibility | **Radix UI or React Aria** | Closes audit finding F-209 (kiosk has no accessible names today). |
| Printing | **react-to-print** | Prescription paper with letterhead is a hard requirement. |
| Charts | **Recharts** (or ECharts) | Replaces the hand-rolled `.se-ring` / `.rp-heat` / `.hbar-track`. |
| Dates | **date-fns** | The schedule, the ledger, the reports. |
| Forms validation | **Zod** | One schema, used by the client form and the server route. |
| Tests | **Vitest + React Testing Library + MSW**; **Playwright** for the five role journeys and the kiosk flow | The HTTP test suite that exists today becomes the contract. |
| Deployment | **Netlify** | Same as the MVP. |

### 4.2 Do not let the framework rewrite invalidate what already works

The current build has **61 API endpoints** and **76 passing tests** covering
the RBAC matrix, the clinical safety rules, the rate limiter and every role's
access. Those are **framework-independent**. They are the specification.

**The professional way to do the React port:**

1. Freeze the API contract (the 61 routes) and the RBAC matrix. Both are
   already verified.
2. Port the screens one by one, running the **existing HTTP suite against
   the React app's backend** as the acceptance gate.
3. Run the fidelity check (`verify/check-fidelity.js`) on every screen: 38
   measured properties, 0 drift, 0 unknown glyphs.
4. Migrate one route at a time behind a flag; the vanilla screens stay until
   their React replacement passes.

### 4.3 The kiosk deserves its own decision

The kiosk is the public face of the product and runs on the worst hardware.
Options, in order of preference:

1. **Isolate it** — a separate static bundle with no framework (the current
   vanilla approach) or Preact, served from its own route. The kiosk needs
   almost no interactivity beyond a keypad and a countdown.
2. **Next route, lazy-loaded** — acceptable if the clinic tablets are modern.
3. **Do not ship the admin bundle to the kiosk** — ever.

### 4.4 What would change the recommendation

| Signal | Then |
|---|---|
| The kiosk must run on ₹8k tablets over 3G | Preact or a framework-free kiosk bundle; React for the admin app only |
| The team passes ~10 engineers and regulated clients demand typed forms + change control | Angular becomes defensible |
| The public portal becomes the primary growth engine and SEO is the metric | Keep Next SSR — do **not** move to an SPA |
| The clinic market shifts to a single large customer with a bespoke workflow | Consider htmx + server-rendered pages for the admin app too; the interactivity here is mostly forms and lists |

---

## 5. Bottom line

- **React is already the answer for MedMate.** The deployed product is
  Next.js 16 + React 19. Adopting anything else is a rewrite with no
  demonstrated return.
- **React's real weaknesses here are bundle weight on cheap kiosk hardware and
  SSR complexity on an app that is 90% behind a login.** Both are solvable
  with route isolation, not with a different framework.
- **The framework is not the risk.** The risk is the clinical safety rules,
  the RBAC matrix, the ABDM/FHIR integration and the export promise — all
  backend work that a framework change does not touch.
- **The current build should be kept as the reference implementation and the
  test harness.** It proves the contract works and it measures the visual
  fidelity. A React port should be judged against it, not replace it blindly.

*Evidence gathered 17 November 2026 from the deployed MVP's own bundle and
stylesheet; see `MEDMATE-PRODUCT-AUDIT.md` for the full audit.*
