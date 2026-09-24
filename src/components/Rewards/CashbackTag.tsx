'use client';

import { COLORS } from '@/lib/constants';
import { EarnedPurchase } from '@/lib/smartsaver';
import { eur } from './format';
import { IconCashback } from './icons';

/**
 * Cashback under a transaction's amount. Nothing when it earned nothing —
 * the cap is explained once, on the Rewards tab.
 */
export function CashbackTag({ purchase }: { purchase: EarnedPurchase }) {
  if (purchase.cashback === 0) return null;
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
