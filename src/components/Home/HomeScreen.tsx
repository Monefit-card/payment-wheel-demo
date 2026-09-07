'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { COLORS } from '@/lib/constants';
import { getDueDate, formatEuro } from '@/lib/payment-math';
import { flexedTxnIds, flexRemainingTotal } from '@/lib/flex-math';
import { AccountSummary } from '@/lib/derive-account';
import { Scenario } from '@/types/app';
import { FlexTxnRow } from '@/components/Flex/FlexTxnRow';
import {
  BillsIcon,
  CardIcon,
  CardStackArt,
  ChevronRight,
  CloseIcon,
  HomeIcon,
} from './icons';

const ACCOUNT_HOLDER_INITIALS = 'JS';

/** How many of the feed's transactions the home card previews. */
const PREVIEW_TXN_COUNT = 2;

/** "15 Feb" — the compact due date the home screen shows. */
function formatDueDateCompact(): string {
  const due = getDueDate();
  return `15 ${due.toLocaleDateString('en-GB', { month: 'short' })}`;
}

function SquareButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="w-14 h-14 flex items-center justify-center rounded-[18px]"
      style={{
        background: 'rgba(255,255,255,0.65)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] ${className}`}
      style={{
        background: COLORS.surface,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </div>
  );
}

interface HomeScreenProps {
  /** The working scenario — supplies the transaction feed and active plans. */
  scenario: Scenario;
  /** Derived account figures. Home shows the ACCOUNT total, not the wheel's. */
  summary: AccountSummary;
  /** Open the payment wheel. */
  onPay: () => void;
  /** Switch to the Bills tab. */
  onNavigateBills: () => void;
  /** Open Flex with no transaction pre-selected (manage, or create). */
  onOpenFlex: () => void;
  /** Open the full transactions page. */
  onOpenTransactions: () => void;
  /** Flex a specific transaction — opens the picker with it pre-selected. */
  onFlexTxn: (txnId: string) => void;
}

export function HomeScreen({
  scenario,
  summary,
  onPay,
  onNavigateBills,
  onOpenFlex,
  onOpenTransactions,
  onFlexTxn,
}: HomeScreenProps) {
  const [promoDismissed, setPromoDismissed] = useState(false);

  /**
   * "Spent" is the credit line in use, so it must be the figure `available`
   * is the complement of — `accountTotalBalance` (current bill + open-cycle
   * spend + ALL flex, due and future). Not the wheel's `totalBalance`: that
   * one excludes future instalments, so pairing it with Available would leave
   * the two numbers failing to add up to the limit. Note this is what's still
   * OWED rather than what was ever spent — repaid amounts free the limit back
   * up, which is exactly what the Available line beneath it reports.
   */
  const spent = summary.accountTotalBalance;
  const available = summary.available;

  const [spentWhole, spentCents] = spent.toFixed(2).split('.');

  /** A transaction on an active plan can't be flexed again. */
  const flexedIds = flexedTxnIds(scenario.flexPlans);
  const previewTxns = scenario.transactions.slice(0, PREVIEW_TXN_COUNT);

  const hasPlans = scenario.flexPlans.length > 0;
  const flexRemaining = flexRemainingTotal(scenario.flexPlans);

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Account holder + card shortcut */}
        <div className="flex items-center justify-between pt-3">
          <SquareButton label="Account">
            <span
              className="text-lg font-semibold"
              style={{ color: COLORS.textPrimary }}
            >
              {ACCOUNT_HOLDER_INITIALS}
            </span>
          </SquareButton>

          <SquareButton label="Cards">
            <CardIcon />
          </SquareButton>
        </div>

        {/* Spend summary */}
        <div
          className="mt-5 rounded-[28px] px-6 pt-5 pb-5 flex flex-col"
          style={{
            background:
              'linear-gradient(135deg, #2b2b30 0%, #1a1a1e 45%, #0d0d10 100%)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          }}
        >
          <span className="text-[15px]" style={{ color: '#8e8e93' }}>
            Spent
          </span>

          <div className="flex items-baseline mt-0.5">
            <span
              className="text-[44px] leading-none font-semibold tabular-nums"
              style={{ color: COLORS.textWhite }}
            >
              €{Number(spentWhole).toLocaleString('en-US')}
            </span>
            <span
              className="text-[27px] leading-none font-semibold tabular-nums"
              style={{ color: '#8e8e93' }}
            >
              .{spentCents}
            </span>
          </div>

          <button className="flex items-center gap-1.5 mt-7 self-start">
            <span
              className="text-[15px] font-medium tabular-nums"
              style={{ color: COLORS.textWhite }}
            >
              €{Math.round(available).toLocaleString('en-US')} Available
            </span>
            <ChevronRight size={14} color={COLORS.textWhite} />
          </button>
        </div>

        {/* Promo carousel */}
        {!promoDismissed && (
          <>
            <Card className="mt-4 relative overflow-hidden">
              <button
                aria-label="Dismiss"
                onClick={() => setPromoDismissed(true)}
                className="absolute top-3.5 right-3.5 z-10 w-6 h-6 flex items-center justify-center"
              >
                <CloseIcon />
              </button>

              <div className="pl-5 pr-[104px] py-6">
                <h2
                  className="text-[19px] font-bold leading-tight"
                  style={{ color: COLORS.textPrimary }}
                >
                  Order the Monefit card
                </h2>
                <p
                  className="text-[15px] mt-1.5 leading-snug"
                  style={{ color: COLORS.textSecondary }}
                >
                  Get the limited-edition original Monefit Black card
                </p>
              </div>

              {/* Anchored bottom-right so it stays clear of the dismiss button */}
              <div className="absolute -right-1 bottom-0 scale-[0.92] origin-bottom-right">
                <CardStackArt />
              </div>
            </Card>

            <div className="flex items-center justify-center gap-1.5 mt-3.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[7px] h-[7px] rounded-full"
                  style={{
                    background: i === 0 ? COLORS.textPrimary : '#c7c7cc',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Payment due + flex instalments */}
        <Card className="mt-4">
          <div className="flex items-center justify-between px-5 py-5">
            <div>
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: COLORS.textSecondary }}
              >
                Payment due
              </span>
              <div
                className="text-[24px] font-bold mt-0.5"
                style={{ color: COLORS.textPrimary }}
              >
                {formatDueDateCompact()}
              </div>
            </div>

            <motion.button
              className="px-9 py-4 rounded-2xl text-base font-semibold"
              style={{ background: '#000000', color: COLORS.textWhite }}
              whileTap={{ scale: 0.96 }}
              onClick={onPay}
            >
              Pay
            </motion.button>
          </div>

          <div className="h-px mx-5" style={{ background: '#ececf1' }} />

          {/* Everything still to pay across active plans. Only the slice due
              this period is in the payment above; the rest is why the wheel's
              total payment sits below the account's total balance. */}
          <button
            onClick={onOpenFlex}
            className="w-full flex items-center justify-between px-5 py-5"
          >
            <div className="text-left">
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: COLORS.textSecondary }}
              >
                Flex instalments
              </span>
              <div
                className="text-[24px] font-bold mt-0.5 tabular-nums"
                style={{
                  color: hasPlans ? COLORS.textPrimary : COLORS.textSecondary,
                }}
              >
                {hasPlans ? formatEuro(flexRemaining) : 'No active plans'}
              </div>
            </div>
            <ChevronRight size={20} color={COLORS.textPrimary} />
          </button>
        </Card>

        {/* Recent transactions — Flex chip on eligible rows, "Flexed" on ones
            already carried by an active plan. */}
        <Card className="mt-4 py-1">
          {previewTxns.map((txn) => (
            <FlexTxnRow
              key={txn.id}
              txn={txn}
              eligible={Boolean(txn.flexEligible) && !flexedIds.has(txn.id)}
              flexed={flexedIds.has(txn.id)}
              onFlex={onFlexTxn}
            />
          ))}

          <button
            onClick={onOpenTransactions}
            className="w-full text-center py-3.5 text-[15px] font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            Show all
          </button>
        </Card>
      </div>

      {/* Floating tab bar */}
      <div className="absolute left-0 right-0 bottom-6 flex justify-center pointer-events-none">
        <div
          className="flex items-center gap-1 p-1.5 rounded-full pointer-events-auto backdrop-blur-xl"
          style={{
            background: 'rgba(244,244,247,0.82)',
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 18px rgba(0,0,0,0.08)',
          }}
        >
          <div
            className="flex items-center gap-2 pl-6 pr-7 py-3 rounded-full"
            style={{ background: 'rgba(0,0,0,0.06)' }}
          >
            <HomeIcon />
            <span
              className="text-[15px] font-bold"
              style={{ color: COLORS.textPrimary }}
            >
              Home
            </span>
          </div>

          <button
            onClick={onNavigateBills}
            className="flex items-center gap-2 pl-6 pr-7 py-3 rounded-full"
          >
            <BillsIcon />
            <span
              className="text-[15px] font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              Bills
            </span>
          </button>
        </div>
      </div>

      {/* Home indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[140px] h-[5px] rounded-full"
        style={{ background: '#000' }}
      />
    </div>
  );
}
