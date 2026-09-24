'use client';

import { Card } from '@/components/ui/Card';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { COLORS } from '@/lib/constants';
import { Txn } from '@/types/app';
import { EarnedPurchase } from '@/lib/smartsaver';
import { FlexTxnRow } from './FlexTxnRow';
import { groupTxnsByDay } from './format';

interface FlexTransactionsPageProps {
  /** The full feed — Home shows the first couple, this shows all of them. */
  txns: Txn[];
  onBack: () => void;
  onFlex: (txnId: string) => void;
  eligibleIds: ReadonlySet<string>;
  flexedIds: ReadonlySet<string>;
  cashbackByTxn?: ReadonlyMap<string, EarnedPurchase>;
  zIndex?: number;
}

/**
 * "Show all" — the full transactions list, same day-sectioned structure as
 * the Flex picker, with the same chips and markers on each row.
 */
export function FlexTransactionsPage({
  txns,
  onBack,
  onFlex,
  eligibleIds,
  flexedIds,
  cashbackByTxn,
  zIndex,
}: FlexTransactionsPageProps) {
  return (
    <FullScreenOverlay centerTitle="Transactions" onBack={onBack} zIndex={zIndex}>
      {groupTxnsByDay(txns).map((group, gi) => (
        <div key={group.day}>
          <div
            className={`text-base font-semibold mx-1 mb-2.5 ${gi === 0 ? 'mt-3.5' : 'mt-6'}`}
            style={{ color: COLORS.textPrimary }}
          >
            {group.day}
          </div>
          <Card radius={24} className="py-1.5">
            {group.items.map((txn) => (
              <FlexTxnRow
                key={txn.id}
                txn={txn}
                onFlex={onFlex}
                timeOnly
                eligibleIds={eligibleIds}
                flexedIds={flexedIds}
                cashbackByTxn={cashbackByTxn}
              />
            ))}
          </Card>
        </div>
      ))}
    </FullScreenOverlay>
  );
}
