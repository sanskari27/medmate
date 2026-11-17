# MedMate — UI Design Specification

**The contract for building anything that must look like MedMate.**

Every value here was measured from the deployed MVP
(`medmate-doctor-clinic.netlify.app`, 17 Nov 2026) — not from a design file.
The stylesheet the product ships (`styles/medmate.css` in the implementation
project) is the deployed stylesheet taken **verbatim**, so the tokens below are
the ones already in force.

---

## 1. Typography

### Font

| | |
|---|---|
| Family | `Outfit, system-ui, sans-serif` |
| Source | Google Fonts — `https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap` |
| Weights | 400, 500, 600, 700, 800 — all five are used |
| Loading | `preconnect` to `fonts.googleapis.com` + `fonts.gstatic.com`, `display=swap` |
| Fallback | `system-ui, sans-serif` |

**Outfit is the product.** It is a geometric sans with a large x-height, which is
what lets a 10px uppercase tag and a 16px card title sit on the same screen
without either of them turning muddy. Do not substitute another geometric sans
and call it close — the letterforms are the brand.

### Type scale

| Role | Size | Weight | Line-height | Letter-spacing | Colour | Class |
|---|---|---|---|---|---|---|
| Body / default | 14px | 400 | normal | normal | `#14201A` | body |
| Screen title | 22px | 700 | normal | `-0.02em` | `#14201A` | inline `h1` |
| Section heading | 15px | 700 | normal | normal | `#14201A` | inline `h2` |
| Card title | 16px | 700 | normal | normal | `#14201A` | `.st-card b` |
| Manage card title | 14.5px | 700 | normal | normal | `#14201A` | `b` |
| Nav label | 14px | 600 | normal | normal | `#D9F0E1` (mint-200) | `.nav a .lbl` |
| Station card body | 12.5px | 400 | 1.45 | normal | `#3B4842` (ink-2) | `.st-card p` |
| Secondary / meta | 12px | 400 | normal | normal | `#65726B` (muted) | `small`, `.meta` |
| Small body | 12.5px | 400 | normal | normal | `#65726B` | `.muted` |
| Uppercase eyebrow | 10px | 800 | normal | `1.2px` | `#65726B` | `.st-tag` |
| Nav section head | 10.5px | 800 | normal | `.12em` | `--mint` @ 70% | `.nav-h` |
| Count badge | 11px | 800 | normal | normal | `#1B3D29` on `#D9A648` | `.nav .count` |
| Chip | 12.5px | 600 | normal | normal | `#3B4842` | `.chip` |
| Pill button | 13px | 700 | normal | normal | `#65726B` | `.pills button` |
| Button | 14px | 700 | normal | normal | `#FFFFFF` | `.btn` |
| Small button | 13px | 700 | normal | normal | `#FFFFFF` | `.btn.sm` |
| KPI value | 30px | 800 | 1 | `-0.03em` | `#14201A` | `.kpi .v` |
| Stat value | 22px | 800 | normal | `-0.02em` | `#14201A` | `.qstat b` |
| Token chip | 13.5px | 800 | normal | normal | `#1B3D29` on `--mint-100` | `.tk` |

### Rules

- **Never** set a font-size on `body`; it is 14px and everything inherits.
- Uppercase micro-labels always carry `.12em` letter-spacing and weight 800.
  That pairing is what makes a 10px label legible at kiosk distance.
- The wordmark (`.wordmark`) is 28px / 800 with `-0.02em`; the slogan under it
  is 7.3px uppercase with wide tracking — it is a texture, not a label.

---

## 2. Colour tokens

Taken from the `:root` block, verbatim:

```css
:root {
  --forest:  #1b3d29;   /* sidebar, token chips, active nav */
  --green:   #2f7d52;   /* primary action */
  --green-700:#256b46;  /* hover, active nav row */
  --gold:    #d9a648;   /* count badges, avatars */
  --gold-ink:#855b0c;   /* gold text on gold-50 */
  --gold-50: #fdf8ea;
  --gold-100:#faedc9;
  --mint:    #8fd4a8;
  --mint-300:#bde5cb;   /* card hover border */
  --mint-200:#d9f0e1;   /* nav labels */
  --mint-100:#e9f6ee;   /* token chips, badge */
  --mint-50: #f4fbf6;
  --ink:     #14201a;   /* primary text */
  --ink-2:   #3b4842;   /* secondary text */
  --muted:   #65726b;   /* meta text */
  --faint:   #9aa59f;   /* disabled */
  --line:    #e7ece9;   /* card border */
  --line-2:  #d5ddd8;   /* chip border */
  --surface:  #ffffff;  /* card surface */
  --surface-2:#f5f8f6;  /* app background */
  --surface-3:#edf2ef;  /* pills, table headers */
  --red:     #c2392d;
  --red-bg:  #fcece9;
  --blue:    #2a5db0;
  --blue-bg: #eaf1fb;
  --sh-2: 0 4px 14px #14201a14;
  --sh-3: 0 12px 32px #14201a29;
  --side: 248px;        /* sidebar column */
}
```

Extra tones used by the icon tiles: `#6b4fb8` (purple), `#4453c4` (indigo),
`#b7832a` (gold tile).

---

## 3. Geometry

### Radii

| Value | Used by |
|---|---|
| `18px` | station cards (`.st-card`) |
| `16px` | generic cards (`.card`, `.dcard`, `.kpi`), `.nowcard` |
| `14px` | stat tiles (`.qstat`), icon tiles (`.st-ico`), notes (`.note`) |
| `12px` | buttons, nav rows, nav section heads, pills, token chips |
| `9px` | small buttons, pill buttons, search inputs |
| `999px` | count badges, chips, avatars (pill shape) |

### Borders and shadows

- Card border is **always** `1px solid var(--line)` — `#E7ECE9`.
- Chips use `1.5px solid var(--line-2)`.
- Shadows are almost never used. The base card has **no** shadow. Only
  `--sh-2` on hover, on the selected pill, and on `--sh-3` for overlays.
  A MedMate card that has a resting shadow is wrong.

### The app shell

| Element | Measurement |
|---|---|
| Sidebar column | **248px** (`--side`), collapses to 84px under 1180px |
| Sidebar background | `--forest` `#1B3D29` |
| Sidebar padding | `22px 14px` |
| Shell layout | CSS **grid**: `#app { grid-template-columns: var(--side) 1fr }` |
| Topbar | `--surface-2`, `padding: 18px 28px`, sticky, `gap: 14px` |
| Page padding | `.page { padding: 4px 28px 0 }` |
| Station grid | 3 columns, `gap: 14px` → each column **316px** at 1280px viewport |
| Main content column | 1032px at a 1280px viewport |

---

## 4. Card dimensions — the numbers that matter

Measured on the live app and reproduced exactly in the implementation:

| Component | Width | Height | Radius | Padding | Gap | Min-height | Border | Background |
|---|---|---|---|---|---|---|---|---|
| **Station card** `.st-card` | **316px** | **162px** | 18px | 18px | 6px | 150px | 1px solid `#E7ECE9` | `#FFFFFF` |
| Icon tile `.st-ico` | 48px | 48px | 14px | — | — | — | — | tone colour |
| Icon glyph `.st-ico svg` | 24px | 24px | — | — | — | — | — | `#FFFFFF` |
| Doctor card `.dcard` | auto-fill ≥300px | content | 16px | 16px | 10px | — | 1px solid `#E7ECE9` | `#FFFFFF` |
| Generic card `.card` | auto | content | 16px | 16px | — | — | 1px solid `#E7ECE9` | `#FFFFFF` |
| Stat tile `.qstat` | auto | content | 14px | 12px | — | — | 1px solid `#E7ECE9` | `#FFFFFF` |
| KPI tile `.kpi` | auto | content | 16px | 16px | 6px | — | 1px solid `#E7ECE9` | `#FFFFFF` |
| Nav row `.nav a` | 220px | **40px** | 12px | 0 12px | 12px | — | — | transparent / `--green-700` active |
| Button `.btn` | auto | **44px** | 12px | 0 18px | 8px | — | — | `--green` |
| Small button `.btn.sm` | auto | **34px** | 9px | 0 12px | 8px | — | — | `--green` |
| Icon button `.iconbtn` | **44px** | **44px** | 12px | — | — | — | 1px solid `#E7ECE9` | `#FFFFFF` |
| Chip `.chip` | auto | **32px** | 999px | 0 12px | 6px | — | 1.5px solid `#D5DDD8` | `#FFFFFF` |
| Token `.tk` | **56px** | **44px** | 12px | — | — | — | — | `--mint-100` (blue for M, gold-50 for W) |
| User chip `.userchip` | auto | 44px | 12px | 0 12px 0 5px | 10px | — | 1px solid `#E7ECE9` | `#FFFFFF` |
| Avatar `.avatar` | 38px | 38px | 12px | — | — | — | — | `--gold` |

### Card composition

A station card contains, in order:

1. `.st-ico` — a 48×48 rounded icon tile with a 24×24 glyph, `margin-bottom: 8px`
2. `b` — the card title, 16px/700
3. `p` — the description, 12.5px/400, line-height 1.45, colour `--ink-2`

plus an absolutely positioned `.st-tag` ("Step 1") at `top: 16px; right: 16px`,
10px/800, uppercase, letter-spacing `.12em`, colour `--muted`.

Gap between the three blocks is **6px**. Padding is **18px** all round.

---

## 5. Icons

**38 icons**, all 24×24, `viewBox="0 0 24 24"`, `class="i"`, `aria-hidden="true"`,
rendered as inline SVG with `stroke="currentColor"`, `fill="none"`,
`stroke-width="1.7"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

The complete set with byte-exact path data is in the implementation project at
`js/icons.js` (and in `assets/icons.json`).

| Name | Name | Name | Name |
|---|---|---|---|
| `queue` | `rx` | `folder` | `pill` |
| `rupee` | `users` | `out` | `check` |
| `inbox` | `send` | `lab` | `cal` |
| `x` | `plus` | `alert` | `shield` |
| `spark` | `pen` | `search` | `up` |
| `phone` | `mic` | `video` | `chart` |
| `copy` | `cert` | `kiosk` | `more` |
| `print` | `hand` | `home` | `nurse` |
| `stetho` | `pin` | `gear` | `back` |
| `chev` | `lock` | | |

**Rules**

- One icon set, one geometry. Do not mix in a second icon library.
- Icons sit at 20px in navigation, 24px inside a 48px tile, 14–16px inline in
  text.
- Always `aria-hidden="true"` — the adjacent label carries the meaning. An icon
  that is the only content of a control needs an accessible name on the control,
  not on the SVG.
- Selection state is **never** conveyed by colour alone. Pair it with a label
  change, a border change, or `aria-pressed`.

---

## 6. Motion

| Keyframe | Use |
|---|---|
| `sp` | `.spinner` — 0.8s linear infinite rotation |
| `pop` | small entry emphasis |
| `tcpulse` | live/urgent indicators |

`@media (prefers-reduced-motion: reduce)` exists in the stylesheet but only
currently covers `.tc-live i`. **When you add an animation, extend the
reduced-motion block in the same change.** The kiosk is a public-facing surface
and it animates continuously — that is the audit finding F-209 / roadmap F-209.

---

## 7. Breakpoints

`420 · 560 · 640 · 720 · 760 · 820 · 900 · 1000 · 1100 · 1180` (max-width)
and `1181px` (min-width). At ≤1180px the sidebar collapses to an 84px icon
rail with `--side: 84px`, the station grid drops to 2 columns, then to 1 below
900px.

---

## 8. Fidelity rules for new work

1. **Reuse the class vocabulary.** The app has ~1049 classes with a consistent
   naming language (`.st-` station, `.q-` queue, `.kiosk-` kiosk, `.d-` doctor,
   `.kpi`, `.card`, `.btn`, `.chip`, `.pills`, `.note`, `.badge`, `.avatar`).
   Use it. A new one-off class is how a product drifts.
2. **Never hardcode a colour.** Use the token. The only literal hex values in
   the stylesheet are the ones already in the `:root` block plus the five icon
   tones.
3. **Never add a resting shadow.** Cards are flat with a 1px border. `--sh-2`
   is for hover, `--sh-3` for overlays.
4. **Card geometry is fixed.** 316×162 for a station card, 18px radius, 18px
   padding, 6px gap, 150px min-height. If a new card type needs different
   numbers, it is a new type — do not bend `.st-card`.
5. **Every micro-label is 10–11px, weight 800, uppercase, tracked out.** That is
   the app's signature texture.
6. **Test at 1280×720.** That is the reference viewport the geometry above was
   measured at.
7. **Verify by measurement, not by eye.** The implementation ships a fidelity
   check that compares computed styles against the live app — see
   `MedmateApp/README.md`.

---

*Measured 17 November 2026 from the deployed MVP. The stylesheet these values
come from is shipped verbatim in the implementation project at
`MedmateApp/styles/medmate.css`.*
