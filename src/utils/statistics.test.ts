/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import { describe, expect, it } from 'vitest';
import {
  calculateZTest,
  normalCDF,
  normalSF,
  zCritical,
  type GroupInput,
  type TestSettings,
} from './statistics';
import { syncModes, validate, type RawInputs } from './inputs';

const TWO_TAILED_95: TestSettings = { alpha: 0.05, tails: 2, direction: 'greater' };

function group(name: string, p: number, n: number, nEff = n): GroupInput {
  return { name, p, x: p * n, n, nEff };
}

describe('normal distribution helpers', () => {
  it('matches known standard normal values', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 12);
    expect(normalCDF(1)).toBeCloseTo(0.8413447461, 7);
    expect(normalSF(1.959963984540054) * 2).toBeCloseTo(0.05, 7);
    expect(normalSF(1.6448536269514722)).toBeCloseTo(0.05, 7);
  });

  it('stays accurate in the far tail instead of collapsing to zero', () => {
    // 1 - CDF loses this entirely past about Z = 6.
    expect(normalSF(8)).toBeGreaterThan(0);
    expect(normalSF(8)).toBeCloseTo(6.22e-16, 18);
    expect(normalSF(20)).toBeGreaterThan(0);
  });

  it('returns the expected critical values', () => {
    expect(zCritical(0.05, 2)).toBeCloseTo(1.96, 2);
    expect(zCritical(0.05, 1)).toBeCloseTo(1.645, 3);
    expect(zCritical(0.01, 2)).toBeCloseTo(2.576, 3);
  });
});

describe('calculateZTest', () => {
  it('reproduces a hand-checked case', () => {
    // 180/400 vs 539/700. Checked against Python's math.erfc:
    // p̂ = 719/1100 = 0.6536363636, SE = 0.0298230169, Z = -10.7299674,
    // two-tailed p = 7.3622e-27.
    const result = calculateZTest(
      group('A', 0.45, 400),
      group('B', 0.77, 700),
      TWO_TAILED_95
    );

    expect(result.pHat).toBeCloseTo(0.6536363636, 9);
    expect(result.sePooled).toBeCloseTo(0.0298230169, 9);
    expect(result.zStat).toBeCloseTo(-10.7299674, 6);
    expect(result.pValue / 7.3622123e-27).toBeCloseTo(1, 5);
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.significant).toBe(true);
  });

  it('is symmetric when the groups are swapped', () => {
    const a = calculateZTest(group('A', 0.45, 400), group('B', 0.77, 700), TWO_TAILED_95);
    const b = calculateZTest(group('B', 0.77, 700), group('A', 0.45, 400), TWO_TAILED_95);

    expect(b.zStat).toBeCloseTo(-a.zStat, 10);
    expect(b.pValue).toBeCloseTo(a.pValue, 30);
    expect(b.differencePP).toBeCloseTo(-a.differencePP, 10);
    expect(b.cohensH).toBeCloseTo(-a.cohensH, 10);
  });

  it('produces a confidence interval that excludes zero when significant', () => {
    const result = calculateZTest(group('A', 0.45, 400), group('B', 0.77, 700), TWO_TAILED_95);

    expect(result.ciLowPP).toBeLessThan(result.differencePP);
    expect(result.ciHighPP).toBeGreaterThan(result.differencePP);
    expect(result.ciLowPP < 0 && result.ciHighPP < 0).toBe(true);
    // Unpooled SE differs from the pooled SE used for the test.
    expect(result.seUnpooled).not.toBeCloseTo(result.sePooled, 6);
  });

  it('keeps the interval spanning zero when the result is not significant', () => {
    const result = calculateZTest(group('A', 0.5, 300), group('B', 0.52, 300), TWO_TAILED_95);

    expect(result.significant).toBe(false);
    expect(result.ciLowPP).toBeLessThan(0);
    expect(result.ciHighPP).toBeGreaterThan(0);
  });

  it('halves the two-tailed p-value for a one-tailed test in the observed direction', () => {
    const two = calculateZTest(group('A', 0.55, 400), group('B', 0.48, 400), TWO_TAILED_95);
    const one = calculateZTest(group('A', 0.55, 400), group('B', 0.48, 400), {
      alpha: 0.05,
      tails: 1,
      direction: 'greater',
    });

    expect(one.pValue).toBeCloseTo(two.pValue / 2, 10);
  });

  it('widens the standard error when an effective base is supplied', () => {
    const plain = calculateZTest(group('A', 0.4, 1000), group('B', 0.45, 1000), TWO_TAILED_95);
    const weighted = calculateZTest(
      group('A', 0.4, 1000, 1000 / 1.3),
      group('B', 0.45, 1000, 1000 / 1.3),
      TWO_TAILED_95
    );

    expect(weighted.sePooled).toBeGreaterThan(plain.sePooled);
    expect(Math.abs(weighted.zStat)).toBeLessThan(Math.abs(plain.zStat));
    expect(weighted.weighted).toBe(true);
    expect(weighted.g1.deff).toBeCloseTo(1.3, 6);
    // Effect size ignores the base, so it must not move.
    expect(weighted.cohensH).toBeCloseTo(plain.cohensH, 12);
  });

  it('flags the normal approximation when expected counts are below five', () => {
    const result = calculateZTest(group('Pilot', 0.04, 25), group('Control', 0.3, 30), TWO_TAILED_95);
    const ids = result.assumptions.map((a) => a.id);

    expect(ids).toContain('normal-approx');
    expect(ids).toContain('independence');
  });
});

describe('input validation', () => {
  const base: RawInputs = {
    mode: 'percentage',
    weighted: false,
    weightMode: 'effective',
    g1: { name: 'A', pct: '45', count: '', base: '400', effBase: '', deff: '' },
    g2: { name: 'B', pct: '77', count: '', base: '700', effBase: '', deff: '' },
    alpha: '0.05',
    tails: 2,
    direction: 'greater',
  };

  it('accepts a complete set of inputs', () => {
    const { errors, parsed } = validate(base);
    expect(errors).toEqual({});
    expect(parsed?.g1.p).toBeCloseTo(0.45, 10);
    expect(parsed?.g1.nEff).toBe(400);
  });

  it('rejects a sample size of zero rather than returning p = 1', () => {
    const { errors, parsed } = validate({ ...base, g1: { ...base.g1, base: '0' } });
    expect(parsed).toBeNull();
    expect(errors['g1.base']).toBeTruthy();
  });

  it('rejects out-of-range percentages rather than producing NaN', () => {
    const { errors, parsed } = validate({ ...base, g1: { ...base.g1, pct: '150' } });
    expect(parsed).toBeNull();
    expect(errors['g1.pct']).toBeTruthy();
  });

  it('rejects a success count above the base', () => {
    const counts: RawInputs = {
      ...base,
      mode: 'counts',
      g1: { ...base.g1, count: '500' },
      g2: { ...base.g2, count: '539' },
    };
    const { errors, parsed } = validate(counts);
    expect(parsed).toBeNull();
    expect(errors['g1.count']).toBeTruthy();
  });

  it('treats an empty field as incomplete, not as zero', () => {
    const { errors, parsed } = validate({ ...base, g1: { ...base.g1, pct: '' } });
    expect(parsed).toBeNull();
    expect(errors['g1.pct']).toBeTruthy();
  });

  it('rejects an effective base above the nominal base', () => {
    const weighted: RawInputs = {
      ...base,
      weighted: true,
      weightMode: 'effective',
      g1: { ...base.g1, effBase: '500' },
      g2: { ...base.g2, effBase: '600' },
    };
    const { errors } = validate(weighted);
    expect(errors['g1.effBase']).toBeTruthy();
    expect(errors['g2.effBase']).toBeUndefined();
  });

  it('converts a design effect into an effective base', () => {
    const weighted: RawInputs = {
      ...base,
      weighted: true,
      weightMode: 'deff',
      g1: { ...base.g1, deff: '1.25' },
      g2: { ...base.g2, deff: '1.25' },
    };
    const { parsed } = validate(weighted);
    expect(parsed?.g1.nEff).toBeCloseTo(320, 6);
  });
});

describe('mode switching', () => {
  it('carries a percentage across to a success count', () => {
    const converted = syncModes(
      { name: 'A', pct: '45', count: '', base: '400', effBase: '', deff: '' },
      'counts'
    );
    expect(converted.count).toBe('180');
  });

  it('carries a success count back to a percentage', () => {
    const converted = syncModes(
      { name: 'A', pct: '', count: '180', base: '400', effBase: '', deff: '' },
      'percentage'
    );
    expect(converted.pct).toBe('45');
  });

  it('agrees on the result whichever mode the data was entered in', () => {
    const asPct = validate({
      mode: 'percentage',
      weighted: false,
      weightMode: 'effective',
      g1: { name: 'A', pct: '45', count: '', base: '400', effBase: '', deff: '' },
      g2: { name: 'B', pct: '77', count: '', base: '700', effBase: '', deff: '' },
      alpha: '0.05',
      tails: 2,
      direction: 'greater',
    });

    const asCounts = validate({
      mode: 'counts',
      weighted: false,
      weightMode: 'effective',
      g1: { name: 'A', pct: '', count: '180', base: '400', effBase: '', deff: '' },
      g2: { name: 'B', pct: '', count: '539', base: '700', effBase: '', deff: '' },
      alpha: '0.05',
      tails: 2,
      direction: 'greater',
    });

    const a = calculateZTest(asPct.parsed!.g1, asPct.parsed!.g2, TWO_TAILED_95);
    const b = calculateZTest(asCounts.parsed!.g1, asCounts.parsed!.g2, TWO_TAILED_95);

    expect(b.zStat).toBeCloseTo(a.zStat, 10);
    expect(b.pValue).toBeCloseTo(a.pValue, 30);
  });
});
