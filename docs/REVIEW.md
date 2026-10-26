# Review: Two-Proportion Z-Test Calculator

**Status: all findings below were fixed in version 1.0.0 on 20 September 2026.** See
`docs/UPGRADE.md` for what changed in each case. This document is kept as the record of what was
wrong and why it mattered.

Reviewed 20 September 2026 against the original source at `src/`, with the production bundle built
and driven in a headless browser. Findings are ordered by priority.

---

## What the app already gets right

- The core test is the correct one. Pooled proportion for the standard error, unpooled difference
  in the numerator, two-tailed p-value. That is the textbook two-proportion Z-test.
- Verified against a known value: at Z = 1.96 the app returns p = 0.049996 (true value 0.0499958).
- Percentage mode and success-count mode both resolve to the same internal representation, so the
  two paths cannot drift apart.
- The step-by-step section showing the actual arithmetic is the differentiator. Most online
  calculators return a number and nothing else.

---

## P1. Correctness: three inputs produce a confident wrong answer

### 1.1 A sample size of 0 reports "no significant difference"

`calculateZTest` does not guard `n`. With `n1 = 0`:

```
se  = sqrt(p̂(1-p̂)(1/0 + 1/n2)) = Infinity
z   = (p1 - p2) / Infinity      = 0
p   = 1.0
```

The UI then renders a clean red banner reading "No Significant Difference (p >= 0.05)". There is no
NaN, no error, nothing to signal that the input was invalid. This is the worst failure mode in the
app because it is silent and plausible.

**Fix:** reject `n < 1` before calculating and surface a field-level error.

### 1.2 Out-of-range percentages produce NaN on screen

`min` and `max` on a number input constrain the spinner, not typed or pasted text. Enter 150% and
`p̂` exceeds 1, `p̂(1-p̂)` goes negative, and `Math.sqrt` returns NaN. The results card then prints
`NaN` for both the Z-statistic and the p-value.

Same class of failure in counts mode when `x > n`.

**Fix:** clamp and validate on change, `0 <= p <= 100` and `0 <= x <= n`, with an inline message.

### 1.3 The displayed arithmetic does not reproduce the displayed result

In percentage mode `x = (p/100) * n` is usually fractional, and the explanation prints it with
`x1.toFixed(0)`. For 45.5% of 333 the section shows

```
p̂ = (152 + ...) / (333 + ...)
```

while the pooled proportion actually used 151.515. The stated numbers do not multiply out to the
stated answer. In a tool whose selling point is showing the working, that is the one thing that has
to be exact.

**Fix:** either carry three decimals through the explanation, or round the successes once at input
and use the rounded value in the calculation as well so the two agree.

---

## P2. Behaviour and usability

### 2.1 A number field cannot be cleared

```ts
const value = parseFloat(e.target.value);
if (!isNaN(value)) setter(value);
```

Backspacing the last character gives `''`, `parseFloat` returns NaN, the setter is skipped, and the
controlled input immediately re-renders with the old value. In practice you cannot select-and-delete
to retype; you have to overtype. This is the single most noticeable rough edge in daily use.

**Fix:** hold the field as a string in state, allow the empty string, and parse only at calculate
time (or in a `useMemo` derived value).

### 2.2 Results go stale without saying so

Results are computed on button click and stored. Change a percentage afterwards and the results
card, the chart and the step-by-step section all keep showing the previous run, including the
previous group names. Nothing marks them as out of date.

**Fix:** either recompute live from a derived value (the calculation is trivial, so there is no
reason to gate it behind a button), or dim the results and show a "recalculate" prompt when any
input changes after a run.

### 2.3 No way to get the result out of the app

There is no copy-to-clipboard summary, no CSV, no chart image. Your other portfolio tools all
export. For a crosstab workflow the useful export is a one-line summary that can be pasted into a
report: group names, bases, percentages, Z, p, and the verdict.

### 2.4 No worked example or preset

A first-time visitor sees Group 1 and Group 2 with default numbers and no context for what the tool
is for. A single "Load example" preset with meaningful labels, and one line saying what kind of
question this answers, would carry the portfolio framing better.

---

## P3. Statistical capability

These are the four additions you flagged. None are implemented yet.

### 3.1 Confidence level selector, and one- vs two-tailed

Significance is hardcoded at 0.05 in `statistics.ts` (`const significant = pValue < 0.05`) and the
banner text hardcodes "p < 0.05" as a string. Commercial crosstab software exposes at least 90 / 95
/ 99 and a direction.

**Shape:** add `alpha: 0.10 | 0.05 | 0.01` and `tails: 1 | 2` to the inputs, thread them into
`calculateZTest`, and derive the banner copy rather than hardcoding it. One-tailed p is
`normalSF(z)` when testing the stated direction, not `2 * normalSF(|z|)`.

### 3.2 Confidence interval on the difference, plus effect size

The app reports whether the difference is real but not how large it plausibly is. Note that the CI
uses the **unpooled** standard error, which is a different quantity from the pooled SE used in the
test:

```
SE_unpooled = sqrt( p1(1-p1)/n1 + p2(1-p2)/n2 )
CI          = (p1 - p2) ± z_(1-α/2) * SE_unpooled
```

Effect size, Cohen's h, is independent of sample size and is what stops a trivial 1.5-point gap on
n = 4,000 from being read as important:

```
h = 2*asin(sqrt(p1)) - 2*asin(sqrt(p2))     small 0.20, medium 0.50, large 0.80
```

Reporting the CI alongside the p-value is the single highest-value addition on this list.

### 3.3 Effective base for weighted data

This is the gap that matters most for your own work. Rim-weighted crosstab percentages tested at
their nominal base overstate significance, because weighting inflates the variance. The standard
correction is Kish's effective sample size:

```
n_eff = (Σw)² / Σw²           design effect  deff = n / n_eff
```

**Shape:** add an optional "weighted data" toggle per group that accepts either the effective base
directly or a design effect, and substitute `n_eff` for `n` in the standard error while keeping the
nominal base for display. Label the output clearly, for example "tested on effective base 312 of
nominal 400, deff 1.28". Most free calculators do not do this, so it is a genuine differentiator
for a market research portfolio.

### 3.4 Assumption checks and warnings

Three checks, none currently present:

1. **Normal approximation validity.** Warn when `n·p̂ < 5` or `n(1-p̂) < 5` in either group, and
   point to Fisher's exact test as the alternative.
2. **Independence.** The two-proportion Z-test assumes independent samples. Testing a subgroup
   against a total that contains it, or two overlapping multi-response codes, violates this and
   biases the test toward "not significant". A short warning near the group-name fields would stop
   the most common misuse of this kind of tool.
3. **p-value floor.** `normalSF` is computed as `1 - normalCDF`, which loses precision to
   cancellation. Beyond roughly Z = 6 it returns exactly 0. The display currently masks this as
   "< 0.0001", which is fine, but if you ever surface the raw p-value, compute the upper tail
   directly rather than by subtraction.

---

## P4. Dependencies and code quality

### 4.1 `react-mathjax2` is the weakest link

- It is unmaintained (last release 2018) and loads MathJax 2.7 from a third-party CDN at runtime.
- The options object passed in `ExplanationSection.tsx` uses MathJax **3** config keys
  (`tex: { inlineMath }`) against a MathJax **2** loader, so it is very likely inert.
- Verified in the headless run: when the CDN is unreachable the page throws
  `MathJax is not defined` and the entire Step-by-Step Explanation section renders as nothing. Not
  degraded, gone. The most valuable part of the app depends on an external request succeeding.

**Fix:** move to KaTeX bundled locally (`katex` plus `react-katex`, roughly 270 kB self-hosted, no
runtime CDN call), or drop the library and render the formulas as styled HTML with Unicode. Either
way the section must survive with no network.

### 4.2 The chart annotation is registered globally

`ChartSection` calls `Chart.register(customPlugin)` inside a `useEffect`, so the "Difference: x%"
plugin is attached to every Chart.js instance in the app and re-registered on each prop change. It
works today because there is one chart. Pass it through the `<Bar plugins={[...]} />` prop instead.

### 4.3 Lint and type errors in the repo as it stands

```
tsc:    ExplanationSection.tsx(2,21) TS7016  no declaration file for 'react-mathjax2'
eslint: ChartSection.tsx  4x @typescript-eslint/no-explicit-any
```

`npm run build` is `vite build` only, so neither fails the build. Add `tsc -b --noEmit` to the build
script so type errors cannot ship.

### 4.4 No tests

`statistics.ts` is pure and small, which makes it the easiest thing in the project to test and the
most costly to get wrong. Four Vitest cases would cover it: a known Z/p pair, symmetry
(swapping groups flips the sign of Z and leaves p unchanged), percentage mode and counts mode
agreeing on the same data, and the n = 0 guard once 1.1 is fixed.

---

## P5. Accessibility

- Results appear below the button with no `aria-live` region and no focus move, so a screen reader
  user gets no signal that anything happened. Wrap the results block in
  `role="status" aria-live="polite"`.
- The chart has no text alternative. Add a visually hidden summary, or the same numbers as a small
  table, so the comparison is not image-only.
- Colour contrast is now clean across the board. Every pair in the restyled UI is AA or better;
  the lowest is muted grey on the paper background at 5.36:1. Full table in `docs/THEME-SPEC.md`.

---

## P6. Project hygiene

- `package.json` name is still `vite-react-typescript-starter`. Rename to `two-proportion-z-test`.
- `README.md` is the Bolt stub. It should say what the tool does, how to run it, and where it is
  deployed, matching your other tool repos.
- No `netlify.toml`. The other tools deploy to Netlify; add the build command and publish directory
  so the deploy is reproducible.
- No `public/` assets existed before this pass. A `favicon.svg` has been added (brand blue tile,
  white Z) so the embedded iframe and the standalone page carry the site mark.

---

## Order of work, as carried out

1. P1.1 and P1.2, input validation. Silent wrong answers first.
2. P2.1, the clearable field.
3. P3.2, confidence interval and effect size.
4. P4.1, replace `react-mathjax2` with bundled KaTeX.
5. P3.1 and P3.4, confidence level selector and assumption warnings.
6. P3.3, effective base and design effect.
7. P2.2 and P2.3, live recalculation and export.
8. P4.4, P5 and P6, tests, accessibility and repo hygiene.

All eight are done. `npm run test` covers the statistics and validation layers with 20 cases,
`npm run lint` and `tsc -b` are clean, and `npm run build` runs the typecheck first.
