/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import { useMemo, type MutableRefObject } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type Plugin,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ZTestResult } from '../utils/statistics';
import { formatBase, formatSignedPP } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* Site typography and colours for every chart in the app. */
ChartJS.defaults.font.family = "'Outfit', system-ui, -apple-system, sans-serif";
ChartJS.defaults.color = '#5B6673';

const SERIES = ['#0047AB', '#18212B'];

interface ChartSectionProps {
  result: ZTestResult;
  chartRef: MutableRefObject<ChartJS<'bar'> | null>;
}

export default function ChartSection({ result, chartRef }: ChartSectionProps) {
  const { g1, g2, significant } = result;
  const p1 = g1.p * 100;
  const p2 = g2.p * 100;

  const data = useMemo(
    () => ({
      labels: [g1.name, g2.name],
      datasets: [
        {
          label: 'Percentage (%)',
          data: [p1, p2],
          backgroundColor: SERIES,
          borderWidth: 0,
          borderRadius: 6,
          maxBarThickness: 96,
        },
      ],
    }),
    [g1.name, g2.name, p1, p2]
  );

  /**
   * Scoped to this chart via the plugins prop rather than Chart.register, so it
   * cannot leak onto any other chart instance.
   */
  const differenceLabel: Plugin<'bar'> = useMemo(
    () => ({
      id: 'differenceLabel',
      afterDatasetsDraw(chart) {
        const meta = chart.getDatasetMeta(0);
        const index = p1 >= p2 ? 0 : 1;
        const bar = meta.data[index];
        if (!bar) return;

        const { ctx } = chart;
        ctx.save();
        ctx.fillStyle = significant ? '#166534' : '#991B1B';
        ctx.font = "700 14px 'Space Grotesk', system-ui, sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          `Difference: ${formatSignedPP(result.differencePP)} pp`,
          bar.x,
          bar.y - 10
        );
        ctx.restore();
      },
    }),
    [p1, p2, significant, result.differencePP]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 30 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18212B',
          cornerRadius: 12,
          padding: 12,
          displayColors: false,
          titleFont: { family: "'Space Grotesk', system-ui, sans-serif", weight: 700 as const },
          callbacks: {
            label: (context: { dataIndex: number; parsed: { y: number } }) => {
              const group = context.dataIndex === 0 ? g1 : g2;
              const base = `${context.parsed.y.toFixed(1)}% of ${formatBase(group.n)}`;
              return result.weighted ? `${base} (effective ${formatBase(group.nEff)})` : base;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: '#D5D9DF' },
          ticks: { color: '#18212B', font: { size: 13, weight: 500 as const } },
        },
        y: {
          beginAtZero: true,
          max: Math.min(100, Math.max(10, Math.max(p1, p2) * 1.2)),
          grid: { color: 'rgba(0,0,0,0.06)' },
          border: { display: false },
          title: { display: true, text: 'Percentage (%)', color: '#5B6673' },
          ticks: { color: '#5B6673' },
        },
      },
      animation: { duration: 600 as const },
    }),
    [g1, g2, p1, p2, result.weighted]
  );

  return (
    <div className="animate-fadeIn">
      <h2 className="mb-4 font-display text-xl font-bold tracking-tighter text-brand">
        Visual Comparison
      </h2>
      <div className="h-80 w-full rounded-control border border-hairline bg-white p-4">
        <Bar ref={chartRef} data={data} options={options} plugins={[differenceLabel]} />
      </div>

      {/* Text equivalent of the chart for screen readers. */}
      <table className="sr-only">
        <caption>Percentage by group, with bases</caption>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">Percentage</th>
            <th scope="col">Base</th>
          </tr>
        </thead>
        <tbody>
          {[g1, g2].map((group) => (
            <tr key={group.name}>
              <th scope="row">{group.name}</th>
              <td>{(group.p * 100).toFixed(1)}%</td>
              <td>
                {formatBase(group.n)}
                {result.weighted ? `, effective ${formatBase(group.nEff)}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
