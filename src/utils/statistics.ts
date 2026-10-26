/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
/* -------------------------------------------------------------------------
   Two-proportion Z-test.

   Normal tail probabilities are computed from erfc rather than 1 - CDF, so the
   upper tail stays accurate far out instead of collapsing to exactly 0 around
   Z = 6. See docs/REVIEW.md P3.4.
   ------------------------------------------------------------------------- */

/**
 * Complementary error function. Chebyshev approximation from Numerical
 * Recipes (3rd ed., 6.2.2). Fractional error below 1.2e-7 across the whole
 * range, and it does not lose precision in the tail.
 */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 2 / (2 + z);
  const ty = 4 * t - 2;

  const cof = [
    -1.3026537197817094, 6.419697923564902e-1, 1.9476473204185836e-2,
    -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
    4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
    1.30365583558e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9,
    5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11,
    2.394038e-12, -6.886027e-12, 8.94487e-13, 3.13092e-13, -1.12708e-13,
    3.81e-16, 7.106e-15,
  ];

  let d = 0;
  let dd = 0;
  for (let j = cof.length - 1; j > 0; j--) {
    const tmp = d;
    d = ty * d - dd + cof[j];
    dd = tmp;
  }

  const ans = t * Math.exp(-z * z + 0.5 * (cof[0] + ty * d) - dd);
  return x >= 0 ? ans : 2 - ans;
}

/** Error function, kept for callers that want it directly. */
export function erf(x: number): number {
  return 1 - erfc(x);
}

/** Standard normal cumulative distribution function, P(Z <= x). */
export function normalCDF(x: number): number {
  return 0.5 * erfc(-x / Math.SQRT2);
}

/** Standard normal survival function, P(Z > x). Accurate in the far tail. */
export function normalSF(x: number): number {
  return 0.5 * erfc(x / Math.SQRT2);
}

export type Tails = 1 | 2;
export type Direction = 'greater' | 'less';

/**
 * Critical values. The confidence selector is a closed set, so exact constants
 * are used rather than an inverse-normal approximation.
 */
const Z_TWO_TAILED: Record<string, number> = {
  '0.1': 1.6448536269514722,
  '0.05': 1.959963984540054,
  '0.01': 2.5758293035489004,
};

const Z_ONE_TAILED: Record<string, number> = {
  '0.1': 1.2815515655446004,
  '0.05': 1.6448536269514722,
  '0.01': 2.3263478740408408,
};

export function zCritical(alpha: number, tails: Tails): number {
  const table = tails === 2 ? Z_TWO_TAILED : Z_ONE_TAILED;
  return table[String(alpha)] ?? Z_TWO_TAILED['0.05'];
}

/** Two-sided critical value, used for the confidence interval at any alpha. */
export function zTwoSided(alpha: number): number {
  return Z_TWO_TAILED[String(alpha)] ?? Z_TWO_TAILED['0.05'];
}

export interface GroupStats {
  name: string;
  /** Proportion on 0..1. */
  p: number;
  /** Successes on the nominal base. Fractional when derived from a percentage. */
  x: number;
  /** Nominal (unweighted) base, used for display. */
  n: number;
  /** Effective base, used in every standard error. Equals n when unweighted. */
  nEff: number;
  /** Design effect, n / nEff. 1 when unweighted. */
  deff: number;
}

export interface TestSettings {
  /** 0.10, 0.05 or 0.01. */
  alpha: number;
  tails: Tails;
  /** Only meaningful when tails === 1. H1 is p1 > p2 or p1 < p2. */
  direction: Direction;
}

export interface Assumption {
  id: string;
  severity: 'warning' | 'note';
  title: string;
  detail: string;
}

export interface ZTestResult {
  g1: GroupStats;
  g2: GroupStats;
  settings: TestSettings;
  /** Pooled proportion, computed on the effective bases. */
  pHat: number;
  /** Pooled standard error, used for the test statistic. */
  sePooled: number;
  /** Unpooled standard error, used for the confidence interval. */
  seUnpooled: number;
  zStat: number;
  /** Critical value for the test, one- or two-tailed as selected. */
  zCrit: number;
  /** Two-sided critical value backing the confidence interval. */
  zCi: number;
  pValue: number;
  significant: boolean;
  /** Signed difference in percentage points, p1 - p2. */
  differencePP: number;
  ciLowPP: number;
  ciHighPP: number;
  /** Confidence level of the interval, e.g. 95. */
  ciLevel: number;
  cohensH: number;
  effectLabel: string;
  weighted: boolean;
  assumptions: Assumption[];
}

function effectSizeLabel(h: number): string {
  const a = Math.abs(h);
  if (a < 0.2) return 'negligible';
  if (a < 0.5) return 'small';
  if (a < 0.8) return 'medium';
  return 'large';
}

function checkAssumptions(g1: GroupStats, g2: GroupStats, weighted: boolean): Assumption[] {
  const out: Assumption[] = [];

  const failing = [g1, g2].filter((g) => g.nEff * g.p < 5 || g.nEff * (1 - g.p) < 5);

  if (failing.length > 0) {
    const names = failing.map((g) => g.name).join(' and ');
    out.push({
      id: 'normal-approx',
      severity: 'warning',
      title: 'Normal approximation may not hold',
      detail:
        `${names} ${failing.length > 1 ? 'have' : 'has'} fewer than 5 expected successes or ` +
        'failures (n x p and n x (1 - p) should both be at least 5). The Z-test is unreliable ' +
        "here. Use Fisher's exact test instead.",
    });
  }

  const small = [g1, g2].filter((g) => g.nEff < 30);
  if (small.length > 0 && failing.length === 0) {
    out.push({
      id: 'small-base',
      severity: 'warning',
      title: 'Very small base',
      detail:
        `${small.map((g) => g.name).join(' and ')} ${small.length > 1 ? 'are' : 'is'} tested on ` +
        'fewer than 30 cases. Read the result as indicative only.',
    });
  }

  if (weighted) {
    out.push({
      id: 'weighted',
      severity: 'note',
      title: 'Tested on effective bases',
      detail:
        `Standard errors use the effective bases (${Math.round(g1.nEff)} and ` +
        `${Math.round(g2.nEff)}), not the nominal bases. Design effects are ` +
        `${g1.deff.toFixed(2)} and ${g2.deff.toFixed(2)}.`,
    });
  }

  out.push({
    id: 'independence',
    severity: 'note',
    title: 'Assumes independent samples',
    detail:
      'The two groups must not overlap. Testing a subgroup against a total that contains it, or ' +
      'two codes from the same multi-response question, breaks this assumption and biases the ' +
      'test towards "not significant".',
  });

  return out;
}

export interface GroupInput {
  name: string;
  /** Proportion on 0..1. */
  p: number;
  /** Successes on the nominal base. */
  x: number;
  n: number;
  nEff: number;
}

export function calculateZTest(
  in1: GroupInput,
  in2: GroupInput,
  settings: TestSettings
): ZTestResult {
  const g1: GroupStats = {
    name: in1.name,
    p: in1.p,
    x: in1.x,
    n: in1.n,
    nEff: in1.nEff,
    deff: in1.n / in1.nEff,
  };
  const g2: GroupStats = {
    name: in2.name,
    p: in2.p,
    x: in2.x,
    n: in2.n,
    nEff: in2.nEff,
    deff: in2.n / in2.nEff,
  };

  const weighted = Math.abs(g1.deff - 1) > 1e-9 || Math.abs(g2.deff - 1) > 1e-9;

  // Pooled proportion on the effective bases. Reduces to (x1 + x2) / (n1 + n2)
  // when the data is unweighted.
  const pHat = (g1.p * g1.nEff + g2.p * g2.nEff) / (g1.nEff + g2.nEff);

  const sePooled = Math.sqrt(pHat * (1 - pHat) * (1 / g1.nEff + 1 / g2.nEff));

  const seUnpooled = Math.sqrt(
    (g1.p * (1 - g1.p)) / g1.nEff + (g2.p * (1 - g2.p)) / g2.nEff
  );

  const zStat = sePooled === 0 ? 0 : (g1.p - g2.p) / sePooled;

  let pValue: number;
  if (settings.tails === 2) {
    pValue = 2 * normalSF(Math.abs(zStat));
  } else if (settings.direction === 'greater') {
    pValue = normalSF(zStat);
  } else {
    pValue = normalCDF(zStat);
  }
  pValue = Math.min(1, Math.max(0, pValue));

  const zCrit = zCritical(settings.alpha, settings.tails);
  const significant = pValue < settings.alpha;

  const differencePP = (g1.p - g2.p) * 100;
  const zCi = zTwoSided(settings.alpha);
  const marginPP = zCi * seUnpooled * 100;

  const cohensH = 2 * Math.asin(Math.sqrt(g1.p)) - 2 * Math.asin(Math.sqrt(g2.p));

  return {
    g1,
    g2,
    settings,
    pHat,
    sePooled,
    seUnpooled,
    zStat,
    zCrit,
    zCi,
    pValue,
    significant,
    differencePP,
    ciLowPP: differencePP - marginPP,
    ciHighPP: differencePP + marginPP,
    ciLevel: Math.round((1 - settings.alpha) * 100),
    cohensH,
    effectLabel: effectSizeLabel(cohensH),
    weighted,
    assumptions: checkAssumptions(g1, g2, weighted),
  };
}
