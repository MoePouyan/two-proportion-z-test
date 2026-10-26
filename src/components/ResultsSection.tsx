/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import type { ZTestResult } from '../utils/statistics';
import { formatBase, formatNumber, formatPValue, formatSignedPP } from '../utils/format';

interface ResultsSectionProps {
  result: ZTestResult;
}

interface MetricProps {
  label: string;
  value: string;
  note: string;
  tone?: 'brand' | 'ink';
}

function Metric({ label, value, note, tone = 'ink' }: MetricProps) {
  const brand = tone === 'brand';
  return (
    <div
      className={`rounded-control border border-hairline p-5 ${brand ? 'bg-brand-tint' : 'bg-paper'}`}
    >
      <h3
        className={`mb-1 font-sans text-sm font-medium tracking-tight ${
          brand ? 'text-brand' : 'text-ink'
        }`}
      >
        {label}
      </h3>
      <p
        className={`tnum font-display text-3xl font-bold tracking-tighter ${
          brand ? 'text-brand' : 'text-ink'
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted">{note}</p>
    </div>
  );
}

export default function ResultsSection({ result }: ResultsSectionProps) {
  const { g1, g2, settings, significant } = result;
  const level = result.ciLevel;

  const alternative =
    settings.tails === 2
      ? `There is a significant difference between ${g1.name} and ${g2.name}.`
      : settings.direction === 'greater'
        ? `${g1.name} is significantly higher than ${g2.name}.`
        : `${g1.name} is significantly lower than ${g2.name}.`;

  const testLabel =
    settings.tails === 2 ? 'two-tailed' : `one-tailed, ${g1.name} ${settings.direction === 'greater' ? 'higher' : 'lower'}`;

  const ciCrossesZero = result.ciLowPP <= 0 && result.ciHighPP >= 0;

  return (
    <div className="animate-fadeIn">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold tracking-tighter text-brand">Test Results</h2>
        <p className="text-xs text-muted">
          {level}% confidence, {testLabel}
        </p>
      </div>

      <div className="mb-6 rounded-control border border-hairline bg-paper p-5">
        <h3 className="mb-2 font-display text-base font-bold tracking-tighter text-ink">
          Hypotheses
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-secondary">
          <li>
            <span className="font-medium text-ink">Null Hypothesis (H₀):</span> There is no
            difference between {g1.name} and {g2.name}.
          </li>
          <li>
            <span className="font-medium text-ink">Alternative Hypothesis (H₁):</span>{' '}
            {alternative}
          </li>
        </ul>
        <p className="mt-3 text-sm text-secondary">
          <span className="font-medium text-ink">{g1.name}:</span>{' '}
          <span className="tnum">{(g1.p * 100).toFixed(1)}%</span> of {formatBase(g1.n)}
          {result.weighted && ` (effective ${formatBase(g1.nEff)})`}
          {'  ·  '}
          <span className="font-medium text-ink">{g2.name}:</span>{' '}
          <span className="tnum">{(g2.p * 100).toFixed(1)}%</span> of {formatBase(g2.n)}
          {result.weighted && ` (effective ${formatBase(g2.nEff)})`}
        </p>
      </div>

      <div
        className={`mb-6 flex items-start rounded-control border p-5 ${
          significant ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'
        }`}
      >
        {significant ? (
          <CheckCircle className="mr-3 h-6 w-6 flex-shrink-0 text-success" aria-hidden="true" />
        ) : (
          <XCircle className="mr-3 h-6 w-6 flex-shrink-0 text-danger" aria-hidden="true" />
        )}
        <div>
          <h3
            className={`font-display text-base font-bold tracking-tighter ${
              significant ? 'text-success' : 'text-danger'
            }`}
          >
            {significant
              ? `Significant difference at the ${level}% level`
              : `No significant difference at the ${level}% level`}
          </h3>
          <p className="mt-1 text-sm text-secondary">
            {significant
              ? `p = ${formatPValue(result.pValue)}, below the ${settings.alpha} threshold. ` +
                `${g1.name} is ${Math.abs(result.differencePP).toFixed(1)} points ` +
                `${result.differencePP >= 0 ? 'above' : 'below'} ${g2.name}.`
              : `p = ${formatPValue(result.pValue)}, at or above the ${settings.alpha} threshold. ` +
                `The observed gap of ${Math.abs(result.differencePP).toFixed(1)} points is within ` +
                `what sampling variation alone would produce.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Metric
          tone="brand"
          label="Z-statistic"
          value={formatNumber(result.zStat, 3)}
          note={`Critical value at this level is ±${formatNumber(result.zCrit, 3)}`}
        />
        <Metric
          label="p-value"
          value={formatPValue(result.pValue)}
          note={`Probability of a gap this large if H₀ is true (α = ${settings.alpha})`}
        />
        <Metric
          tone="brand"
          label={`Difference, ${level}% CI`}
          value={`${formatSignedPP(result.ciLowPP)} to ${formatSignedPP(result.ciHighPP)}`}
          note={
            `Point estimate ${formatSignedPP(result.differencePP)} pp. ` +
            (ciCrossesZero
              ? 'The interval spans zero, so no difference remains plausible.'
              : 'The interval excludes zero.')
          }
        />
        <Metric
          label="Cohen's h"
          value={formatNumber(result.cohensH, 3)}
          note={`Effect size is ${result.effectLabel}, independent of sample size`}
        />
      </div>

      {result.assumptions.length > 0 && (
        <ul className="mt-6 space-y-3">
          {result.assumptions.map((item) => {
            const warn = item.severity === 'warning';
            return (
              <li
                key={item.id}
                className={`flex items-start gap-3 rounded-control border p-4 text-sm ${
                  warn ? 'border-warning/30 bg-warning/5' : 'border-hairline bg-paper'
                }`}
              >
                {warn ? (
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 flex-shrink-0 text-warning"
                    aria-hidden="true"
                  />
                ) : (
                  <Info size={18} className="mt-0.5 flex-shrink-0 text-brand" aria-hidden="true" />
                )}
                <p className="text-secondary">
                  <span className={`font-medium ${warn ? 'text-warning' : 'text-ink'}`}>
                    {item.title}.
                  </span>{' '}
                  {item.detail}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
