'use client';

import { Card } from '@/components/ui/Card';
import { MerchantLogo } from '@/components/ui/MerchantLogo';
import { COLORS } from '@/lib/constants';
import { Txn } from '@/types/app';
import { txnAmount } from './format';

interface TxnCardProps {
  txn: Txn;
}

/**
 * A single flexed/selected transaction, shown as its own card. Used wherever
 * the flow is confirming *what* is being split — the instalment chooser, the
 * review step, and a plan's detail screen.
 */
export function TxnCard({ txn }: TxnCardProps) {
  return (
    <Card className="flex items-center gap-[13px] px-4 py-3.5 mb-3.5">
      <MerchantLogo icon={txn.icon} size={40} radius={12} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold" style={{ color: COLORS.textPrimary }}>
          {txn.merchant}
        </div>
        <div className="text-xs mt-px" style={{ color: COLORS.labelMuted }}>
          {txn.sub}
        </div>
      </div>
      <div className="text-[15px] font-semibold" style={{ color: COLORS.textPrimary }}>
        {txnAmount(txn)}
      </div>
    </Card>
  );
}
