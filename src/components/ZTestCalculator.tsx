/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import { useMemo, useRef, useState } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import { AlertCircle, Calculator, RefreshCw } from 'lucide-react';
import InputForm from './InputForm';
import TestSettings from './TestSettings';
import ResultsSection from './ResultsSection';
import ChartSection from './ChartSection';
import ExplanationSection from './ExplanationSection';
import ResultActions from './ResultActions';
import { calculateZTest } from '../utils/statistics';
import type { Direction, Tails, ZTestResult } from '../utils/statistics';
import { GROUP_LABELS, PRESETS, emptyInputs, isBlank, syncModes, validate } from '../utils/inputs';
import type {
  FieldErrors,
  GroupKey,
  InputMode,
  RawGroup,
  RawInputs,
  WeightMode,
} from '../utils/inputs';

interface Calculated {
  result: ZTestResult;
  /** The inputs exactly as they were when Calculate was pressed. */
  snapshot: string;
  mode: InputMode;
}

const NO_ERRORS: FieldErrors = {};

export default function ZTestCalculator() {
  const [raw, setRaw] = useState<RawInputs>(emptyInputs);
  const [calculated, setCalculated] = useState<Calculated | null>(null);
  const [attempted, setAttempted] = useState(false);
  const chartRef = useRef<ChartJS<'bar'> | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const { errors, parsed } = useMemo(() => validate(raw), [raw]);

  // Errors stay hidden until the first Calculate, then update live as they are
  // fixed, so an untouched form is never covered in red.
  const visibleErrors = attempted ? errors : NO_ERRORS;

  const stale = calculated !== null && calculated.snapshot !== JSON.stringify(raw);
  const blank = isBlank(raw);

  const handleCalculate = () => {
    setAttempted(true);
    if (!parsed) return;

    window.umami?.track('calculation_run', { tool: 'single-z-test' });
    setCalculated({
      result: calculateZTest(parsed.g1, parsed.g2, parsed.settings),
      snapshot: JSON.stringify(raw),
      mode: raw.mode,
    });

    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleModeChange = (mode: InputMode) => {
    setRaw((prev) =>
      prev.mode === mode
        ? prev
        : { ...prev, mode, g1: syncModes(prev.g1, mode), g2: syncModes(prev.g2, mode) }
    );
  };

  const handleGroupChange = (key: GroupKey, patch: Partial<RawGroup>) => {
    setRaw((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handlePreset = (apply: () => RawInputs) => {
    setRaw(apply());
    setCalculated(null);
    setAttempted(false);
  };

  const handleClear = () => {
    setRaw(emptyInputs());
    setCalculated(null);
    setAttempted(false);
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-card bg-white shadow-card transition-shadow duration-500 ease-site hover:shadow-cardHover">
        <div className="p-6 sm:p-8">
          <InputForm
            raw={raw}
            errors={visibleErrors}
            onModeChange={handleModeChange}
            onGroupChange={handleGroupChange}
            onWeightedChange={(on) => setRaw((prev) => ({ ...prev, weighted: on }))}
            onWeightModeChange={(weightMode: WeightMode) =>
              setRaw((prev) => ({ ...prev, weightMode }))
            }
          />

          <div className="mt-6">
            <TestSettings
              alpha={raw.alpha}
              setAlpha={(alpha) => setRaw((prev) => ({ ...prev, alpha }))}
              tails={raw.tails}
              setTails={(tails: Tails) => setRaw((prev) => ({ ...prev, tails }))}
              direction={raw.direction}
              setDirection={(direction: Direction) => setRaw((prev) => ({ ...prev, direction }))}
              group1Name={raw.g1.name.trim() || GROUP_LABELS.g1}
              group2Name={raw.g2.name.trim() || GROUP_LABELS.g2}
            />
          </div>

          <div className="no-print mt-6">
            <button
              type="button"
              onClick={handleCalculate}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-pill border-2 border-brand bg-brand px-7 font-medium tracking-tight text-white transition-colors duration-200 hover:border-brand-hover hover:bg-brand-hover"
            >
              {stale ? (
                <RefreshCw size={18} aria-hidden="true" />
              ) : (
                <Calculator size={18} aria-hidden="true" />
              )}
              {stale ? 'Recalculate' : 'Calculate Two-Proportion Z-Test'}
            </button>

            {attempted && errorCount > 0 && (
              <p className="mt-3 flex items-start gap-2 text-sm text-danger" role="alert">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  {errorCount === 1
                    ? 'One field needs attention before the test can run.'
                    : `${errorCount} fields need attention before the test can run.`}
                </span>
              </p>
            )}
          </div>

          <div className="no-print mt-6 border-t border-hairline pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-1 text-sm font-medium tracking-tight text-ink">Load an example</p>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset.apply)}
                  title={preset.description}
                  className="min-h-[40px] rounded-pill border border-hairline bg-white px-4 text-sm font-medium tracking-tight text-brand transition-colors duration-200 hover:border-brand hover:bg-brand-tint"
                >
                  {preset.label}
                </button>
              ))}
              {!blank && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-[40px] rounded-pill px-4 text-sm font-medium tracking-tight text-muted transition-colors duration-200 hover:text-brand"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Examples fill the fields only. Select Calculate to run the test.
            </p>
          </div>
        </div>
      </section>

      <div ref={resultsRef} aria-live="polite">
        {calculated ? (
          <section className="overflow-hidden rounded-card bg-white shadow-card transition-shadow duration-500 ease-site hover:shadow-cardHover">
            {stale && (
              <div className="no-print flex items-start gap-3 border-b border-warning/30 bg-warning/5 p-5">
                <RefreshCw
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-warning"
                  aria-hidden="true"
                />
                <p className="text-sm text-secondary">
                  <span className="font-medium text-warning">Inputs have changed.</span> These
                  results are from the previous run. Select Recalculate to update them.
                </p>
              </div>
            )}

            <div
              className={`space-y-8 p-6 transition-opacity duration-300 sm:p-8 ${
                stale ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <ResultsSection result={calculated.result} />

              <div className="border-t border-hairline pt-8">
                <ResultActions result={calculated.result} chartRef={chartRef} />
              </div>

              <div className="border-t border-hairline pt-8">
                <ChartSection result={calculated.result} chartRef={chartRef} />
              </div>

              <div className="border-t border-hairline pt-8">
                <ExplanationSection result={calculated.result} inputMode={calculated.mode} />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-card border border-dashed border-hairline bg-white/60 p-8 text-center">
            <Calculator className="mx-auto mb-3 h-6 w-6 text-muted" aria-hidden="true" />
            <p className="text-sm text-muted">
              {attempted && errorCount > 0
                ? `Results will appear once the ${errorCount === 1 ? 'highlighted field is' : 'highlighted fields are'} corrected and you select Calculate.`
                : 'Enter both groups, then select Calculate to run the test.'}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
