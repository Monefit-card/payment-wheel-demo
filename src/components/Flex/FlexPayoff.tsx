'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import {
  ChooseMethodSheet,
  DEFAULT_METHOD_ID,
  MethodPill,
} from '@/components/PaymentMethods/ChooseMethodSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Sheet } from '@/components/ui/Sheet';
import { IconInfo } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { formatInstalmentDue, planPayoffQuote, planPrepayment, round2 } from '@/lib/flex-math';
import { formatEuro } from '@/lib/payment-math';
import { FlexPlan, Instalment } from '@/types/app';
import { PlanRow } from './PlanOverview';

interface FlexPayoffProps {
  plan: FlexPlan;
  onBack: () => void;
  onPay: (amount: number) => void;
}

/**
 * Repaying one plan — laid out as the instalment chooser is.
 *
 * The slider picks the payment, from €0 up to paying the plan off in full.
 * Below it, the schedule as it will stand, then the interest saved. Whatever the amount, it lands one way: principal first, spread
 * equally across every unpaid instalment, so the count and dates hold and
 * each instalment gets smaller. Accrued interest is only reached once the
 * principal is gone.
 */
export function FlexPayoff({ plan, onBack, onPay }: FlexPayoffProps) {
  // One clock for the screen, so the accrued interest can't tick between the
  // figure shown and the one paid.
  const [today] = useState(() => new Date());
  const quote = planPayoffQuote(plan, today);
  const max = Math.ceil(quote.total);

  const [value, setValue] = useState(0);
  const [savedInfoOpen, setSavedInfoOpen] = useState(false);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [methodId, setMethodId] = useState(DEFAULT_METHOD_ID);
  const payment = planPrepayment(plan, value >= max ? quote.total : value, today);

  return (
    <FullScreenOverlay
      centerTitle="Repayment"
      onBack={onBack}
      footer={
        <>
          <div className="flex justify-center mb-3">
            <MethodPill methodId={methodId} onClick={() => setMethodSheetOpen(true)} />
          </div>
          <PrimaryButton disabled={payment.amount <= 0} onClick={() => onPay(payment.amount)}>
            Pay
          </PrimaryButton>
          {/* Absolute to the overlay, so it covers the whole screen. */}
          <ChooseMethodSheet
            isOpen={methodSheetOpen}
            selectedId={methodId}
            onSelect={(id) => {
              setMethodId(id);
              setMethodSheetOpen(false);
            }}
            onClose={() => setMethodSheetOpen(false)}
          />
        </>
      }
    >
      <Card className="px-5 pt-6 pb-5 mt-3.5">
        <div className="text-center mb-[26px]">
          <div className="text-[13px] mb-1.5" style={{ color: COLORS.labelMuted }}>
            You pay
          </div>
          <div
            className="text-[38px] font-bold tracking-[-0.8px] tabular-nums"
            style={{ color: COLORS.textPrimary }}
          >
            {formatEuro(payment.amount)}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          aria-label="Amount to pay"
          onChange={(e) => setValue(Number(e.target.value))}
          className="term-slider w-full cursor-pointer"
          style={{ ['--fill' as string]: `${(value / Math.max(1, max)) * 100}%` }}
        />
      </Card>

      <div className="mt-2.5">
        <PayoffSchedule before={plan.instalments} after={payment.instalments} />
      </div>

      <Card className="px-4 mt-2.5">
        <DetailRow
          label={
            <button
              type="button"
              onClick={() => setSavedInfoOpen(true)}
              className="inline-flex items-center gap-1.5 cursor-pointer"
            >
              Interest saved
              <IconInfo size={14} color={COLORS.anchorIdle} />
            </button>
          }
          value={formatEuro(payment.saved)}
          last
        />
      </Card>

      <div
        className="text-xs text-center leading-[1.45] px-3 pt-4"
        style={{ color: COLORS.labelMuted }}
      >
        Your repayment lowers every remaining instalment by the same amount.
        Your payment dates stay the same.
      </div>

      <Sheet
        isOpen={savedInfoOpen}
        onClose={() => setSavedInfoOpen(false)}
        zIndex={58}
        title="Interest saved"
      >
        <div
          className="text-[13.5px] leading-[1.55] text-center px-1 mb-5"
          style={{ color: COLORS.labelMuted }}
        >
          Your payment goes to what you borrowed first, so every instalment
          left gets smaller and so does the interest charged on it. That
          interest is never charged. Interest already built up since your last
          statement still applies.
        </div>
        <PrimaryButton variant="light" onClick={() => setSavedInfoOpen(false)}>
          Got it
        </PrimaryButton>
      </Sheet>
    </FullScreenOverlay>
  );
}

/* ── Schedule ────────────────────────────────────────────────────────────── */

/** A new amount over the one it replaces, struck through. */
function Changed({ now, was }: { now: number; was: number }) {
  return (
    <div className="text-right tabular-nums">
      <div>{formatEuro(now)}</div>
      {now !== was && (
        <div
          className="text-[12.5px] font-normal line-through mt-[3px]"
          style={{ color: COLORS.labelMuted }}
        >
          {formatEuro(was)}
        </div>
      )}
    </div>
  );
}

/**
 * The schedule as it will stand, in `PlanOverview`'s structure: the instalments
 * before the final one collapse into one "Nx instalments" row (their total,
 * expandable), then the final instalment. New amounts sit over the old ones,
 * struck through once the payment moves them.
 */
function PayoffSchedule({ before, after }: { before: Instalment[]; after: Instalment[] }) {
  const [open, setOpen] = useState(false);

  const unpaid = before
    .map((instalment, i) => ({ was: instalment, now: after[i] }))
    .filter(({ was }) => was.state === 'due' || was.state === 'upcoming');
  if (unpaid.length === 0) return null;

  // A paid-off instalment keeps its scheduled amount on the record; what's
  // left to pay on it is nothing.
  const newAmount = (now: Instalment) => (now.state === 'paid' ? 0 : now.amount);
  const middle = unpaid.slice(0, -1);
  const final = unpaid[unpaid.length - 1];
  const middleNow = round2(middle.reduce((sum, i) => sum + newAmount(i.now), 0));
  const middleWas = round2(middle.reduce((sum, i) => sum + i.was.amount, 0));

  return (
    <Card className="px-4 py-[18px]">
      {middle.length > 0 &&
        (open ? (
          middle.map(({ was, now }, i) => (
            <PlanRow
              key={was.n}
              line
              title={`Instalment ${was.n}`}
              sub={`Due ${formatInstalmentDue(was.date)}`}
              amount={<Changed now={newAmount(now)} was={was.amount} />}
              onClick={() => setOpen(false)}
              chevron={i === 0 ? 'up' : undefined}
            />
          ))
        ) : (
          <PlanRow
            line
            title={`${middle.length}x instalment${middle.length > 1 ? 's' : ''}`}
            sub="Due by the 15th of following months"
            amount={<Changed now={middleNow} was={middleWas} />}
            onClick={() => setOpen(true)}
            chevron="down"
          />
        ))}
      <PlanRow
        title="Final instalment"
        sub={`Due ${formatInstalmentDue(final.was.date)}`}
        amount={<Changed now={newAmount(final.now)} was={final.was.amount} />}
      />
    </Card>
  );
}
