/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import { useMemo } from 'react';
import katex from 'katex';

interface TeXProps {
  /** TeX source. */
  children: string;
  /** Centred display style rather than inline. */
  display?: boolean;
}

/**
 * KaTeX is bundled with the app, so the formulas render with no network
 * request. The previous react-mathjax2 build pulled MathJax from a CDN and the
 * whole explanation disappeared when that request failed.
 */
export default function TeX({ children, display = false }: TeXProps) {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        output: 'html',
      }),
    [children, display]
  );

  return (
    <span
      className={display ? 'block overflow-x-auto py-1' : 'inline-block'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
