/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import type { Direction, GroupInput, Tails, TestSettings } from './statistics';

export type InputMode = 'percentage' | 'counts';
export type WeightMode = 'effective' | 'deff';
export type GroupKey = 'g1' | 'g2';

export interface RawGroup {
  name: string;
  /** Percentage as typed, 0..100. Used in percentage mode. */
  pct: string;
  /** Success count as typed. Used in counts mode. */
  count: string;
  /** Nominal base, shared by both modes. */
  base: string;
  /** Effective base, when weighting is on and weightMode is 'effective'. */
  effBase: string;
  /** Design effect, when weighting is on and weightMode is 'deff'. */
  deff: string;
}

export interface RawInputs {
  mode: InputMode;
  weighted: boolean;
  weightMode: WeightMode;
  g1: RawGroup;
  g2: RawGroup;
  alpha: string;
  tails: Tails;
  direction: Direction;
}

export type FieldErrors = Partial<Record<string, string>>;

export interface ParsedInputs {
  g1: GroupInput;
  g2: GroupInput;
  settings: TestSettings;
}

export const GROUP_LABELS: Record<GroupKey, string> = { g1: 'Group 1', g2: 'Group 2' };

export function emptyGroup(name = ''): RawGroup {
  return { name, pct: '', count: '', base: '', effBase: '', deff: '' };
}

/** Opening state: nothing filled in, so the app shows no result until asked. */
export function emptyInputs(): RawInputs {
  return {
    mode: 'percentage',
    weighted: false,
    weightMode: 'effective',
    g1: emptyGroup(),
    g2: emptyGroup(),
    alpha: '0.05',
    tails: 2,
    direction: 'greater',
  };
}

/** True when nothing has been typed into either group yet. */
export function isBlank(raw: RawInputs): boolean {
  const blankGroup = (g: RawGroup) =>
    [g.name, g.pct, g.count, g.base, g.effBase, g.deff].every((v) => v.trim() === '');
  return blankGroup(raw.g1) && blankGroup(raw.g2);
}

/** parseFloat that refuses blanks, stray text and non-finite values. */
function num(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateGroup(
  key: GroupKey,
  raw: RawGroup,
  mode: InputMode,
  weighted: boolean,
  weightMode: WeightMode,
  errors: FieldErrors
): GroupInput | null {
  const label = raw.name.trim() || GROUP_LABELS[key];

  const base = num(raw.base);
  if (base === null) {
    errors[`${key}.base`] = 'Enter a sample size.';
  } else if (base < 1) {
    errors[`${key}.base`] = 'Sample size must be at least 1.';
  } else if (base > 10_000_000) {
    errors[`${key}.base`] = 'Sample size looks too large.';
  }

  let p: number | null = null;
  let x: number | null = null;

  if (mode === 'percentage') {
    const pct = num(raw.pct);
    if (pct === null) {
      errors[`${key}.pct`] = 'Enter a percentage.';
    } else if (pct < 0 || pct > 100) {
      errors[`${key}.pct`] = 'Percentage must be between 0 and 100.';
    } else {
      p = pct / 100;
      if (base !== null && base >= 1) x = p * base;
    }
  } else {
    const count = num(raw.count);
    if (count === null) {
      errors[`${key}.count`] = 'Enter a success count.';
    } else if (count < 0) {
      errors[`${key}.count`] = 'Success count cannot be negative.';
    } else if (base !== null && base >= 1 && count > base) {
      errors[`${key}.count`] = 'Success count cannot exceed the sample size.';
    } else if (base !== null && base >= 1) {
      x = count;
      p = count / base;
    }
  }

  let nEff: number | null = base;

  if (weighted && base !== null && base >= 1) {
    if (weightMode === 'effective') {
      const eff = num(raw.effBase);
      if (eff === null) {
        errors[`${key}.effBase`] = 'Enter an effective base.';
        nEff = null;
      } else if (eff < 1) {
        errors[`${key}.effBase`] = 'Effective base must be at least 1.';
        nEff = null;
      } else if (eff > base) {
        errors[`${key}.effBase`] = 'Effective base cannot exceed the nominal base.';
        nEff = null;
      } else {
        nEff = eff;
      }
    } else {
      const deff = num(raw.deff);
      if (deff === null) {
        errors[`${key}.deff`] = 'Enter a design effect.';
        nEff = null;
      } else if (deff < 1) {
        errors[`${key}.deff`] = 'Design effect must be at least 1.00.';
        nEff = null;
      } else if (deff > 20) {
        errors[`${key}.deff`] = 'Design effect looks too large.';
        nEff = null;
      } else {
        nEff = base / deff;
        if (nEff < 1) {
          errors[`${key}.deff`] = 'That design effect leaves an effective base below 1.';
          nEff = null;
        }
      }
    }
  }

  if (base === null || base < 1 || p === null || x === null || nEff === null) return null;

  return { name: label, p, x, n: base, nEff };
}

export function validate(raw: RawInputs): { errors: FieldErrors; parsed: ParsedInputs | null } {
  const errors: FieldErrors = {};

  const g1 = validateGroup('g1', raw.g1, raw.mode, raw.weighted, raw.weightMode, errors);
  const g2 = validateGroup('g2', raw.g2, raw.mode, raw.weighted, raw.weightMode, errors);

  if (!g1 || !g2 || Object.keys(errors).length > 0) return { errors, parsed: null };

  const settings: TestSettings = {
    alpha: Number(raw.alpha),
    tails: raw.tails,
    direction: raw.direction,
  };

  return { errors, parsed: { g1, g2, settings } };
}

/**
 * Carries the data across a mode switch so nothing has to be retyped, and so
 * the two modes can never hold contradictory sample sizes.
 */
export function syncModes(group: RawGroup, to: InputMode): RawGroup {
  const base = num(group.base);
  if (base === null || base < 1) return group;

  if (to === 'counts') {
    const pct = num(group.pct);
    if (pct === null || pct < 0 || pct > 100) return group;
    return { ...group, count: String(Math.round((pct / 100) * base)) };
  }

  const count = num(group.count);
  if (count === null || count < 0 || count > base) return group;
  const pct = (count / base) * 100;
  return { ...group, pct: String(Number(pct.toFixed(2))) };
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  apply: () => RawInputs;
}

const BASE_SETTINGS = { alpha: '0.05', tails: 2 as Tails, direction: 'greater' as Direction };

export const PRESETS: Preset[] = [
  {
    id: 'awareness',
    label: 'Brand awareness by region',
    description: 'Two independent regional samples, unweighted, clearly significant.',
    apply: () => ({
      mode: 'percentage',
      weighted: false,
      weightMode: 'effective',
      g1: { name: 'Ontario', pct: '45', count: '180', base: '400', effBase: '', deff: '' },
      g2: { name: 'Quebec', pct: '77', count: '539', base: '700', effBase: '', deff: '' },
      ...BASE_SETTINGS,
    }),
  },
  {
    id: 'weighted',
    label: 'Weighted tracker, wave on wave',
    description: 'Rim-weighted data, tested on effective bases rather than nominal bases.',
    apply: () => ({
      mode: 'percentage',
      weighted: true,
      weightMode: 'deff',
      g1: { name: 'Wave 1', pct: '38.4', count: '', base: '1000', effBase: '781', deff: '1.28' },
      g2: { name: 'Wave 2', pct: '43.1', count: '', base: '1000', effBase: '763', deff: '1.31' },
      ...BASE_SETTINGS,
    }),
  },
  {
    id: 'smallbase',
    label: 'Small base, assumption fails',
    description: 'Shows the normal-approximation warning and the Fisher exact prompt.',
    apply: () => ({
      mode: 'counts',
      weighted: false,
      weightMode: 'effective',
      g1: { name: 'Pilot group', pct: '12', count: '3', base: '25', effBase: '', deff: '' },
      g2: { name: 'Control group', pct: '30', count: '9', base: '30', effBase: '', deff: '' },
      ...BASE_SETTINGS,
    }),
  },
];
