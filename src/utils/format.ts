/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
/** Display helpers. Every figure shown in the UI goes through one of these. */

/** True when a derived success count is not a whole number. */
export function isFractional(value: number): boolean {
  return Math.abs(value - Math.round(value)) > 1e-9;
}

/**
 * Success counts. Percentage mode derives them as p x n, which is usually
 * fractional, so the displayed figure keeps two decimals rather than rounding
 * to an integer that would not reproduce the pooled proportion.
 */
export function formatCount(value: number): string {
  return isFractional(value) ? value.toFixed(2) : String(Math.round(value));
}

/** p-values. Exponential below 0.0001 so the far tail is readable. */
export function formatPValue(p: number): string {
  if (p === 0) return '< 1e-300';
  if (p < 0.0001) return p.toExponential(2);
  return p.toFixed(5);
}

/** p-value as TeX, so an exponential renders as 7.36 x 10^-27 rather than "7.36e-27". */
export function texPValue(p: number): string {
  if (p === 0) return '< 10^{-300}';
  if (p >= 0.0001) return p.toFixed(5);
  const [mantissa, exponent] = p.toExponential(2).split('e');
  return `${mantissa} \\times 10^{${Number(exponent)}}`;
}

export function formatPercent(p: number, decimals = 1): string {
  return `${(p * 100).toFixed(decimals)}%`;
}

/** Percentage-point values, always signed, so direction is never ambiguous. */
export function formatSignedPP(value: number, decimals = 1): string {
  const rounded = value.toFixed(decimals);
  return Number(rounded) > 0 ? `+${rounded}` : rounded;
}

export function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

export function formatBase(value: number): string {
  return Math.round(value).toLocaleString();
}
