'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminControls } from './AdminControls';
import { PresetButtons } from './PresetButtons';
import { COLORS } from '@/lib/constants';
import { SCENARIOS } from '@/lib/scenarios';
import { formatEuro } from '@/lib/payment-math';
import { AccountState } from '@/types/payment';
import { AppStateReturn } from '@/hooks/useAppState';
import type { WheelVariant } from '@/app/page';

interface AdminPanelProps {
  /** The single app store. The panel drives the scenario and the QA overrides. */
  app: AppStateReturn;
  /**
   * The wheel's live minimum — it reflects the overrides below, which
   * `summary.minimumPayment` (derived from the scenario alone) does not.
   */
  wheelMinimum: number;
  /** `paymentState.applyPreset` — swaps the account and re-seeds the handle. */
  onApplyPreset: (state: AccountState) => void;
  /** Which of the two wheel designs is on screen. */
  wheelVariant: WheelVariant;
  onWheelVariantChange: (variant: WheelVariant) => void;
}

const WHEEL_VARIANTS: { key: WheelVariant; label: string; caption: string }[] = [
  {
    key: 'with-settlement',
    label: '1 · With instalments',
    caption:
      'Future instalments past the card balance, Flex interest box, "Card payment", split minimum anchor',
  },
  {
    key: 'card-only',
    label: '2 · Card only',
    caption: 'No future instalments or Flex interest, "Balance", "Total payment"',
  },
];

/** One read-only derived figure. */
function ReadoutRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-medium" style={{ color: COLORS.textSecondary }}>
          {label}
        </div>
        {hint && (
          <div className="text-[10px] leading-tight" style={{ color: COLORS.textMuted }}>
            {hint}
          </div>
        )}
      </div>
      <div
        className="text-[12px] font-semibold tabular-nums shrink-0"
        style={{ color: COLORS.textPrimary }}
      >
        {value}
      </div>
    </div>
  );
}

export function AdminPanel({
  app,
  wheelMinimum,
  onApplyPreset,
  wheelVariant,
  onWheelVariantChange,
}: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { summary, account, scenarioKey, accountOverrides } = app;
  const hasOverrides = Object.keys(accountOverrides).length > 0;

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: '#ffffff',
          border: `1px solid ${COLORS.surfaceBorder}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
            stroke={COLORS.textSecondary}
            strokeWidth="1.5"
          />
          <path
            d="M14.7 11.1a1.2 1.2 0 00.24 1.32l.04.04a1.457 1.457 0 11-2.06 2.06l-.04-.04a1.2 1.2 0 00-1.32-.24 1.2 1.2 0 00-.73 1.1v.11a1.455 1.455 0 11-2.91 0v-.06a1.2 1.2 0 00-.78-1.1 1.2 1.2 0 00-1.32.24l-.04.04a1.457 1.457 0 11-2.06-2.06l.04-.04a1.2 1.2 0 00.24-1.32 1.2 1.2 0 00-1.1-.73h-.11a1.455 1.455 0 110-2.91h.06a1.2 1.2 0 001.1-.78 1.2 1.2 0 00-.24-1.32l-.04-.04a1.457 1.457 0 112.06-2.06l.04.04a1.2 1.2 0 001.32.24h.06a1.2 1.2 0 00.73-1.1v-.11a1.455 1.455 0 112.91 0v.06a1.2 1.2 0 00.73 1.1 1.2 1.2 0 001.32-.24l.04-.04a1.457 1.457 0 112.06 2.06l-.04.04a1.2 1.2 0 00-.24 1.32v.06a1.2 1.2 0 001.1.73h.11a1.455 1.455 0 110 2.91h-.06a1.2 1.2 0 00-1.1.73z"
            stroke={COLORS.textSecondary}
            strokeWidth="1.5"
          />
        </svg>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
            style={{
              width: 'min(320px, 85vw)',
              background: '#ffffff',
              borderLeft: `1px solid ${COLORS.surfaceBorder}`,
              boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>
                  Admin Panel
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: COLORS.background }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke={COLORS.textSecondary} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Engineering reference — the two repayment methods, with the
                  numbers computed by the same functions the app calls. */}
              <a
                href="/methods"
                target="_blank"
                rel="noreferrer"
                className="block px-3 py-2.5 rounded-xl"
                style={{ background: COLORS.ctaBackground }}
              >
                <div className="text-xs font-semibold" style={{ color: '#fff' }}>
                  Repayment methods ↗
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  How reduce-exposure and clear-instalments differ, with worked examples
                </div>
              </a>

              <div className="space-y-2">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Wheel version
                </h3>
                {WHEEL_VARIANTS.map((v) => {
                  const active = v.key === wheelVariant;
                  return (
                    <motion.button
                      key={v.key}
                      className="w-full text-left px-3 py-2.5 rounded-xl"
                      style={{
                        background: active ? '#3b82f6' : COLORS.background,
                        border: `1px solid ${active ? '#3b82f6' : COLORS.surfaceBorder}`,
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onWheelVariantChange(v.key)}
                    >
                      <div
                        className="text-xs font-semibold"
                        style={{ color: active ? '#fff' : COLORS.textPrimary }}
                      >
                        {v.label}
                      </div>
                      <div
                        className="text-[10px] mt-0.5 leading-snug"
                        style={{ color: active ? 'rgba(255,255,255,0.85)' : COLORS.textMuted }}
                      >
                        {v.caption}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="h-px" style={{ background: COLORS.surfaceBorder }} />

              {/* Scenario — the whole app state, not just the wheel's numbers.
                  Switching also drops any overrides (see `setScenario`). */}
              <div className="space-y-2">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Scenario
                </h3>
                {SCENARIOS.map((s) => {
                  const active = s.key === scenarioKey;
                  return (
                    <motion.button
                      key={s.key}
                      className="w-full text-left px-3 py-2.5 rounded-xl"
                      style={{
                        background: active ? '#3b82f6' : COLORS.background,
                        border: `1px solid ${active ? '#3b82f6' : COLORS.surfaceBorder}`,
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => app.setScenario(s.key)}
                    >
                      <div
                        className="text-xs font-semibold"
                        style={{ color: active ? '#fff' : COLORS.textPrimary }}
                      >
                        {s.label}
                      </div>
                      <div
                        className="text-[10px] mt-0.5 leading-snug"
                        style={{ color: active ? 'rgba(255,255,255,0.85)' : COLORS.textMuted }}
                      >
                        {s.caption}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="h-px" style={{ background: COLORS.surfaceBorder }} />

              {/* Derived figures — read-only. The point of the readout is that
                  ACCOUNT TOTAL and WHEEL TOTAL differ by exactly FLEX FUTURE;
                  if they don't, a derivation is broken. */}
              <div className="space-y-2">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Derived
                </h3>
                <div
                  className="rounded-xl px-3 py-3 space-y-2"
                  style={{
                    background: COLORS.background,
                    border: `1px solid ${COLORS.surfaceBorder}`,
                  }}
                >
                  <ReadoutRow
                    label="Credit outstanding"
                    value={formatEuro(summary.creditOutstanding)}
                  />
                  <ReadoutRow
                    label="Upcoming spend"
                    value={formatEuro(summary.upcomingSpend)}
                  />
                  <ReadoutRow
                    label="Flex due"
                    value={formatEuro(summary.flexDue)}
                    hint="in the wheel"
                  />
                  <ReadoutRow
                    label="Flex future"
                    value={formatEuro(summary.flexFuture)}
                    hint="excluded from the wheel"
                  />
                  <div className="h-px" style={{ background: COLORS.surfaceBorder }} />
                  <ReadoutRow
                    label="Account total"
                    value={formatEuro(summary.accountTotalBalance)}
                    hint="Home"
                  />
                  <ReadoutRow
                    label="Wheel total"
                    value={formatEuro(account.totalBalance)}
                    hint="account total − flex future"
                  />
                  <ReadoutRow label="Wheel due" value={formatEuro(account.dueBalance)} />
                  <ReadoutRow
                    label="Minimum"
                    value={formatEuro(wheelMinimum)}
                    hint="credit minimum + flex due"
                  />
                </div>
                {hasOverrides && (
                  <p className="text-[10px] leading-snug" style={{ color: '#b45309' }}>
                    Overrides active — the wheel figures above are hand-set, not derived.
                  </p>
                )}
              </div>

              <div className="h-px" style={{ background: COLORS.surfaceBorder }} />

              <PresetButtons onApply={onApplyPreset} />

              <div className="h-px" style={{ background: COLORS.surfaceBorder }} />

              {/* Manual edits are overrides layered on the derived state. */}
              <AdminControls state={account} onChange={app.overrideAccount} />

              <button
                onClick={app.resetOverrides}
                disabled={!hasOverrides}
                className="w-full py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  background: COLORS.background,
                  border: `1px solid ${COLORS.surfaceBorder}`,
                  color: hasOverrides ? COLORS.textPrimary : COLORS.textMuted,
                }}
              >
                Reset overrides
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
