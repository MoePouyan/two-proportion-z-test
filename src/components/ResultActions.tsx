/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import { useState, type MutableRefObject } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import { Check, ClipboardCopy, Image, Table } from 'lucide-react';
import type { ZTestResult } from '../utils/statistics';
import { csvText, downloadBlob, slugify, summaryText, triggerDownload } from '../utils/exportResult';

interface ResultActionsProps {
  result: ZTestResult;
  chartRef: MutableRefObject<ChartJS<'bar'> | null>;
}

const BASE =
  'inline-flex min-h-[44px] items-center gap-2 rounded-pill border-2 px-5 font-medium tracking-tight transition-colors duration-200';
const PRIMARY = `${BASE} border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover`;
const SECONDARY = `${BASE} border-brand bg-transparent text-brand hover:bg-brand-tint`;

export default function ResultActions({ result, chartRef }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const filename = `z-test-${slugify(result.g1.name)}-vs-${slugify(result.g2.name)}`;

  const handleCopy = async () => {
    const text = summaryText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 4000);
    }
  };

  const handleCsv = () => {
    downloadBlob(`${filename}.csv`, 'text/csv;charset=utf-8', csvText(result));
  };

  const handlePng = () => {
    const chart = chartRef.current;
    if (!chart) return;
    triggerDownload(`${filename}.png`, chart.toBase64Image('image/png', 1));
  };

  return (
    <div className="no-print">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleCopy} className={PRIMARY}>
          {copied ? <Check size={18} aria-hidden="true" /> : <ClipboardCopy size={18} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy summary'}
        </button>

        <button type="button" onClick={handleCsv} className={SECONDARY} aria-label="Download results as CSV">
          <Table size={18} aria-hidden="true" />
          CSV
        </button>

        <button
          type="button"
          onClick={handlePng}
          className={SECONDARY}
          aria-label="Download the chart as a PNG image"
        >
          <Image size={18} aria-hidden="true" />
          Chart PNG
        </button>
      </div>

      <p aria-live="polite" className="sr-only">
        {copied ? 'Summary copied to the clipboard.' : ''}
      </p>

      {copyFailed && (
        <p className="mt-3 text-sm text-danger">
          The browser blocked clipboard access. Use the CSV download instead.
        </p>
      )}
    </div>
  );
}
