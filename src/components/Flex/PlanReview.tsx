'use client';

import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { COLORS } from '@/lib/constants';
import { calcPlan } from '@/lib/flex-math';
import { formatEuro } from '@/lib/payment-math';
import { Instalment, Txn } from '@/types/app';
import { AmortisationLink } from './AmortisationTable';
import { ScheduleItem } from './PlanOverview';
import { TxnCard } from './TxnCard';

interface PlanReviewProps {
  items: Txn[];
  total: number;
  n: number;
  instalments: Instalment[];
  onBack: () => void;
  onConfirm: () => void;
  onOpenAmortisation: () => void;
}

/**
 * Step 3 — the last look before the plan exists.
 *
 * (The prototype's Confirm on step 2 jumped straight to the success sheet,
 * leaving this screen unreachable. It's wired in properly here: picker →
 * chooser → review → success.)
 */
export function PlanReview({
  items,
  total,
  n,
  instalments,
  onBack,
  onConfirm,
  onOpenAmortisation,
}: PlanReviewProps) {
  const plan = calcPlan(total, n);
  const first = instalments[0];
  const final = instalments[instalments.length - 1];

  return (
    <FullScreenOverlay
      title="Review your instalment plan"
      onBack={onBack}
      footer={<PrimaryButton onClick={onConfirm}>Confirm plan</PrimaryButton>}
    >
      {items.map((item) => (
        <TxnCard key={item.id} txn={item} />
      ))}

      <div className="text-[13px] font-bold mx-1 mt-1 mb-2" style={{ color: COLORS.textPrimary }}>
        Instalment plan schedule
      </div>
      <Card className="p-4">
        <ScheduleItem
          color={COLORS.flex}
          title={`${formatEuro(plan.monthly)} · x${n - 1} months`}
          sub={first ? `First due ${first.date}` : 'Due with each monthly bill'}
          line
        />
        <ScheduleItem
          color="rgba(19,20,23,0.25)"
          title={`${formatEuro(plan.last)} · Last instalment`}
          sub={final ? `Due ${final.date}` : 'Due with the final monthly bill'}
        />
      </Card>

      <div className="text-[13px] font-bold mx-1 mt-5 mb-2" style={{ color: COLORS.textPrimary }}>
        Plan details
      </div>
      <Card className="px-4 mb-2.5">
        <DetailRow label="Amount to split" value={formatEuro(total)} />
        <DetailRow label="Total interest" value={formatEuro(plan.interest)} />
        <DetailRow label="Total to repay" value={formatEuro(plan.total)} />
        <DetailRow label="Interest rate" value="15%" />
        <DetailRow label="APR" value="15%" last />
      </Card>

      <AmortisationLink onClick={onOpenAmortisation} />

      <div
        className="text-xs text-center leading-[1.45] px-3 pt-4"
        style={{ color: COLORS.labelMuted }}
      >
        Monthly instalments will be included in your minimum monthly payment, so
        your minimum payment will increase.
      </div>
    </FullScreenOverlay>
  );
}
