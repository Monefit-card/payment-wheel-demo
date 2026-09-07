'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/constants';
import { AccountSummary } from '@/lib/derive-account';
import { Bill, Scenario } from '@/types/app';
import { IconCardSettings, IconHome, IconReceipt } from '@/components/ui/icons';
import { CreditSegment } from './CreditBill';
import { InfoKey, InfoSheet } from './InfoSheet';
import { RepaymentSettingsSheet } from './RepaymentSettingsSheet';

const ACCOUNT_HOLDER_INITIALS = 'JS';

/* ── Header ──────────────────────────────────────────────────────────────── */

const HEADER_BUTTON: React.CSSProperties = {
  background: COLORS.surface,
  border: '0.5px solid rgba(19,20,23,0.1)',
  boxShadow: '0 1px 2px rgba(19,20,23,0.04)',
};

function ProfileButton({ initials = ACCOUNT_HOLDER_INITIALS }: { initials?: string }) {
  return (
    <button
      aria-label="Profile"
      className="w-[34px] h-[34px] rounded-full inline-flex items-center justify-center text-xs font-bold tracking-[-0.2px]"
      style={{ ...HEADER_BUTTON, color: COLORS.textPrimary }}
    >
      {initials}
    </button>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Manage payments"
      className="w-[34px] h-[34px] rounded-full inline-flex items-center justify-center"
      style={HEADER_BUTTON}
    >
      <IconCardSettings size={18} color={COLORS.textPrimary} />
    </button>
  );
}

/* ── Month picker ────────────────────────────────────────────────────────── */

interface MonthChipsProps {
  months: Bill[];
  activeKey: string;
  onPick: (key: string) => void;
}

/**
 * Flat, year-less row of month pills — just "Jan", "Feb". Sized so ~5 fit the
 * visible width at once; the rest reach via horizontal scroll (snapping per
 * pill) rather than a hard cutoff.
 */
function MonthChips({ months, activeKey, onPick }: MonthChipsProps) {
  return (
    <div
      className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-[18px]"
      style={{ scrollSnapType: 'x proximity' }}
    >
      {months.map((month) => {
        const [monthLabel] = month.period.split(' ');
        const isActive = month.key === activeKey;
        return (
          <button
            key={month.key}
            onClick={() => onPick(month.key)}
            className="flex-none py-2.5 rounded-full text-xs text-center whitespace-nowrap"
            style={{
              scrollSnapAlign: 'start',
              width: 'calc((100% - 32px) / 5)',
              minWidth: 52,
              background: isActive ? COLORS.surface : 'transparent',
              color: isActive ? COLORS.textPrimary : COLORS.labelMuted,
              fontWeight: isActive ? 600 : 500,
              border: isActive ? '0.5px solid rgba(19,20,23,0.08)' : 'none',
              boxShadow: isActive ? '0 1px 2px rgba(19,20,23,0.06)' : 'none',
            }}
          >
            {monthLabel}
          </button>
        );
      })}
    </div>
  );
}

/* ── Tab bar ─────────────────────────────────────────────────────────────── */

/** Floating Home/Bills pill. Overlays the scroll area, so content pads for it. */
function TabBar({ onNavigateHome }: { onNavigateHome: () => void }) {
  const tabs = [
    { label: 'Home', Icon: IconHome, active: false, onClick: onNavigateHome },
    { label: 'Bills', Icon: IconReceipt, active: true, onClick: undefined },
  ];

  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[110px] flex justify-center items-end pb-3.5 pointer-events-none"
      style={{
        background: `linear-gradient(rgba(242,242,244,0), ${COLORS.screen} 60%)`,
        zIndex: 7,
      }}
    >
      <div
        className="w-60 h-[68px] rounded-[34px] flex items-center justify-around px-2 pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(0,0,0,0.05)',
        }}
      >
        {tabs.map(({ label, Icon, active, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center gap-0.5 px-6 py-1"
            style={{ opacity: active ? 1 : 0.55 }}
          >
            <Icon color={COLORS.textPrimary} size={24} />
            <span
              className="text-[11px]"
              style={{ color: COLORS.textPrimary, fontWeight: active ? 700 : 500 }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Screen ──────────────────────────────────────────────────────────────── */

interface BillsScreenProps {
  scenario: Scenario;
  summary: AccountSummary;
  /** Hands off to the payment wheel. */
  onPay: () => void;
  onNavigateHome: () => void;
}

/**
 * The Bills tab — one credit bill at a time, picked by month.
 *
 * Flex deliberately isn't here: instalment plans live on their own surface, so
 * this screen is only ever the credit bill and its transactions.
 */
export function BillsScreen({ scenario, summary, onPay, onNavigateHome }: BillsScreenProps) {
  const [monthKey, setMonthKey] = useState(scenario.currentMonthKey);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoTopic, setInfoTopic] = useState<InfoKey | null>(null);

  // Switching scenario swaps the whole bill history out from under the picker,
  // so the selection resets to that scenario's current bill. Adjusted during
  // render rather than in an effect — no second paint with a stale month.
  const [pickedForScenario, setPickedForScenario] = useState(scenario.key);
  if (pickedForScenario !== scenario.key) {
    setPickedForScenario(scenario.key);
    setMonthKey(scenario.currentMonthKey);
  }

  const bill = scenario.months.find((m) => m.key === monthKey) ?? scenario.months[0];

  return (
    <div className="h-full flex flex-col relative">
      <div className="shrink-0 pt-[60px]" style={{ background: COLORS.screen }}>
        <div className="flex items-center justify-between px-5 pt-1 pb-3.5">
          <ProfileButton />
          <SettingsButton onClick={() => setSettingsOpen(true)} />
        </div>
        <MonthChips months={scenario.months} activeKey={monthKey} onPick={setMonthKey} />
      </div>

      {/* Bottom padding clears the floating tab bar. */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-[110px]">
        {bill && (
          <CreditSegment
            bill={bill}
            accountBlocked={scenario.accountBlocked}
            minimumPayment={summary.minimumPayment}
            onOpenInfo={setInfoTopic}
            onPay={onPay}
          />
        )}
      </div>

      <TabBar onNavigateHome={onNavigateHome} />

      <RepaymentSettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InfoSheet topic={infoTopic} onClose={() => setInfoTopic(null)} />
    </div>
  );
}
