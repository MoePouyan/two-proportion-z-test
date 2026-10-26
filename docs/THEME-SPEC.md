# Theme spec: align the Z-Test Calculator with moepouyan.com

Same token set already applied to the Canadian Sampling Plan Tool, so the two tools read as one
family when embedded on the site. Nothing here is guessed; values come from the live site's
computed styles and its `#moe-portfolio-landing` style block.

Status: **applied**. Every change below is in the working tree.

---

## 1. Tokens

```
--brand            #0047AB          rgb(0, 71, 171)
--brand-hover      #003A8C
--brand-tint       rgba(0, 71, 171, 0.08)
--ink              #18212B
--muted            #5B6673
--secondary-text   rgba(0, 0, 0, 0.72)
--page-bg          #F5F5F5
--surface          #FFFFFF
--paper            #F7F5EF
--hairline         #D5D9DF
--success          #166534
--warning          #B45309
--danger           #991B1B
--focus-ring       #FFBF47   3px solid, 3px offset
```

Shape and motion:

```
--radius-card      24px
--radius-control   12px
--radius-pill      999px
--shadow-card      0 4px 6px rgba(0,0,0,.02), 0 10px 15px rgba(0,0,0,.03), 0 0 0 1px rgba(0,0,0,.04)
--shadow-cardHover 0 14px 28px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.05)
--ease-out         cubic-bezier(0.16, 1, 0.3, 1)
```

Type, from the one Google Fonts call the site already makes:

- **Space Grotesk 700** for every heading, in `#0047AB`, letter-spacing `-0.03em`.
- **Outfit 400/500** for body and UI, 17px / 1.5, letter-spacing `-0.01em`, in `rgba(0,0,0,0.72)`.

One title colour throughout, per the site rule. No multicoloured headings.

---

## 2. Contrast, verified

Computed against WCAG 2.1. Every pair used in the restyled UI:

| Pair | Ratio | Grade |
|---|---|---|
| `#0047AB` on white (and white on brand) | 8.44 | AAA |
| `#0047AB` on `#F5F5F5` page | 7.74 | AAA |
| `#0047AB` on brand tint `#EBF0F8` | 7.37 | AAA |
| `#18212B` on white | 16.26 | AAA |
| `#18212B` on `#F7F5EF` paper | 14.92 | AAA |
| `rgba(0,0,0,.72)` body on white | 9.29 | AAA |
| `rgba(0,0,0,.72)` body on paper | 8.52 | AAA |
| `#5B6673` muted on white | 5.84 | AA |
| `#5B6673` muted on paper / page | 5.36 | AA |
| `#166534` success on its 5% tint | 6.60 | AAA |
| `#991B1B` danger on its 5% tint | 7.64 | AAA |

Lowest value in the app is 5.36:1. Nothing falls below AA.

Two off-brand colours were removed: the chart's `#fca311` orange and `#14213d` navy, neither of
which appears anywhere on the site.

---

## 3. File-by-file, as applied

### `index.html`
- Added the Outfit + Space Grotesk Google Fonts call with `preconnect`.
- Added `meta name="description"` and `meta name="color-scheme" content="light"`.
- Replaced the Vite favicon with `/favicon.svg`, a 32x32 brand-blue tile with a white Z in
  Space Grotesk.

### `public/favicon.svg`
New file. Brand mark for the standalone page and the site iframe.

### `tailwind.config.js`
`theme.extend` now carries the full token set: `brand` / `brand-hover` / `brand-tint`, `ink`,
`muted`, `secondary`, `hairline`, `paper`, `page`, `success`, `warning`, `danger`; `font-sans`
Outfit and `font-display` Space Grotesk; `rounded-card` / `rounded-control` / `rounded-pill`;
`shadow-card` / `shadow-cardHover`; `tracking-tight` and `tracking-tighter`; `ease-site`; and the
`fadeIn` keyframe.

### `src/index.css`
- CSS custom properties for every token, mirroring the Sampling Plan Tool exactly.
- Base rules: Outfit on `html`, page background and 17px body type, Space Grotesk 700 brand-blue
  headings, amber `:focus-visible` ring.
- `.tnum` helper for tabular figures on numeric output.
- Number-input spinners hidden, so the `%` suffix is not crowded.
- The MathJax block was kept but trimmed of redundant declarations and repointed at the tokens.
- Added `prefers-reduced-motion` and `@media print` blocks.
- The old `.animate-fade-in` utility was removed in favour of the Tailwind `animate-fadeIn`
  animation. All three call sites were updated.

### `src/App.tsx`
Page background to `bg-page`. Header wrapped in a `<header>` with a pill eyebrow reading
"Significance testing", the h1 in Space Grotesk brand blue, and a subtitle in body colour. Added a
footnote line stating the test and the significance level in use, which also documents the
hardcoded alpha noted in `REVIEW.md` P3.1. Dropped the unused `React` import.

### `src/components/ZTestCalculator.tsx`
Card to `rounded-card` + `shadow-card`, lifting to `shadow-cardHover` on hover over `ease-site`.
Section dividers to `border-hairline` with wider vertical rhythm.

### `src/components/InputForm.tsx`
- The two radios became a pill segmented control: inputs are `sr-only` with a `peer`, labels carry
  `peer-checked:bg-brand peer-checked:text-white` and a `peer-focus-visible` amber ring. Same
  markup semantics, so keyboard and screen-reader behaviour is unchanged.
- Radios wrapped in a `fieldset` / `legend` instead of a bare label.
- Shared `fieldClass` and `labelClass` constants: 12px radius, hairline border, brand focus ring,
  ink text, tabular figures.
- Each group's numeric inputs sit in a `bg-paper` panel with a hairline border, which visually
  separates Group 1 from Group 2 without adding a second colour.
- Submit button is a full-width brand pill, 48px minimum height, 2px border, with a `Calculator`
  icon from lucide-react.

### `src/components/ResultsSection.tsx`
Hypotheses block to `bg-paper` in a 12px control radius. Significance banner to `success` / `danger`
tokens on a 5% tint with a matching border, replacing `green-50` / `red-50`. The two metric cards
become brand tint and paper, with the figures in Space Grotesk at 3xl and `tnum`, replacing the
blue and purple pair.

### `src/components/ChartSection.tsx`
- `Chart.defaults.font.family` set to Outfit and `Chart.defaults.color` to `#5B6673`, so axes and
  ticks match the site.
- Series palette to `['#0047AB', '#18212B']`, replacing `#fca311` and `#14213d`.
- Bars get `borderRadius: 6`, `maxBarThickness: 96`, and no border.
- Y grid to `rgba(0,0,0,0.06)`, X grid off, axis border to hairline.
- Y max capped at 100 so a high percentage no longer pushes the axis past 100%.
- Tooltip restyled: ink background, 12px corner, Space Grotesk title, no colour swatch.
- The difference annotation now draws in `#166534` or `#991B1B` in Space Grotesk 700, replacing the
  Tailwind emerald and red hexes, with top padding added so it cannot clip.
- Chart sits in a white `rounded-control` panel with a hairline border.
- Removed the unused `chartRef` and the unused `highestValue` local.

### `src/components/ExplanationSection.tsx`
Heading to Space Grotesk brand blue. Ordered-list markers in brand. Body to `text-secondary` with
`<strong>` in ink. The conclusion verdict picks up `text-success` or `text-danger` rather than a
plain semibold span.

---

## 4. Verification

- `npm run build` succeeds. Bundle: 377.50 kB JS (125.08 kB gzip), 14.91 kB CSS (3.92 kB gzip).
- Production bundle rendered and driven in headless Chromium at 1100px. Both states checked: the
  input form, and the results after calculating.
- Every new Tailwind utility confirmed present in the emitted CSS.
- No new type or lint errors. The four pre-existing `no-explicit-any` errors in `ChartSection` and
  the `react-mathjax2` declaration error are unchanged and are logged in `REVIEW.md` P4.3.

---

## 5. Later changes

Version 1.0.0 restructured the component tree while keeping every token above unchanged. The new
files (`TestSettings`, `ResultActions`, and the `ui/` primitives `SegmentedControl`, `NumberField`
and `TeX`) carry the same brand tokens, pill controls, 12px fields and 24px cards. Two additions to
the palette in use, both already in the token set and both verified in section 2: `warning`
(#B45309) for assumption warnings, and `danger` (#991B1B) for invalid field borders and messages.

KaTeX replaced react-mathjax2, so the MathJax CSS block in `src/index.css` was swapped for a short
KaTeX block that sizes the math to Outfit's baseline and keeps display equations left-aligned. See
`docs/UPGRADE.md`.
