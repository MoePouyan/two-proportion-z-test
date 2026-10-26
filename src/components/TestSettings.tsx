/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import SegmentedControl from './ui/SegmentedControl';
import type { Direction, Tails } from '../utils/statistics';

interface TestSettingsProps {
  alpha: string;
  setAlpha: (value: string) => void;
  tails: Tails;
  setTails: (value: Tails) => void;
  direction: Direction;
  setDirection: (value: Direction) => void;
  group1Name: string;
  group2Name: string;
}

export default function TestSettings({
  alpha,
  setAlpha,
  tails,
  setTails,
  direction,
  setDirection,
  group1Name,
  group2Name,
}: TestSettingsProps) {
  return (
    <div className="rounded-control border border-hairline bg-paper p-5">
      <h3 className="mb-4 font-display text-base font-bold tracking-tighter text-ink">
        Test settings
      </h3>

      <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
        <SegmentedControl
          name="alpha"
          legend="Confidence level"
          value={alpha}
          onChange={setAlpha}
          options={[
            { value: '0.1', label: '90%' },
            { value: '0.05', label: '95%' },
            { value: '0.01', label: '99%' },
          ]}
        />

        <SegmentedControl
          name="tails"
          legend="Test direction"
          value={String(tails)}
          onChange={(value) => setTails(Number(value) as Tails)}
          options={[
            { value: '2', label: 'Two-tailed' },
            { value: '1', label: 'One-tailed' },
          ]}
        />

        {tails === 1 && (
          <SegmentedControl
            name="direction"
            legend="Alternative hypothesis"
            value={direction}
            onChange={(value) => setDirection(value as Direction)}
            options={[
              { value: 'greater', label: `${group1Name} higher` },
              { value: 'less', label: `${group1Name} lower` },
            ]}
            hint={`Tested against ${group2Name}. Choose the direction before looking at the data.`}
          />
        )}
      </div>
    </div>
  );
}
