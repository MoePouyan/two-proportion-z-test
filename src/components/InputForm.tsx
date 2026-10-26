/*
 * Two-Proportion Z-Test Calculator
 * Copyright 2026 Moe Pouyan. All rights reserved.
 * https://www.moepouyan.com
 */
import NumberField from './ui/NumberField';
import SegmentedControl from './ui/SegmentedControl';
import type {
  FieldErrors,
  GroupKey,
  InputMode,
  RawGroup,
  RawInputs,
  WeightMode,
} from '../utils/inputs';
import { GROUP_LABELS } from '../utils/inputs';

interface InputFormProps {
  raw: RawInputs;
  errors: FieldErrors;
  onModeChange: (mode: InputMode) => void;
  onGroupChange: (key: GroupKey, patch: Partial<RawGroup>) => void;
  onWeightedChange: (on: boolean) => void;
  onWeightModeChange: (mode: WeightMode) => void;
}

const TEXT_FIELD =
  'block w-full rounded-control border border-hairline bg-white px-3.5 py-2.5 tracking-tight text-ink transition-colors placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

export default function InputForm({
  raw,
  errors,
  onModeChange,
  onGroupChange,
  onWeightedChange,
  onWeightModeChange,
}: InputFormProps) {
  const groups: GroupKey[] = ['g1', 'g2'];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold tracking-tighter text-brand">
          Input Parameters
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Enter each group on its own base, then select Calculate.
        </p>
      </div>

      <div className="mb-6">
        <SegmentedControl
          name="inputMode"
          legend="Select input mode"
          value={raw.mode}
          onChange={onModeChange}
          options={[
            { value: 'percentage', label: 'Percentage' },
            { value: 'counts', label: 'Success counts' },
          ]}
          hint="Switching modes converts the figures you have already entered."
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {groups.map((key) => (
          <div key={`${key}-name`}>
            <label
              htmlFor={`${key}-name`}
              className="mb-1.5 block text-sm font-medium tracking-tight text-ink"
            >
              Name for {GROUP_LABELS[key]}
            </label>
            <input
              id={`${key}-name`}
              type="text"
              autoComplete="off"
              value={raw[key].name}
              placeholder={GROUP_LABELS[key]}
              onChange={(e) => onGroupChange(key, { name: e.target.value })}
              className={TEXT_FIELD}
            />
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {groups.map((key) => {
          const group = raw[key];
          const label = group.name.trim() || GROUP_LABELS[key];

          return (
            <div
              key={key}
              className="space-y-5 rounded-control border border-hairline bg-paper p-5"
            >
              <p className="font-display text-sm font-bold uppercase tracking-[0.1em] text-brand">
                {label}
              </p>

              {raw.mode === 'percentage' ? (
                <NumberField
                  id={`${key}-pct`}
                  label={`Percentage for ${label}`}
                  value={group.pct}
                  onChange={(value) => onGroupChange(key, { pct: value })}
                  error={errors[`${key}.pct`]}
                  suffix="%"
                  placeholder="0.0"
                />
              ) : (
                <NumberField
                  id={`${key}-count`}
                  label={`Success count for ${label}`}
                  value={group.count}
                  onChange={(value) => onGroupChange(key, { count: value })}
                  error={errors[`${key}.count`]}
                  placeholder="0"
                />
              )}

              <NumberField
                id={`${key}-base`}
                label={`Sample size for ${label}`}
                value={group.base}
                onChange={(value) => onGroupChange(key, { base: value })}
                error={errors[`${key}.base`]}
                hint={raw.weighted ? 'Nominal (unweighted) base.' : undefined}
                placeholder="0"
              />

              {raw.weighted &&
                (raw.weightMode === 'effective' ? (
                  <NumberField
                    id={`${key}-effBase`}
                    label={`Effective base for ${label}`}
                    value={group.effBase}
                    onChange={(value) => onGroupChange(key, { effBase: value })}
                    error={errors[`${key}.effBase`]}
                    hint="Kish effective sample size, (sum of w) squared over sum of w squared."
                    placeholder="0"
                  />
                ) : (
                  <NumberField
                    id={`${key}-deff`}
                    label={`Design effect for ${label}`}
                    value={group.deff}
                    onChange={(value) => onGroupChange(key, { deff: value })}
                    error={errors[`${key}.deff`]}
                    hint="deff = nominal base / effective base. 1.00 means unweighted."
                    placeholder="1.00"
                    step="0.01"
                  />
                ))}
            </div>
          );
        })}
      </div>

      <div className="rounded-control border border-hairline bg-white p-5">
        <div className="flex items-start gap-3">
          <input
            id="weighted"
            type="checkbox"
            checked={raw.weighted}
            onChange={(e) => onWeightedChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-hairline text-brand focus:ring-brand"
          />
          <div className="flex-1">
            <label
              htmlFor="weighted"
              className="block text-sm font-medium tracking-tight text-ink"
            >
              Data is weighted
            </label>
            <p className="mt-1 text-xs text-muted">
              Rim-weighted percentages tested on their nominal base overstate significance. Supply
              an effective base and the standard errors use that instead.
            </p>

            {raw.weighted && (
              <div className="mt-4">
                <SegmentedControl
                  name="weightMode"
                  legend="Weighting input"
                  value={raw.weightMode}
                  onChange={onWeightModeChange}
                  options={[
                    { value: 'effective', label: 'Effective base' },
                    { value: 'deff', label: 'Design effect' },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
