'use client';

import { useMemo, useState } from 'react';
import {
  amortisationRows,
  buildSchedule,
  calcPlan,
  planLabel,
  planPrepayment,
  planPayoffQuote,
  round2,
  spreadAcrossPlans,
} from '@/lib/flex-math';
import { calculateMinimumPayment, formatEuro } from '@/lib/payment-math';
import { FlexPlan } from '@/types/app';

/**
 * Engineering reference — where a Flex repayment lands.
 *
 * Inside the minimum, every part is paid down in the same proportion. Outside
 * it — above the card balance on the main wheel, or on one plan from Flex —
 * money goes to principal first, spread across every upcoming instalment.
 *
 * Every figure comes from the functions the app calls — `spreadAcrossPlans`
 * and `planPrepayment` — so the page can't show behaviour the build doesn't
 * have.
 *
 * The bars are the explanation: grey is what was scheduled, colour is what it
 * is now. Paying shortens bars; a bar is only removed once its plan's
 * principal is gone.
 */

const INK = '#131417';
const MUTED = '#6f6f74';
const FAINT = '#8e8e93';
const RULE = 'rgba(19,20,23,0.10)';
const GHOST = '#dcdce2';
const ACTIVE = '#3f34c9';
const DUE = '#fa9a2e';
/** The interest slice of a due instalment — paid after its principal. */
const DUE_INTEREST = '#fdd09a';
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
  /**
   * The part of `after` that is interest, drawn under the principal. Principal
   * sits on top because it is paid first, so the bar drains from the top.
   */
  afterInterest?: number;
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
                <>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-[4px]"
                    style={{
                      height: h(bar.after ?? bar.before),
                      background: bar.credit ? CREDIT : bar.due ? DUE : ACTIVE,
                      transition: 'height 0.18s ease',
                    }}
                  />
                  {bar.afterInterest !== undefined && bar.afterInterest > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-[4px]"
                      style={{
                        height: Math.min(
                          h(bar.after ?? bar.before),
                          (bar.afterInterest / max) * BAR_H,
                        ),
                        background: DUE_INTEREST,
                        transition: 'height 0.18s ease',
                      }}
                    />
                  )}
                </>
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
      <Figures figures={figures} />
      <p className="text-[12px] leading-[1.45] mt-3" style={{ color: FAINT }}>
        {note}
      </p>
    </div>
  );
}

function Figures({
  figures,
}: {
  figures: { label: string; value: string; tone?: 'positive' }[];
}) {
  return (
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
  );
}

/** One plan's instalments inside the multi-plan spread panel. */
function PlanColumn({
  label,
  sub,
  bars,
  max,
  foot,
}: {
  label: string;
  sub: string;
  bars: Bar[];
  max: number;
  foot: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="text-[13px] font-semibold truncate" style={{ color: INK }}>
          {label}
        </span>
        <span className="text-[11px] whitespace-nowrap" style={{ color: FAINT }}>
          {sub}
        </span>
      </div>
      <Chart bars={bars} max={max} />
      <div className="text-[11.5px] leading-[1.45] mt-2.5 tabular-nums" style={{ color: MUTED }}>
        {foot}
      </div>
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

  /* ── Inside the minimum: every part paid down together ─────────────── */

  /** The credit part of the minimum — 5% of the card bill, on a €700 balance. */
  const creditPortion = calculateMinimumPayment(700, 0);

  /** Each plan's due instalment, split into the principal and interest it carries. */
  const dues = plans.map((plan) => {
    const instalment = plan.instalments.find((i) => i.state === 'due');
    const row = instalment
      ? amortisationRows(plan.amount, plan.n)[instalment.n - 1]
      : undefined;
    return {
      plan,
      amount: instalment?.amount ?? 0,
      principal: row?.principal ?? 0,
      interest: row?.interest ?? 0,
    };
  });
  const flexPortion = round2(dues.reduce((sum, d) => sum + d.amount, 0));
  const minimum = round2(creditPortion + flexPortion);
  const barMax = Math.max(creditPortion, ...dues.map((d) => d.amount));

  const [paidRaw, setPaid] = useState(() => Math.round(minimum * 0.55));
  const paid = Math.min(paidRaw, minimum);

  /**
   * One share for every part of the minimum. Credit first, or equal euro
   * chunks, would clear some parts before others; taking the same share off
   * each means they all reach zero together, exactly when the minimum is met.
   */
  const share = minimum > 0 ? paid / minimum : 0;
  const toCredit = round2(creditPortion * share);
  const toFlex = round2(paid - toCredit);
  const shortfall = round2(Math.max(0, minimum - paid));

  /** Within an instalment, its share clears principal before interest. */
  const dueBar = (d: (typeof dues)[number]): Bar => {
    const onIt = d.amount * share;
    const principalLeft = Math.max(0, d.principal - onIt);
    const interestLeft = Math.max(0, d.interest - Math.max(0, onIt - d.principal));
    return {
      key: d.plan.id,
      label: d.plan.items[0]?.merchant ?? d.plan.id,
      before: d.amount,
      after: round2(principalLeft + interestLeft),
      afterInterest: round2(interestLeft),
      due: true,
    };
  };

  const insideSpreadBars: Bar[] = [
    {
      key: 'credit',
      label: 'Card',
      before: creditPortion,
      after: round2(creditPortion - toCredit),
      credit: true,
    },
    ...dues.map(dueBar),
  ];

  /* ── Above the card balance: every plan's future instalments ─────────── */

  /** Instalment principal outstanding across all three plans. */
  const spreadable = spreadAcrossPlans(plans, 0).principalBefore;
  const [paymentRaw, setPayment] = useState(() => Math.round(spreadable * 0.35));
  const payment = Math.min(paymentRaw, spreadable);
  const spread = spreadAcrossPlans(plans, payment);

  /** One scale for every plan, so a bar's height means the same thing across them. */
  const futureMax = Math.max(
    ...plans.flatMap((p) => p.instalments.map((i) => i.amount)),
  );

  /**
   * A plan's instalments under the spread. The due one is already billed, so
   * it holds; the upcoming ones are redrawn from the re-amortised schedule,
   * and go to 'paid' only when the plan's whole remaining principal is prepaid.
   */
  const planBars = (plan: FlexPlan): Bar[] => {
    const entry = spread.perPlan.find((e) => e.id === plan.id);
    const upcoming = plan.instalments.filter((i) => i.state === 'upcoming').length;
    const left = entry?.outcome.principalAfter ?? 0;
    const after = left > 0 ? calcPlan(left, upcoming) : null;
    let seen = 0;

    return plan.instalments.map((instalment) => {
      const month = instalment.date.split(' ')[1];
      if (instalment.state !== 'upcoming') {
        return {
          key: String(instalment.n),
          label: month,
          before: instalment.amount,
          after: instalment.amount,
          due: instalment.state === 'due',
        };
      }
      seen += 1;
      return {
        key: String(instalment.n),
        label: month,
        before: instalment.amount,
        after: after ? (seen === upcoming ? after.last : after.monthly) : null,
      };
    });
  };

  /* ── One plan's early payoff, from Flex ──────────────────────────────── */

  const plan = plans[0];
  const months = plan.instalments.map((i) => i.date.split(' ')[1]);
  const planMax = Math.max(...plan.instalments.map((i) => i.amount));

  const payoff = planPayoffQuote(plan);
  const payoffMax = Math.ceil(payoff.total);
  const [payoffRaw, setPayoffRaw] = useState(() => Math.round(payoff.total * 0.5));
  const prepay = planPrepayment(plan, payoffRaw >= payoffMax ? payoff.total : payoffRaw);
  const payoffBars: Bar[] = plan.instalments.map((instalment, i) => {
    const after = prepay.instalments[i];
    return {
      key: String(instalment.n),
      label: months[i],
      before: instalment.amount,
      due: instalment.state === 'due',
      after: after.state === 'paid' && instalment.state !== 'paid' ? null : after.amount,
    };
  });

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
          sub={`The minimum is ${formatEuro(creditPortion)} of card minimum plus ${formatEuro(flexPortion)} of due instalments, one per active plan. A payment comes off every part in the same proportion, so they all reach zero together. Within each instalment, principal is paid first and interest second.`}
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
              { label: 'To the card', value: formatEuro(toCredit) },
              { label: 'To Flex', value: formatEuro(toFlex) },
              {
                label: 'Plans converting',
                value: shortfall > 0 ? `${dues.length} of ${dues.length}` : '0',
                tone: shortfall > 0 ? undefined : 'positive',
              },
            ]}
            note={
              shortfall > 0
                ? `${formatEuro(shortfall)} short. Every part of the minimum is still part-paid, so on this shortfall all ${dues.length} plans convert to Credit. Light orange is instalment interest, left until its principal is paid.`
                : 'Minimum met — no instalment is left unpaid, so nothing converts.'
            }
          />

        </div>

        <RowHeading
          title="2 · Future instalments (inside the total payment)"
          sub={`Above the card balance sits ${formatEuro(spreadable)} of instalment principal across ${plans.length} plans. A payment is split between them in proportion to what each has left, then each plan re-amortises its share over its own remaining instalments. The instalment already on this period's bill never moves — it belongs to the minimum.`}
        />

        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          <h3 className="text-[17px] font-bold tracking-[-0.2px]" style={{ color: INK }}>
            Paying above the card balance — main wheel
          </h3>
          <p className="text-[13px] leading-[1.45] mt-1 mb-4" style={{ color: MUTED }}>
            Same rate, same dates, same number of payments. Every remaining
            instalment on every plan simply gets smaller — none is settled, so a
            plan only ends early once its whole remaining principal is prepaid.
          </p>

          <Slider
            label="Payment above the card balance"
            value={paymentRaw}
            display={`${formatEuro(payment)} of ${formatEuro(spreadable)}`}
            min={0}
            max={Math.ceil(spreadable)}
            onChange={setPayment}
          />

          <div className="flex gap-7 flex-col lg:flex-row">
            {plans.map((p) => {
              const entry = spread.perPlan.find((e) => e.id === p.id);
              const left = p.instalments.filter((i) => i.state === 'upcoming').length;
              const monthlyAfter = entry?.outcome.monthlyAfter ?? p.monthly;
              return (
                <PlanColumn
                  key={p.id}
                  label={planLabel(p)}
                  sub={`${left} to come`}
                  bars={planBars(p)}
                  max={futureMax}
                  foot={`${formatEuro(entry?.share ?? 0)} of the payment · ${formatEuro(p.monthly)} → ${
                    monthlyAfter > 0 ? formatEuro(monthlyAfter) : 'settled'
                  }`}
                />
              );
            })}
          </div>

          <Figures
            figures={[
              {
                label: 'Monthly across plans',
                value: `${formatEuro(spread.monthlyBefore)} → ${formatEuro(spread.monthlyAfter)}`,
              },
              {
                label: 'Principal left',
                value: `${formatEuro(spread.principalBefore)} → ${formatEuro(spread.principalAfter)}`,
              },
              { label: 'Interest saved', value: formatEuro(spread.saved), tone: 'positive' },
            ]}
          />
          <p className="text-[12px] leading-[1.45] mt-3" style={{ color: FAINT }}>
            Pro-rata is what keeps the plans in step: an equal split would clear
            the smallest plan first and leave the rest untouched. Term, count
            and rate are unchanged throughout — only the amounts move.
          </p>
        </div>

        <RowHeading
          title="Paying off one Flex early"
          sub="Aimed at one plan: principal first, spread equally across every unpaid instalment — this month's included, so the minimum drops with it — then interest accrued since the statement. Paying in full clears the plan."
        />

        <div className="flex gap-4 flex-col lg:flex-row">
          <Panel
            title="One plan, principal first"
            lead={`Pay off in full = ${formatEuro(payoff.principal)} principal left + ${formatEuro(payoff.accrued)} interest accrued since the statement. Every future euro of interest beyond that is forgiven.`}
            control={
              <Slider
                label="Payment on this plan"
                value={Math.min(payoffRaw, payoffMax)}
                display={`${formatEuro(prepay.amount)} of ${formatEuro(payoff.total)}`}
                min={1}
                max={payoffMax}
                onChange={setPayoffRaw}
              />
            }
            bars={payoffBars}
            max={planMax}
            figures={[
              {
                label: 'Each instalment',
                value:
                  prepay.monthlyAfter > 0
                    ? `${formatEuro(prepay.monthlyBefore)} → ${formatEuro(prepay.monthlyAfter)}`
                    : 'Paid off',
              },
              { label: 'To interest', value: formatEuro(prepay.toInterest) },
              { label: 'Interest saved', value: formatEuro(prepay.saved), tone: 'positive' },
            ]}
            note="The billed instalment shrinks with the rest, and the minimum with it. Accrued interest is only reached once every instalment is at zero."
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
            protects nothing: it takes the same share off every part of the
            minimum rather than settling any, so a shortfall leaves all of them unpaid
            and <strong>every plan converts</strong>. Paying a plan off early
            in full takes its instalment out of the minimum, which is the one
            way to protect it.
          </p>
        </div>

        <div className="text-[13px] mt-7" style={{ color: FAINT }}>
          Source: src/lib/flex-math.ts — spreadAcrossPlans(), spreadPayment(),
          planPayoffQuote(), planPrepayment()
        </div>
      </div>
    </main>
  );
}
