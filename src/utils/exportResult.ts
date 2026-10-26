/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import type { ZTestResult } from './statistics';
import { formatBase, formatCount, formatNumber, formatPValue, formatSignedPP } from './format';

/** Attribution line appended to every export. */
export const ATTRIBUTION = 'Generated with the Two-Proportion Z-Test Calculator, www.moepouyan.com';

function hypothesis(result: ZTestResult): string {
  const { g1, g2, settings } = result;
  if (settings.tails === 2) return `H1: ${g1.name} differs from ${g2.name}`;
  return settings.direction === 'greater'
    ? `H1: ${g1.name} is higher than ${g2.name}`
    : `H1: ${g1.name} is lower than ${g2.name}`;
}

/** One-paragraph verdict suitable for pasting straight into a report. */
export function summaryText(result: ZTestResult): string {
  const { g1, g2, settings } = result;
  const level = Math.round((1 - settings.alpha) * 100);
  const tailLabel = settings.tails === 2 ? 'two-tailed' : 'one-tailed';

  const lines = [
    `Two-proportion Z-test (${tailLabel}, ${level}% confidence)`,
    `${g1.name}: ${(g1.p * 100).toFixed(1)}% of ${formatBase(g1.n)}` +
      (result.weighted ? ` (effective base ${formatBase(g1.nEff)}, deff ${g1.deff.toFixed(2)})` : ''),
    `${g2.name}: ${(g2.p * 100).toFixed(1)}% of ${formatBase(g2.n)}` +
      (result.weighted ? ` (effective base ${formatBase(g2.nEff)}, deff ${g2.deff.toFixed(2)})` : ''),
    hypothesis(result),
    `Difference: ${formatSignedPP(result.differencePP)} pp` +
      ` (${result.ciLevel}% CI ${formatSignedPP(result.ciLowPP)} to ${formatSignedPP(result.ciHighPP)} pp)`,
    `Z = ${formatNumber(result.zStat, 3)}, p = ${formatPValue(result.pValue)}` +
      `, critical Z = ${formatNumber(result.zCrit, 3)}`,
    `Cohen's h = ${formatNumber(result.cohensH, 3)} (${result.effectLabel})`,
    result.significant
      ? `Verdict: significant at the ${level}% level.`
      : `Verdict: not significant at the ${level}% level.`,
  ];

  const warnings = result.assumptions.filter((a) => a.severity === 'warning');
  if (warnings.length > 0) {
    lines.push(`Warnings: ${warnings.map((w) => w.title).join('; ')}.`);
  }

  lines.push('', ATTRIBUTION);
  return lines.join('\n');
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvText(result: ZTestResult): string {
  const { g1, g2, settings } = result;

  const rows: (string | number)[][] = [
    ['Metric', 'Value'],
    ['Test', settings.tails === 2 ? 'Two-tailed' : `One-tailed (${settings.direction})`],
    ['Confidence level', `${Math.round((1 - settings.alpha) * 100)}%`],
    ['Alpha', settings.alpha],
    ['Group 1 name', g1.name],
    ['Group 1 percentage', (g1.p * 100).toFixed(2)],
    ['Group 1 successes', formatCount(g1.x)],
    ['Group 1 nominal base', Math.round(g1.n)],
    ['Group 1 effective base', Math.round(g1.nEff)],
    ['Group 1 design effect', g1.deff.toFixed(3)],
    ['Group 2 name', g2.name],
    ['Group 2 percentage', (g2.p * 100).toFixed(2)],
    ['Group 2 successes', formatCount(g2.x)],
    ['Group 2 nominal base', Math.round(g2.n)],
    ['Group 2 effective base', Math.round(g2.nEff)],
    ['Group 2 design effect', g2.deff.toFixed(3)],
    ['Pooled proportion', result.pHat.toFixed(6)],
    ['Pooled standard error', result.sePooled.toFixed(6)],
    ['Unpooled standard error', result.seUnpooled.toFixed(6)],
    ['Z statistic', result.zStat.toFixed(4)],
    ['Critical Z', result.zCrit.toFixed(4)],
    ['p value', result.pValue.toExponential(6)],
    ['Difference (pp)', result.differencePP.toFixed(3)],
    [`CI lower (pp)`, result.ciLowPP.toFixed(3)],
    [`CI upper (pp)`, result.ciHighPP.toFixed(3)],
    ["Cohen's h", result.cohensH.toFixed(4)],
    ['Effect size', result.effectLabel],
    ['Significant', result.significant ? 'Yes' : 'No'],
  ];

  result.assumptions
    .filter((a) => a.severity === 'warning')
    .forEach((a, i) => rows.push([`Warning ${i + 1}`, a.title]));

  rows.push(['Source', ATTRIBUTION]);
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'group'
  );
}

export function downloadBlob(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  triggerDownload(filename, url);
  URL.revokeObjectURL(url);
}

export function triggerDownload(filename: string, url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
