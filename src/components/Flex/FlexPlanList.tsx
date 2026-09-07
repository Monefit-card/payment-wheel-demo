'use client';

import { Card } from '@/components/ui/Card';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { IconPlus } from '@/components/ui/icons';
import { MerchantLogo } from '@/components/ui/MerchantLogo';
import { COLORS } from '@/lib/constants';
import {
  flexDueTotal,
  flexRemainingTotal,
  formatPlanDateShort,
  nextInstalment,
  planLabel,
  planPrimary,
} from '@/lib/flex-math';
import { formatEuro } from '@/lib/payment-math';
import { FlexPlan, Txn } from '@/types/app';

interface FlexPlanListProps {
  /** Eligible purchases not yet on a plan — the "available to flex" stack. */
  eligibleTxns: Txn[];
  /** Active plans — still repaying. */
  plans: FlexPlan[];
  /** Settled and cancelled plans; each carries an `outcome`. */
  history: FlexPlan[];
  onOpenPlan: (id: string) => void;
  /** Switches the flow over to the create path. */
  onNew: () => void;
  onBack: () => void;
}

/** The Flex home — active plans, and what happened to the finished ones. */
export function FlexPlanList({
  plans,
  history,
  eligibleTxns,
  onOpenPlan,
  onNew,
  onBack,
}: FlexPlanListProps) {
  const due = flexDueTotal(plans);
  const total = flexRemainingTotal(plans);
  // Every plan bills on the 15th, so any due instalment carries the date.
  const dueDate = plans.map(nextInstalment).find(Boolean)?.date;

  return (
    <FullScreenOverlay centerTitle="Flex instalments" onBack={onBack}>
      {/* What Flex costs this period, and in total. Two figures because the
          first is inside the minimum payment and the second isn't. */}
      {plans.length > 0 && (
        <Card className="px-5 py-2 mt-3.5">
          <SummaryRow
            label={dueDate ? `Due on ${formatPlanDateShort(dueDate)}` : 'Due this period'}
            value={formatEuro(due)}
          />
          <SummaryRow label="Total" value={formatEuro(total)} last />
        </Card>
      )}

      {/* Entry to the create path, with a peek at what's eligible. */}
      {eligibleTxns.length > 0 && (
        <Card className="flex items-center gap-3 px-5 py-4 mt-3.5">
          <div className="flex-1 min-w-0">
            <div
              className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-2.5"
              style={{ color: COLORS.labelMuted }}
            >
              Available to flex
            </div>
            <LogoStack txns={eligibleTxns} />
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 h-[52px] px-[18px] rounded-[16px] text-[15px] font-semibold cursor-pointer shrink-0"
            style={{ background: COLORS.screenSunken, color: COLORS.textPrimary }}
          >
            <IconPlus size={13} color={COLORS.textPrimary} /> Flex
          </button>
        </Card>
      )}

      <div className="text-base font-semibold mx-1 mt-3.5 mb-2.5" style={{ color: COLORS.textPrimary }}>
        Active
      </div>

      {plans.length > 0 ? (
        <Card className="py-1.5">
          {plans.map((plan) => {
            const primary = planPrimary(plan);
            return (
              <button
                key={plan.id}
                onClick={() => onOpenPlan(plan.id)}
                className="w-full flex items-center gap-[13px] text-left px-4 py-[13px] cursor-pointer"
              >
                {primary && <MerchantLogo icon={primary.icon} />}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[15.5px] font-semibold truncate"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {planLabel(plan)}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: COLORS.labelMuted }}>
                    {plan.created}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="text-[15.5px] font-semibold tabular-nums"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {formatEuro(plan.monthly)}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: COLORS.labelMuted }}>
                    {formatEuro(flexRemainingTotal([plan]))} left to pay
                  </div>
                </div>
              </button>
            );
          })}
        </Card>
      ) : (
        <Card className="px-4 py-7 text-center text-[13px]" style={{ color: COLORS.labelMuted }}>
          No active plans
        </Card>
      )}

      <div className="text-base font-semibold mx-1 mt-6 mb-2.5" style={{ color: COLORS.textPrimary }}>
        Past
      </div>

      {history.length > 0 ? (
        <Card className="py-1.5">
          {history.map((plan) => (
            <PastPlanRow key={plan.id} plan={plan} />
          ))}
        </Card>
      ) : (
        <Card className="px-4 py-7 text-center text-[13px]" style={{ color: COLORS.labelMuted }}>
          No past plans
        </Card>
      )}
    </FullScreenOverlay>
  );
}

/** One row of the summary card — larger than a DetailRow, no bold label. */
function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-[15px]"
      style={{ borderBottom: last ? 'none' : `0.5px solid ${COLORS.divider}` }}
    >
      <span className="inline-flex items-center gap-1.5 text-[15.5px]" style={{ color: COLORS.textPrimary }}>
        {label}
        <IconInfoDot />
      </span>
      <span className="text-[16px] font-semibold tabular-nums" style={{ color: COLORS.textPrimary }}>
        {value}
      </span>
    </div>
  );
}

/** Grey filled info dot, matching the summary rows in the design. */
function IconInfoDot() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="7.5" fill={COLORS.anchorIdle} />
      <circle cx="7.5" cy="4.3" r="0.95" fill={COLORS.surface} />
      <path d="M7.5 6.6v4.4" stroke={COLORS.surface} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Overlapping merchant tiles, with a +N chip once the row runs out of room. */
function LogoStack({ txns }: { txns: Txn[] }) {
  const shown = txns.slice(0, 3);
  const extra = txns.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((txn, i) => (
        <div key={txn.id} style={{ marginLeft: i === 0 ? 0 : -12, zIndex: shown.length - i }}>
          <MerchantLogo icon={txn.icon} size={38} radius={11} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center text-[13px] font-semibold shrink-0"
          style={{
            marginLeft: -12,
            width: 38,
            height: 38,
            borderRadius: 11,
            background: COLORS.screenSunken,
            color: COLORS.labelStrong,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/**
 * A finished plan. Cancelled and repaid plans are deliberately not the same
 * row: a cancellation pushed its remaining balance back onto the credit bill,
 * which is worth seeing rather than filing under "done".
 */
function PastPlanRow({ plan }: { plan: FlexPlan }) {
  const primary = planPrimary(plan);
  const cancelled = plan.outcome === 'cancelled';
  const when = cancelled ? plan.cancelledOn : plan.paidOff;

  return (
    <div className="flex items-center gap-[13px] px-4 py-[13px]">
      {primary && <MerchantLogo icon={primary.icon} className={cancelled ? 'opacity-60' : ''} />}
      <div className="flex-1 min-w-0">
        <div className="text-[15.5px] font-semibold truncate" style={{ color: COLORS.textPrimary }}>
          {planLabel(plan)}
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: COLORS.labelMuted }}>
          {when ?? plan.created}
        </div>
      </div>
      <div className="text-right shrink-0">
        {cancelled ? (
          <>
            <div className="text-[13px]" style={{ color: COLORS.labelMuted }}>
              Cancelled
            </div>
            <div
              className="text-[15.5px] font-semibold tabular-nums line-through mt-0.5"
              style={{ color: COLORS.textPrimary }}
            >
              {formatEuro(plan.total)}
            </div>
          </>
        ) : (
          <>
            <div
              className="text-[15.5px] font-semibold tabular-nums"
              style={{ color: COLORS.textPrimary }}
            >
              {formatEuro(plan.total)}
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: COLORS.labelMuted }}>
              Paid
            </div>
          </>
        )}
      </div>
    </div>
  );
}
