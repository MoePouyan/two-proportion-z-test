/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import type { ReactNode } from 'react';
import TeX from './ui/TeX';
import type { ZTestResult } from '../utils/statistics';
import type { InputMode } from '../utils/inputs';
import { formatCount, formatNumber, isFractional, texPValue } from '../utils/format';

interface ExplanationSectionProps {
  result: ZTestResult;
  inputMode: InputMode;
}

/** Strips anything that would break out of \text{} in the TeX source. */
function tex(label: string): string {
  return label.replace(/[\\{}$&#^_~%]/g, '').trim() || 'Group';
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="space-y-1.5">
      <strong className="text-ink">{title}</strong>
      <div className="text-secondary">{children}</div>
    </li>
  );
}

export default function ExplanationSection({ result, inputMode }: ExplanationSectionProps) {
  const { g1, g2, settings } = result;

  const n1 = formatNumber(g1.nEff, isFractional(g1.nEff) ? 1 : 0);
  const n2 = formatNumber(g2.nEff, isFractional(g2.nEff) ? 1 : 0);
  const p1 = formatNumber(g1.p, 4);
  const p2 = formatNumber(g2.p, 4);
  const x1 = formatCount(g1.x);
  const x2 = formatCount(g2.x);
  const pHat = formatNumber(result.pHat, 4);
  const sePooled = formatNumber(result.sePooled, 5);
  const seUnpooled = formatNumber(result.seUnpooled, 5);
  const z = formatNumber(result.zStat, 3);
  const name1 = tex(g1.name);
  const name2 = tex(g2.name);

  const fractionalCounts = isFractional(g1.x) || isFractional(g2.x);

  return (
    <div className="animate-fadeIn">
      <h2 className="mb-4 font-display text-xl font-bold tracking-tighter text-brand">
        Step-by-Step Explanation
      </h2>

      <ol className="ml-6 list-outside list-decimal space-y-5 text-secondary marker:font-medium marker:text-brand">
        <Step title={`Input mode: ${inputMode === 'percentage' ? 'percentage' : 'success counts'}`}>
          <TeX>{`\\text{${name1}}: p_1 = ${p1}, \\quad \\text{${name2}}: p_2 = ${p2}`}</TeX>
        </Step>

        {inputMode === 'percentage' && (
          <Step title="Derive the number of successes">
            <TeX display>{`x_1 = p_1 \\times n_1 = ${p1} \\times ${formatNumber(g1.n, 0)} = ${x1}`}</TeX>
            <TeX display>{`x_2 = p_2 \\times n_2 = ${p2} \\times ${formatNumber(g2.n, 0)} = ${x2}`}</TeX>
            {fractionalCounts && (
              <p className="mt-1 text-xs text-muted">
                Successes derived from a percentage are not always whole numbers. The fractional
                values are carried through rather than rounded, so every figure below reproduces
                the result exactly.
              </p>
            )}
          </Step>
        )}

        {result.weighted && (
          <Step title="Apply the effective bases">
            <p className="mb-1 text-sm">
              Weighting inflates the variance, so the standard errors use the Kish effective sample
              size rather than the nominal base.
            </p>
            <TeX display>{`n_{\\text{eff}} = \\frac{(\\sum w)^2}{\\sum w^2}, \\qquad \\text{deff} = \\frac{n}{n_{\\text{eff}}}`}</TeX>
            <TeX display>{`\\text{${name1}}: n_1 = ${formatNumber(g1.n, 0)} \\Rightarrow n_{1,\\text{eff}} = ${n1} \\ (\\text{deff } ${formatNumber(g1.deff, 2)})`}</TeX>
            <TeX display>{`\\text{${name2}}: n_2 = ${formatNumber(g2.n, 0)} \\Rightarrow n_{2,\\text{eff}} = ${n2} \\ (\\text{deff } ${formatNumber(g2.deff, 2)})`}</TeX>
          </Step>
        )}

        <Step title="Compute the pooled proportion">
          {result.weighted ? (
            <TeX display>{`\\hat{p} = \\frac{p_1 n_{1,\\text{eff}} + p_2 n_{2,\\text{eff}}}{n_{1,\\text{eff}} + n_{2,\\text{eff}}} = \\frac{${p1} \\times ${n1} + ${p2} \\times ${n2}}{${n1} + ${n2}} = ${pHat}`}</TeX>
          ) : (
            <TeX display>{`\\hat{p} = \\frac{x_1 + x_2}{n_1 + n_2} = \\frac{${x1} + ${x2}}{${n1} + ${n2}} = ${pHat}`}</TeX>
          )}
        </Step>

        <Step title="Compute the pooled standard error">
          <TeX display>{`SE_{\\text{pooled}} = \\sqrt{\\hat{p}(1 - \\hat{p})\\left(\\tfrac{1}{n_1} + \\tfrac{1}{n_2}\\right)} = \\sqrt{${pHat} \\times ${formatNumber(1 - result.pHat, 4)} \\times \\left(\\tfrac{1}{${n1}} + \\tfrac{1}{${n2}}\\right)} = ${sePooled}`}</TeX>
        </Step>

        <Step title="Compute the Z-statistic">
          <TeX display>{`Z = \\frac{p_1 - p_2}{SE_{\\text{pooled}}} = \\frac{${p1} - ${p2}}{${sePooled}} = ${z}`}</TeX>
        </Step>

        <Step title={`Compute the p-value (${settings.tails === 2 ? 'two-tailed' : 'one-tailed'})`}>
          {settings.tails === 2 ? (
            <TeX display>{`p = 2 \\times P(Z > |${formatNumber(result.zStat < 0 ? -result.zStat : result.zStat, 3)}|) = ${texPValue(result.pValue)}`}</TeX>
          ) : (
            <TeX display>{`p = P(Z ${settings.direction === 'greater' ? '>' : '<'} ${z}) = ${texPValue(result.pValue)}`}</TeX>
          )}
          <p className="mt-1 text-sm">
            Compared against <TeX>{`\\alpha = ${settings.alpha}`}</TeX>, critical value{' '}
            <TeX>{`Z_{\\text{crit}} = ${formatNumber(result.zCrit, 3)}`}</TeX>.
          </p>
        </Step>

        <Step title={`Build the ${result.ciLevel}% confidence interval for the difference`}>
          <p className="mb-1 text-sm">
            The interval uses the <em>unpooled</em> standard error. Pooling is only appropriate
            under the null hypothesis, which the interval does not assume.
          </p>
          <TeX display>{`SE_{\\text{unpooled}} = \\sqrt{\\frac{p_1(1-p_1)}{n_1} + \\frac{p_2(1-p_2)}{n_2}} = ${seUnpooled}`}</TeX>
          <TeX display>{`(p_1 - p_2) \\pm Z \\times SE_{\\text{unpooled}} = ${formatNumber(result.differencePP, 2)} \\pm ${formatNumber(result.zCi, 3)} \\times ${formatNumber(result.seUnpooled * 100, 3)} = [${formatNumber(result.ciLowPP, 2)},\\ ${formatNumber(result.ciHighPP, 2)}] \\text{ pp}`}</TeX>
        </Step>

        <Step title="Compute the effect size">
          <TeX display>{`h = 2\\arcsin\\sqrt{p_1} - 2\\arcsin\\sqrt{p_2} = ${formatNumber(result.cohensH, 3)}`}</TeX>
          <p className="mt-1 text-sm">
            Conventional thresholds are 0.20 small, 0.50 medium, 0.80 large. This one is{' '}
            <span className="font-medium text-ink">{result.effectLabel}</span>. Effect size does not
            grow with sample size, so it is the check on a p-value driven by a very large base.
          </p>
        </Step>

        <Step title="Conclusion">
          {result.significant ? (
            <p>
              Since <TeX>{`p < ${settings.alpha}`}</TeX>, we{' '}
              <span className="font-medium text-success">reject the null hypothesis</span>. The
              difference between {g1.name} and {g2.name} is unlikely to be sampling variation alone.
            </p>
          ) : (
            <p>
              Since <TeX>{`p \\geq ${settings.alpha}`}</TeX>, we{' '}
              <span className="font-medium text-danger">fail to reject the null hypothesis</span>.
              That is not evidence the groups are equal, only that this sample cannot separate them.
            </p>
          )}
        </Step>
      </ol>
    </div>
  );
}
