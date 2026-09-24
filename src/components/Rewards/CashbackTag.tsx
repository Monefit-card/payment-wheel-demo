'use client';

import { COLORS } from '@/lib/constants';
import { EarnedPurchase } from '@/lib/smartsaver';
import { eur } from './format';
import { IconCashback } from './icons';

/**
 * Cashback under a transaction's amount: what it earned, or that it fell
 * past the month's cap. Pending and paid read the same here — the Rewards
 * tab is where the daily payout is tracked.
 */
export function CashbackTag({ purchase }: { purchase: EarnedPurchase }) {
  if (purchase.cashback === 0) {
    return (
      <div className="text-[12px] mt-0.5" style={{ color: COLORS.textMuted }}>
        Cap reached
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center gap-1 text-[12.5px] font-medium mt-0.5 tabular-nums"
      style={{ color: COLORS.cashbackText }}
    >
      <IconCashback size={11} color={COLORS.cashback} />
      {eur(purchase.cashback, { sign: true })}
    </div>
  );
}
