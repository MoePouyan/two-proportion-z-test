/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import ZTestCalculator from './components/ZTestCalculator';

export default function App() {
  return (
    <div className="min-h-screen bg-page py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <p className="mb-3 inline-flex items-center rounded-pill border border-hairline bg-white px-4 py-1 text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Significance testing
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tighter text-brand sm:text-4xl">
            Two-Proportion Z-Test Calculator
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-secondary sm:text-xl">
            Test whether the gap between two percentages is real or sampling noise. Built for
            crosstab work: weighted bases, confidence intervals and assumption checks included.
          </p>
        </header>

        <ZTestCalculator />

        <footer className="mt-8 text-center text-sm text-muted">
          <p>
            Pooled Z-test for two independent proportions. Confidence intervals use the unpooled
            standard error.
          </p>
          <p className="mt-2">
            &copy; 2026{' '}
            <a
              href="https://www.moepouyan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand hover:text-brand-hover hover:underline"
            >
              Moe Pouyan
            </a>
            . All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
