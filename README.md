# Two-Proportion Z-Test Calculator

Tests whether the gap between two percentages is statistically significant, and shows the working.
Built for survey crosstab analysis: weighted bases, confidence intervals, effect size and
assumption checks, not just a p-value.

Part of the [moepouyan.com](https://www.moepouyan.com) portfolio tool set, and themed to match it.

## What it does

- **Two input modes.** Percentages with a base, or success counts with a base. Switching between
  them converts what you have already entered.
- **Results on request.** The app opens empty and stays that way until you enter your figures
  and select Calculate. Change an input afterwards and the results dim with a Recalculate
  prompt, so what is on screen is never mistaken for the current inputs.
- **Confidence level and direction.** 90 / 95 / 99, one- or two-tailed with an explicit alternative
  hypothesis.
- **Weighted data.** Supply a Kish effective base or a design effect and every standard error uses
  it, so rim-weighted percentages are not tested as though they were unweighted.
- **Confidence interval on the difference,** built from the unpooled standard error, alongside
  Cohen's h for effect size.
- **Assumption checks.** Warns when the normal approximation does not hold (n·p or n·(1-p) below
  5), when a base is very small, and that the test assumes independent samples.
- **Step-by-step explanation.** Every formula typeset with KaTeX using the actual figures, so the
  arithmetic on screen reproduces the result exactly.
- **Export.** Copy a report-ready summary, download a CSV of every figure, or save the chart as a
  PNG.

## Method

Pooled two-proportion Z-test:

```
p̂  = (p₁·n₁ + p₂·n₂) / (n₁ + n₂)          bases are effective bases when weighting is on
SE = sqrt( p̂(1-p̂)(1/n₁ + 1/n₂) )
Z  = (p₁ - p₂) / SE
```

The confidence interval uses the **unpooled** standard error, since pooling is only justified under
the null hypothesis:

```
SE_unpooled = sqrt( p₁(1-p₁)/n₁ + p₂(1-p₂)/n₂ )
CI          = (p₁ - p₂) ± z(1-α/2) · SE_unpooled
```

Normal tail probabilities come from `erfc` rather than `1 - CDF`, so p-values stay accurate past
Z = 6 instead of collapsing to zero.

## Running it

```bash
npm install
npm run dev        # dev server
npm run build      # typecheck, then production build to dist/
npm run test       # unit tests for the statistics and validation layers
npm run lint
```

React 18 + TypeScript + Vite + Tailwind. Chart.js for the comparison chart, KaTeX (bundled, no CDN
call) for the formulas, lucide-react for icons.

## Deployment

Deployed to Netlify and embedded on moepouyan.com as an iframe, the same pattern as the other
portfolio tools. `netlify.toml` holds the build command and publish directory.

## Documentation

- `docs/REVIEW.md` — code review and the findings behind the current version.
- `docs/UPGRADE.md` — what changed and why.
- `docs/THEME-SPEC.md` — the moepouyan.com design tokens and how they are applied.
