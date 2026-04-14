'use client';

import { AccountState, UserType } from '@/types/payment';
import { COLORS } from '@/lib/constants';

interface AdminControlsProps {
  state: AccountState;
  onChange: (state: AccountState) => void;
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full mt-1 px-3 py-2 rounded-lg text-sm font-medium tabular-nums outline-none"
        style={{
          background: COLORS.background,
          color: COLORS.textPrimary,
          border: `1px solid ${COLORS.surfaceBorder}`,
        }}
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
  activeColor,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  activeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
        {label}
      </span>
      <button
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{
          background: value ? activeColor || '#22c55e' : COLORS.surfaceBorder,
        }}
        onClick={() => onChange(!value)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
          style={{
            transform: value ? 'translateX(22px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );
}

export function AdminControls({ state, onChange }: AdminControlsProps) {
  const update = (partial: Partial<AccountState>) => {
    const newState = { ...state, ...partial };
    if (partial.userType === 'revolver') {
      newState.dueBalance = newState.totalBalance;
    }
    if (newState.dueBalance > newState.totalBalance) {
      newState.dueBalance = newState.totalBalance;
    }
    onChange(newState);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
        Manual Controls
      </h3>

      <NumberInput
        label="Total Balance (€)"
        value={state.totalBalance}
        onChange={(v) => update({ totalBalance: v })}
        step={50}
      />
      <NumberInput
        label="Due Balance (€)"
        value={state.dueBalance}
        onChange={(v) => update({ dueBalance: v })}
        max={state.totalBalance}
        step={50}
      />
      <NumberInput
        label="Outstanding Interest (€)"
        value={state.outstandingInterest}
        onChange={(v) => update({ outstandingInterest: v })}
        step={5}
      />

      <div>
        <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          User Type
        </label>
        <div className="flex gap-2 mt-1">
          {(['transactor', 'revolver'] as UserType[]).map((type) => (
            <button
              key={type}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-colors"
              style={{
                background: state.userType === type ? '#3b82f6' : COLORS.background,
                color: state.userType === type ? '#fff' : COLORS.textSecondary,
                border: `1px solid ${state.userType === type ? '#3b82f6' : COLORS.surfaceBorder}`,
              }}
              onClick={() => update({ userType: type })}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <Toggle
        label="In Payment Period"
        value={state.isInPaymentPeriod}
        onChange={(v) => update({ isInPaymentPeriod: v })}
        activeColor="#3b82f6"
      />
      <Toggle
        label="Card Blocked"
        value={state.isCardBlocked}
        onChange={(v) => update({ isCardBlocked: v, isInPaymentPeriod: v ? true : state.isInPaymentPeriod })}
        activeColor="#ef4444"
      />
    </div>
  );
}
