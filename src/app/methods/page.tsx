'use client';

import { useMemo, useState } from 'react';
import { buildSchedule, calcPlan, payoffStops, round2, spreadPayment } from '@/lib/flex-math';
import { calculateMinimumPayment, formatEuro } from '@/lib/payment-math';
import { FlexPlan } from '@/types/app';

/**
 * Engineering reference — Flex repayments on two axes.
 *
 * ROW  where the money lands: inside the minimum payment (due instalments
 *      only) or outside it (future instalments only).
 * COL  how it lands: spread across instalments, or settling whole ones.
 *
 * Every figure comes from the functions the app calls — `spreadPayment` and
 * `payoffStops` — so the page can't show behaviour the build doesn't have.
 *
 * The bars are the explanation: grey is what was scheduled, colour is what it
 * is now. Spreading shortens bars; clearing removes them.
 */

const INK = '#131417';
const MUTED = '#6f6f74';
const FAINT = '#8e8e93';
const RULE = 'rgba(19,20,23,0.10)';
const GHOST = '#dcdce2';
const ACTIVE = '#3f34c9';
const DUE = '#fa9a2e';
const RED = '#a7121f';
const CREDIT = '#131417';

const BAR_H = 96;

interface Bar {
  key: string;
  label: string;
  /** Scheduled amount. */
  before: number;
  /** Amount after the payment; `null` when the instalment is cleared. */
  after: number | null;
  /** Due instalments are billed, so they read in the bill's colour. */
  due?: boolean;
  /** The credit half of the minimum. */
  credit?: boolean;
}

function Chart({ bars, max }: { bars: Bar[]; max: number }) {
  const h = (v: number) => Math.max(3, (v / max) * BAR_H);

  return (
    <div className="flex items-end gap-1.5">
      {bars.map((bar) => {
        const cleared = bar.after === null;
        return (
          <div key={bar.key} className="flex-1 flex flex-col items-center min-w-0">
            <div className="relative w-full" style={{ height: BAR_H }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-[4px]"
                style={{ height: h(bar.before), background: GHOST }}
              />
              {!cleared ? (
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-[4px]"
                  style={{
                    height: h(bar.after ?? bar.before),
                    background: bar.credit ? CREDIT : bar.due ? DUE : ACTIVE,
                    transition: 'height 0.18s ease',
                  }}
                />
              ) : (
                <div
                  className="absolute left-0 right-0"
                  style={{ bottom: h(bar.before) / 2, height: 2, background: RED }}
                />
              )}
            </div>
            <div className="text-[11px] mt-2 truncate w-full text-center" style={{ color: FAINT }}>
              {bar.label}
            </div>
            <div
              className="text-[10.5px] tabular-nums"
              style={{ color: cleared ? RED : MUTED }}
            >
              {cleared ? 'paid' : formatEuro(bar.after ?? bar.before).replace('€', '')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({
  title,
  lead,
  control,
  bars,
  max,
  figures,
  note,
}: {
  title?: string;
  lead?: string;
  control: React.ReactNode;
  bars: Bar[];
  max: number;
  figures: { label: string; value: string; tone?: 'positive' }[];
  note: string;
}) {
  return (
    <div
      className="rounded-2xl px-5 py-4 flex-1 min-w-0"
      style={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
    >
      {title && (
        <h3 className="text-[17px] font-bold tracking-[-0.2px]" style={{ color: INK }}>
          {title}
        </h3>
      )}
      {lead && (
        <p className="text-[13px] leading-[1.45] mt-1 mb-4" style={{ color: MUTED }}>
          {lead}
        </p>
      )}
      {control}
      <Chart bars={bars} max={max} />
      <div className="flex mt-4" style={{ borderTop: `1px solid ${RULE}` }}>
        {figures.map((f) => (
          <div key={f.label} className="flex-1 pt-3">
            <div className="text-[11.5px]" style={{ color: FAINT }}>
              {f.label}
            </div>
            <div
              className="text-[17px] font-bold tabular-nums mt-0.5"
              style={{ color: f.tone === 'positive' ? '#0E7A38' : INK }}
            >
              {f.value}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[12px] leading-[1.45] mt-3" style={{ color: FAINT }}>
        {note}
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12.5px]" style={{ color: MUTED }}>
          {label}
        </span>
        <span className="text-[14px] font-bold tabular-nums" style={{ color: INK }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="term-slider w-full cursor-pointer mb-5"
        style={{ ['--fill' as string]: `${((value - min) / Math.max(1, max - min)) * 100}%` }}
      />
    </>
  );
}

function RowHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mt-9 mb-3">
      <div className="text-[17px] font-bold tracking-[-0.2px]" style={{ color: INK }}>
        {title}
      </div>
      <div className="text-[13.5px] mt-0.5" style={{ color: MUTED }}>
        {sub}
      </div>
    </div>
  );
}

/** Three plans, so the minimum's Flex portion has more than one due instalment. */
function makePlan(id: string, merchant: string, amount: number, n: number): FlexPlan {
  const start = new Date(2026, 2, 1);
  const calc = calcPlan(amount, n);
  return {
    id,
    items: [{ id: `${id}-txn`, merchant, day: 'Today', sub: 'Today', amount, icon: 'apple' }],
    n,
    created: 'Today',
    amount,
    monthly: calc.monthly,
    last: calc.last,
    interest: calc.interest,
    total: calc.total,
    instalments: buildSchedule(amount, n, start, start),
  };
}

export default function RepaymentMethodsPage() {
  const plans = useMemo(
    () => [
      makePlan('a', 'Apple', 600, 9),
      makePlan('b', 'Hugo', 240, 6),
      makePlan('c', 'Kaup24', 390, 12),
    ],
    [],
  );

  /* ── Inside the minimum: credit portion first, then the due instalments ── */

  /** The credit half of the minimum — 5% of the card bill, on a €700 balance. */
  const creditPortion = calculateMinimumPayment(700, 0);

  const dues = plans.map((plan) => ({
    plan,
    amount: plan.instalments.find((i) => i.state === 'due')?.amount ?? 0,
  }));
  const flexPortion = round2(dues.reduce((sum, d) => sum + d.amount, 0));
  const minimum = round2(creditPortion + flexPortion);
  const barMax = Math.max(creditPortion, ...dues.map((d) => d.amount));

  const [paidRaw, setPaid] = useState(() => Math.round(minimum * 0.55));
  const paid = Math.min(paidRaw, minimum);

  /** Credit principal is satisfied before anything reaches Flex. */
  const toCredit = round2(Math.min(paid, creditPortion));
  const toFlex = round2(Math.max(0, paid - creditPortion));
  /**
   * Proportional, not equal chunks. Reducing each due instalment by the same
   * euro amount would zero the smallest one first and leave the remainder with
   * nowhere to go; taking the same *share* off each means they all reach zero
   * together, exactly when the Flex portion is covered.
   */
  const clearedShare = flexPortion > 0 ? toFlex / flexPortion : 0;
  const shortfall = round2(Math.max(0, minimum - paid));

  const insideSpreadBars: Bar[] = [
    {
      key: 'credit',
      label: 'Credit',
      before: creditPortion,
      after: round2(creditPortion - toCredit),
      credit: true,
    },
    ...dues.map((d) => ({
      key: d.plan.id,
      label: d.plan.items[0]?.merchant ?? d.plan.id,
      before: d.amount,
      after: round2(d.amount * (1 - clearedShare)),
      due: true,
    })),
  ];

  /* ── Outside the minimum: one plan's future instalments ──────────────── */

  const plan = plans[0];
  const months = plan.instalments.map((i) => i.date.split(' ')[1]);
  const futureMax = Math.max(...plan.instalments.map((i) => i.amount));
  const lastIndex = plan.instalments.length - 1;

  const spreadable = spreadPayment(plan, 0).principalBefore;
  const [paymentRaw, setPayment] = useState(() => Math.round(spreadable * 0.35));
  const payment = Math.min(paymentRaw, spreadable);
  const spread = spreadPayment(plan, payment);

  const outsideSpreadBars: Bar[] = plan.instalments.map((instalment, i) => ({
    key: String(instalment.n),
    label: months[i],
    before: instalment.amount,
    due: instalment.state === 'due',
    after:
      instalment.state !== 'upcoming'
        ? instalment.amount
        : spread.principalAfter <= 0
          ? 0
          : i === lastIndex
            ? calcPlan(spread.principalAfter, spread.instalments).last
            : spread.monthlyAfter,
  }));

  const flexStops = payoffStops(plan);
  const [count, setCount] = useState(3);
  const stop = flexStops.find((s) => s.count === count) ?? flexStops[0];
  const clearedIds = new Set(
    plan.instalments
      .filter((i) => i.state === 'due' || i.state === 'upcoming')
      .slice(0, count)
      .map((i) => i.n),
  );
  const outsideClearBars: Bar[] = plan.instalments.map((instalment, i) => ({
    key: String(instalment.n),
    label: months[i],
    before: instalment.amount,
    due: instalment.state === 'due',
    after: clearedIds.has(instalment.n) ? null : instalment.amount,
  }));

  return (
    <main className="min-h-dvh px-6 py-14" style={{ background: '#f2f2f4' }}>
      <div className="mx-auto" style={{ maxWidth: 1160 }}>
        <div
          className="text-[12px] font-semibold uppercase tracking-[0.09em]"
          style={{ color: FAINT }}
        >
          Monefit card · engineering reference
        </div>
        <h1
          className="text-[34px] font-bold tracking-[-0.8px] leading-[1.15] mt-1.5"
          style={{ color: INK }}
        >
          How Flex repayments land
        </h1>
        <p className="text-[16px] leading-[1.5] mt-2" style={{ color: MUTED }}>
          Two axes. Where the money sits decides <em>which</em>{' '}
          instalments it touches; how it&apos;s paid decides <em>what</em>{' '}
          happens to them.
          Grey is the scheduled amount, colour is what it is now.
        </p>

        <RowHeading
          title="Main payment wheel"
          sub="One methodology only: money is spread. It is never applied to a single instalment, so nothing here is ever settled outright."
        />

        <RowHeading
          title="1 · Due instalments (inside the minimum payment)"
          sub={`The minimum is ${formatEuro(creditPortion)} of credit plus ${formatEuro(flexPortion)} of due instalments, one per active plan. Credit is satisfied first; whatever is left over comes off every due instalment in the same proportion, so they all reach zero together.`}
        />

        <div className="flex gap-4 flex-col lg:flex-row">
          <Panel
            control={
              <Slider
                label="Paid toward the minimum"
                value={paidRaw}
                display={`${formatEuro(paid)} of ${formatEuro(minimum)}`}
                min={0}
                max={Math.ceil(minimum)}
                onChange={setPaid}
              />
            }
            bars={insideSpreadBars}
            max={barMax}
            figures={[
              { label: 'Reaches Flex', value: formatEuro(toFlex) },
              {
                label: 'Plans converting',
                value: shortfall > 0 ? `${dues.length} of ${dues.length}` : '0',
                tone: shortfall > 0 ? undefined : 'positive',
              },
            ]}
            note={
              shortfall > 0
                ? `${formatEuro(shortfall)} short. Every due instalment is still part-paid, so on this shortfall all ${dues.length} plans convert to Credit.`
                : 'Minimum met — no instalment is left unpaid, so nothing converts.'
            }
          />

        </div>

        <RowHeading
          title="2 · Future instalments (inside the total payment)"
          sub="Above the minimum, the payment comes off principal and the remaining instalments are re-amortised over the same count at the same rate — they all get smaller. This period's instalment is already billed, so it never moves."
        />

        <div className="flex gap-4 flex-col lg:flex-row">
          <Panel
            control={
              <Slider
                label="Payment"
                value={paymentRaw}
                display={formatEuro(payment)}
                min={0}
                max={Math.ceil(spreadable)}
                onChange={setPayment}
              />
            }
            bars={outsideSpreadBars}
            max={futureMax}
            figures={[
              {
                label: 'Instalment',
                value: `${formatEuro(spread.monthlyBefore)} → ${formatEuro(spread.monthlyAfter)}`,
              },
              { label: 'Interest saved', value: formatEuro(spread.saved), tone: 'positive' },
            ]}
            note="Term, count and rate unchanged — only the amounts move."
          />

        </div>

        <RowHeading
          title="Flex payment wheel"
          sub="One methodology only: whole instalments, on one plan at a time. Exists per individual Flex for now."
        />

        <div className="flex gap-4 flex-col lg:flex-row">
          <Panel
            title="One plan, whole instalments"
            lead="Settled next-first — the billed one included. Nothing falls due for the months cleared, and the instalment amount never changes."
            control={
              <Slider
                label="Instalments cleared"
                value={count}
                display={`${count} of ${flexStops.length}`}
                min={1}
                max={flexStops.length}
                onChange={setCount}
              />
            }
            bars={outsideClearBars}
            max={futureMax}
            figures={[
              { label: 'You pay', value: formatEuro(stop?.amount ?? 0) },
              { label: 'Interest saved', value: formatEuro(stop?.saved ?? 0), tone: 'positive' },
            ]}
            note="The billed instalment costs its full amount; upcoming ones cost principal only, so their unearned interest is forgiven. Clearing the billed one takes it out of the minimum, which is what keeps the plan out of a conversion."
          />
        </div>

        <div
          className="rounded-2xl px-6 py-5 mt-9"
          style={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          <div
            className="text-[11.5px] font-semibold uppercase tracking-[0.09em]"
            style={{ color: RED }}
          >
            If the minimum isn’t paid in full
          </div>
          <p className="text-[15px] leading-[1.6] mt-2" style={{ color: INK }}>
            Every unpaid Flex instalment converts to Credit at the credit
            line’s higher rate, backdated over the period elapsed. Spreading
            protects nothing: it takes the same amount off every due instalment
            rather than settling any, so a shortfall leaves all of them unpaid
            and <strong>every plan converts</strong>. Clearing one plan’s due
            instalment in Flex — the top-right box — is the only way to protect
            it.
          </p>
        </div>

        <div className="text-[13px] mt-7" style={{ color: FAINT }}>
          Source: src/lib/flex-math.ts — spreadPayment(), payoffStops()
        </div>
      </div>
    </main>
  );
}
