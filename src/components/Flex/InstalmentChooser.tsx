'use client';

import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconInfo } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { calcPlan } from '@/lib/flex-math';
import { formatEuro } from '@/lib/payment-math';
import { Instalment, Txn } from '@/types/app';
import { PlanOverview } from './PlanOverview';
import { TxnCard } from './TxnCard';

export const MIN_INSTALMENTS = 3;
export const MAX_INSTALMENTS = 12;

interface InstalmentChooserProps {
  items: Txn[];
  /** Principal being split — the summed transaction amounts. */
  total: number;
  n: number;
  onChangeN: (n: number) => void;
  /** The live schedule for the current `n`. */
  instalments: Instalment[];
  onBack: () => void;
  /** Creates the plan — this is the last screen before it exists. */
  onConfirm: () => void;
}

/**
 * Step 2, and the last one — how many instalments, then confirm.
 *
 * The monthly repayment is the headline and updates live with the slider; the
 * cost of the choice (interest, total to repay) sits directly underneath it,
 * so a longer term never looks free. Everything needed to commit is already
 * here — the schedule, the cost and the minimum-payment warning — so there is
 * no separate review screen to restate it.
 */
export function InstalmentChooser({
  items,
  total,
  n,
  onChangeN,
  instalments,
  onBack,
  onConfirm,
}: InstalmentChooserProps) {
  const plan = calcPlan(total, n);

  return (
    <FullScreenOverlay
      centerTitle="Select number of instalments"
      onBack={onBack}
      footer={<PrimaryButton onClick={onConfirm}>Confirm plan</PrimaryButton>}
    >
      {items.length > 1 && (
        <div className="text-[13px] mx-1 mb-2.5" style={{ color: COLORS.labelMuted }}>
          {items.length} items selected
        </div>
      )}
      {items.map((item) => (
        <TxnCard key={item.id} txn={item} />
      ))}

      <Card className="px-5 pt-6 pb-5">
        <div className="text-center mb-[26px]">
          <div className="text-[13px] mb-1.5" style={{ color: COLORS.labelMuted }}>
            Monthly repayment
          </div>
          <div
            className="text-[38px] font-bold tracking-[-0.8px] tabular-nums"
            style={{ color: COLORS.textPrimary }}
          >
            {formatEuro(plan.monthly)}
          </div>
        </div>

        <input
          type="range"
          min={MIN_INSTALMENTS}
          max={MAX_INSTALMENTS}
          step={1}
          value={n}
          aria-label="Number of instalments"
          onChange={(e) => onChangeN(Number(e.target.value))}
          className="term-slider w-full cursor-pointer"
          style={{
            // Filled portion is painted from the value, so the track reads as
            // progress rather than a bare rail.
            ['--fill' as string]: `${
              ((n - MIN_INSTALMENTS) / (MAX_INSTALMENTS - MIN_INSTALMENTS)) * 100
            }%`,
          }}
        />

        <div className="flex items-baseline justify-between mt-3.5">
          <span className="text-sm" style={{ color: COLORS.labelMuted }}>
            Split in
          </span>
          <span className="text-[15px] font-bold" style={{ color: COLORS.textPrimary }}>
            {n} instalments
          </span>
        </div>
      </Card>

      <Card className="px-4 mt-2.5">
        <DetailRow label="Amount to split" value={formatEuro(total)} />
        <DetailRow label="Total interest" value={formatEuro(plan.interest)} />
        <DetailRow label="Total to repay" value={formatEuro(plan.total)} />
        <DetailRow
          label={
            <span className="inline-flex items-center gap-1.5">
              Interest rate
              <IconInfo size={14} color={COLORS.anchorIdle} />
            </span>
          }
          value="15%"
          last
        />
      </Card>

      <div className="mt-2.5">
        <PlanOverview instalments={instalments} />
      </div>

      {/* Load-bearing copy: creating a plan moves the purchase off this
          bill, and the instalment due this period comes back into the
          minimum. Saying so here is what stops the increase being a
          surprise on the wheel. */}
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
