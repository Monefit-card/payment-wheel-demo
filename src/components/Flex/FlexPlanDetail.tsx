'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { FullScreenOverlay, NAV_BUTTON_STYLE } from '@/components/ui/FullScreenOverlay';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Sheet } from '@/components/ui/Sheet';
import { IconHelp } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { flexRemainingTotal, flexSettlementQuote, planCloseEligibility } from '@/lib/flex-math';
import { openIntercom } from '@/lib/intercom';
import { formatEuro } from '@/lib/payment-math';
import { FlexPlan } from '@/types/app';
import { PlanOverview } from './PlanOverview';
import { TxnCard } from './TxnCard';

interface FlexPlanDetailProps {
  plan: FlexPlan;
  /** True once the account is frozen for a missed minimum. */
  accountBlocked: boolean;
  /** True when this period's minimum has been paid. */
  minimumPaid: boolean;
  onBack: () => void;
  /** Opens the payoff wheel for this plan. */
  onPayoff: () => void;
  /** Converts the plan's remaining balance back to Credit. */
  onClosePlan: (id: string) => void;
}

/** One running plan — its schedule, what it cost, and the two ways to end it. */
export function FlexPlanDetail({
  plan,
  accountBlocked,
  minimumPaid,
  onBack,
  onPayoff,
  onClosePlan,
}: FlexPlanDetailProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const remaining = flexRemainingTotal([plan]);
  const settlement = flexSettlementQuote([plan]);
  const eligibility = planCloseEligibility(plan, { accountBlocked, minimumPaid });

  return (
    <FullScreenOverlay
      centerTitle="Flex"
      onBack={onBack}
      right={
        <button
          // Straight into the support messenger. `openIntercom` reports false
          // when the widget isn't configured, and the sheet below stands in.
          onClick={() => {
            if (!openIntercom()) setHelpOpen(true);
          }}
          aria-label="Get help"
          className="w-[46px] h-[46px] rounded-[18px] flex items-center justify-center cursor-pointer"
          style={NAV_BUTTON_STYLE}
        >
          <IconHelp size={20} />
        </button>
      }
      footer={
        <>
          <PrimaryButton onClick={onPayoff}>Pay off instalments</PrimaryButton>
          <div className="h-2.5" />
          <PrimaryButton variant="light" onClick={() => setCloseOpen(true)}>
            Close Flex
          </PrimaryButton>
        </>
      }
    >
      <div className="mt-3.5">
        <PlanOverview instalments={plan.instalments} firstLabel="Next instalment" />
      </div>

      <div className="mt-3.5">
        {plan.items.map((item) => (
          <TxnCard key={item.id} txn={item} />
        ))}
      </div>

      <Card className="px-4">
        <DetailRow label="Amount to split" value={formatEuro(plan.amount)} />
        <DetailRow label="Total interest" value={formatEuro(plan.interest)} />
        <DetailRow label="Total to repay" value={formatEuro(plan.total)} />
        <DetailRow label="APR" value="15%" last />
      </Card>

      <div
        className="text-xs text-center leading-[1.45] px-3 pt-4"
        style={{ color: COLORS.labelMuted }}
      >
        Monthly instalments are included in your minimum monthly payment, so
        your minimum payment will increase.
      </div>

      {/* Stand-in for the messenger, so the help control still does something
          on a build with no Intercom app id — the demo included. */}
      <Sheet isOpen={helpOpen} onClose={() => setHelpOpen(false)} zIndex={58} title="Help">
        <div
          className="text-[13.5px] leading-[1.55] text-center px-1 mb-5"
          style={{ color: COLORS.labelMuted }}
        >
          Support chat opens here. Set NEXT_PUBLIC_INTERCOM_APP_ID and this
          control goes straight to the Intercom messenger instead.
        </div>
        <PrimaryButton variant="light" onClick={() => setHelpOpen(false)}>
          Close
        </PrimaryButton>
      </Sheet>

      {/* Closing converts the plan back to Credit, so it's a rate decision as
          much as a cancellation — the sheet leads with that trade. */}
      <Sheet
        isOpen={closeOpen}
        onClose={() => setCloseOpen(false)}
        zIndex={58}
        title={eligibility.allowed ? 'Close this Flex plan?' : 'You can’t close this plan yet'}
      >
        <div
          className="text-[13.5px] leading-[1.55] text-center px-1 mb-5"
          style={{ color: COLORS.labelMuted }}
        >
          {eligibility.allowed
            ? `The ${formatEuro(remaining)} left on this plan moves back onto your credit bill. Your minimum payment drops, but the balance starts charging card interest instead of the plan's 15% — so it costs more the longer you carry it. Settling instead would cost ${formatEuro(settlement.principal)} today.`
            : eligibility.reason}
        </div>

        {eligibility.allowed ? (
          <>
            <PrimaryButton
              onClick={() => {
                setCloseOpen(false);
                onClosePlan(plan.id);
              }}
            >
              Close plan
            </PrimaryButton>
            <div className="h-2.5" />
            <PrimaryButton variant="light" onClick={() => setCloseOpen(false)}>
              Keep plan
            </PrimaryButton>
          </>
        ) : (
          <>
            <PrimaryButton
              onClick={() => {
                setCloseOpen(false);
                onPayoff();
              }}
            >
              Pay off instalments
            </PrimaryButton>
            <div className="h-2.5" />
            <PrimaryButton variant="light" onClick={() => setCloseOpen(false)}>
              Keep plan
            </PrimaryButton>
          </>
        )}
      </Sheet>
    </FullScreenOverlay>
  );
}
