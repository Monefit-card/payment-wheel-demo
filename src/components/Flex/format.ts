/**
 * Presentation helpers for the Flex screens.
 *
 * Money maths lives in `@/lib/flex-math` — nothing here derives a figure, it
 * only formats and buckets what the lists render. Keeping the day-grouping
 * here (rather than in lib) is deliberate: "Today / Yesterday / 16 Jun" is a
 * property of how these lists are drawn, not of the data.
 */

import { formatEuro } from '@/lib/payment-math';
import { Txn } from '@/types/app';

/**
 * Amount as shown in lists — an explicit `display` string wins over the
 * formatted amount.
 *
 * Formatting goes through the shared `formatEuro` (`€120.39`), which is the
 * shape every ported Flex screen was drawn around; `formatCurrency` is the
 * de-DE `Intl` form (`120,39 €`) and appears in none of these designs.
 */
export function txnAmount(txn: Txn): string {
  return txn.display ?? formatEuro(txn.amount);
}

export interface TxnDayGroup {
  day: string;
  items: Txn[];
}

/**
 * Group transactions into day sections ("Today", "Yesterday", "16 Jun"…),
 * preserving first-appearance order.
 */
export function groupTxnsByDay(txns: readonly Txn[]): TxnDayGroup[] {
  const groups: TxnDayGroup[] = [];

  for (const txn of txns) {
    const day = txn.day || txn.sub.split(',')[0];
    let group = groups.find((g) => g.day === day);
    if (!group) {
      group = { day, items: [] };
      groups.push(group);
    }
    group.items.push(txn);
  }

  return groups;
}
