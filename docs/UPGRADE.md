# Upgrade: what changed and why

Version 1.0.0, 20 September 2026. Closes every item in `docs/REVIEW.md`. The theme work is
documented separately in `docs/THEME-SPEC.md` and is unchanged by this pass apart from the new
components picking up the same tokens.

---

## 1. Correctness

### Sample size of 0 no longer returns "no significant difference" (REVIEW P1.1)

Validation moved out of the calculation and into `src/utils/inputs.ts`. Nothing reaches
`calculateZTest` until every field parses and passes its range check, so the infinite standard
error that produced Z = 0 and p = 1.0 cannot occur. Invalid fields show an inline message and the
results panel explains that it is waiting on them.

Rules enforced: base at least 1, percentage between 0 and 100, success count between 0 and the
base, effective base between 1 and the nominal base, design effect between 1.00 and 20.

### Out-of-range input no longer prints NaN (REVIEW P1.2)

Same mechanism. A pasted 150% is caught before `p̂` can exceed 1 and turn the square root negative.
There is now a unit test for each of these cases.

### The explanation reproduces its own result (REVIEW P1.3)

Derived success counts are no longer rounded for display. `formatCount` keeps two decimals whenever
the value is fractional, and when that happens the section says so. Proportions are shown to four
decimals and standard errors to five, so every printed line multiplies out to the printed answer.

### p-values stay accurate in the far tail (REVIEW P3.4, item 3)

`normalSF` was `1 - normalCDF`, which loses everything to cancellation and returns exactly 0 past
about Z = 6. It now computes the upper tail directly from `erfc`, using the Numerical Recipes
Chebyshev approximation. The earlier example that showed "< 0.0001" now reports
p = 7.36 x 10⁻²⁷, which matches Python's `math.erfc` to five significant figures.

---

## 2. Behaviour

### Fields can be cleared (REVIEW P2.1)

Every numeric field holds a string, not a number. The old guard skipped the setter whenever
`parseFloat` returned NaN, so deleting the last character snapped the previous value back. Parsing
happens once, in validation.

### Results can no longer be stale (REVIEW P2.2)

The app opens with empty fields and no results, and nothing is computed until Calculate is
pressed. The inputs are snapshotted at that moment; if any of them change afterwards the results
dim, a banner says they are from the previous run, and the button becomes Recalculate. So the
figures on screen are either current or visibly marked as not current, and the old failure of
showing a previous run's numbers as though they were live is closed.

Field errors stay hidden until the first Calculate, then update live as they are corrected, so an
untouched form is never covered in red. A Clear action resets everything, and the three examples
fill the fields only, leaving the run to you.

### Export (REVIEW P2.3)

Three actions under the results:

- **Copy summary** puts a report-ready paragraph on the clipboard: both groups with their bases and
  effective bases, the hypothesis, the difference with its interval, Z, p, Cohen's h, the verdict
  and any warnings.
- **CSV** downloads every figure including the intermediate ones, named after the two groups.
- **Chart PNG** saves the comparison chart at 1x from the Chart.js canvas.

### Examples and framing (REVIEW P2.4)

Three presets, which fill the fields without running the test: a straightforward regional
comparison, a weighted tracker where the effective base changes the verdict, and a small-base case
that trips the normal-approximation warning. The subtitle now says what the tool is for.

### Mode switching preserves data

Previously percentage mode and counts mode kept separate sample sizes, which could disagree. There
is now one base, and switching modes converts the figure you already entered.

---

## 3. Statistical capability

### Confidence level and direction (REVIEW P3.1)

90 / 95 / 99, one- or two-tailed. The alternative hypothesis is chosen explicitly when one-tailed,
rather than inferred from the observed direction, and the hypothesis text, the verdict, the
critical value and the interval all follow the selection. Nothing hardcodes 0.05 any more.

### Confidence interval and effect size (REVIEW P3.2)

The interval uses the **unpooled** standard error, a different quantity from the pooled SE the test
statistic uses. It is reported in percentage points alongside the point estimate, and the card says
whether the interval spans zero.

Cohen's h is reported with its conventional label, so a trivial gap on a very large base reads as
negligible even when p is small.

### Effective base (REVIEW P3.3)

A weighting toggle accepts either a Kish effective base or a design effect, per group. When on:

- The pooled proportion is computed on the effective bases.
- Both standard errors use the effective bases.
- The nominal base is still shown, and a note states both bases and both design effects.
- The explanation gains a step showing `n_eff = (Σw)² / Σw²` and the resulting deff.

The bundled weighted example demonstrates the point: 38.4% versus 43.1% on nominal bases of 1,000
is significant, and on effective bases of 781 and 763 it is not.

### Assumption checks (REVIEW P3.4)

- Warns when `n·p` or `n·(1-p)` is below 5 in either group, naming the group and pointing at
  Fisher's exact test.
- Warns when a base is below 30.
- A standing note that the test assumes independent samples, with the two crosstab cases that break
  it: subgroup against a containing total, and two codes from one multi-response question.

---

## 4. Dependencies and code quality

### react-mathjax2 replaced with KaTeX (REVIEW P4.1)

The old library was unmaintained since 2018, loaded MathJax 2.7 from a CDN at runtime, and was
configured with MathJax 3 keys. When the CDN was unreachable the whole explanation section
disappeared. KaTeX is now bundled, so the formulas render with no network request. A thin
`ui/TeX.tsx` wrapper calls `renderToString` with `throwOnError: false`, and group names are
sanitised before they enter a `\text{}` block.

### Chart plugin scoped to its chart (REVIEW P4.2)

The difference annotation was registered globally with `Chart.register` inside an effect. It is now
passed through the `plugins` prop of the one chart that uses it, and the Chart.js registration is
explicit per component rather than `...registerables`.

### Type and lint errors cleared (REVIEW P4.3)

`tsc -b` and `eslint .` both pass with no errors. `npm run build` now runs the typecheck first, so
a type error fails the build instead of shipping.

### Tests (REVIEW P4.4)

`npm run test` runs 20 Vitest cases over the statistics and validation layers: known normal values,
far-tail accuracy, a hand-checked case verified against Python, group-swap symmetry, interval
behaviour, the one-tailed halving relationship, the effect of weighting, the assumption checks,
every validation rule, and agreement between the two input modes on the same data.

---

## 5. Project hygiene (REVIEW P6)

- `package.json` renamed to `two-proportion-z-test`, version 1.0.0, with `typecheck`, `test` and
  `test:watch` scripts added.
- `README.md` rewritten: what the tool does, the method, how to run it, where it deploys.
- `netlify.toml` added with the build command, SPA redirect, asset caching and a
  `frame-ancestors` policy that keeps the moepouyan.com iframe embed working.
- `public/favicon.svg` added in the theme pass.

---

## 6. Build

Vendor code is split into its own chunks, so the 500 kB warning is gone and the app chunk is small
enough to invalidate on its own between deploys.

```
index   40.0 kB   gzip  13.1 kB   app code
react  140.9 kB   gzip  45.3 kB
chart  154.6 kB   gzip  53.9 kB
katex  258.3 kB   gzip  77.5 kB
css     45.9 kB   gzip  12.3 kB
```

KaTeX is the cost of removing the CDN dependency. It is cached separately and never changes between
deploys.

---

## 7. Verified

- `npm run test` — 20 passed.
- `npm run lint` — no errors.
- `tsc -b` — no errors.
- `npm run build` — succeeds, no warnings.
- Production bundle driven in headless Chromium across the full flow: opens with no results and no
  error styling; Calculate on an empty form flags four fields and explains why; loading an example
  fills the fields without running the test; Calculate produces results; editing an input marks
  them stale and relabels the button Recalculate; Recalculate updates them; Clear resets
  everything. No console or page errors. Fields confirmed clearable.
