/**
 * Flex (instalment plan) maths.
 *
 * The rule that matters everywhere else: only 'due' instalments — the ones
 * falling in the current billing period — are part of the minimum payment and
 * therefore enter the wheel. 'upcoming' instalments are excluded, which is why
 * the wheel's total can sit below the account's total balance.
 */

import { FlexPlan, Instalment, Txn } from '@/types/app';

/** Fixed annual rate on every Flex plan. */
export const FLEX_RATE = 0.15;

/** Money rounding — every € figure in this module passes through here. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PlanCalc {
  /** Total interest over the term. */
  interest: number;
  /** Total to repay = amount + interest. */
  total: number;
  /** All-in monthly payment (principal + interest). */
  monthly: number;
  /** Final instalment — absorbs the rounding remainder. */
  last: number;
}

/**
 * Amortised instalment plan at a fixed 15% annual rate. Each monthly payment
 * is all-in (principal + interest); total interest grows with the term.
 *
 * Ported verbatim from the prototype's `flex-flow.jsx` — same formula, same
 * rounding, so the demo's numbers stay identical.
 */
export function calcPlan(amount: number, n: number): PlanCalc {
  const r = FLEX_RATE / 12;
  const m = (amount * r) / (1 - Math.pow(1 + r, -n)); // amortised monthly payment
  const monthly = Math.round(m * 100) / 100;
  const total = Math.round(m * n * 100) / 100;
  const interest = Math.round((total - amount) * 100) / 100;
  const last = Math.round((total - monthly * (n - 1)) * 100) / 100;
  return { interest, total, monthly, last };
}

/* ── Dates ───────────────────────────────────────────────────────────────── */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** `'12 Mar 26'` — the instalment date format used throughout the data. */
export function formatPlanDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${MONTHS_SHORT[date.getMonth()]} ${year}`;
}

/** Inverse of `formatPlanDate`. Returns epoch 0 for anything unparseable. */
export function parsePlanDate(value: string): Date {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/.exec(value.trim());
  if (!match) return new Date(0);
  const month = MONTHS_SHORT.indexOf(match[2]);
  if (month < 0) return new Date(0);
  return new Date(2000 + Number(match[3]), month, Number(match[1]));
}

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** `'15th of August'` — how instalment due dates read on the Flex screens. */
export function formatInstalmentDue(date: string): string {
  const parsed = parsePlanDate(date);
  if (parsed.getTime() === 0) return date;
  return `${parsed.getDate()}th of ${MONTHS_LONG[parsed.getMonth()]}`;
}

/** `'15 Jul'` — the compact form used in the Flex summary card. */
export function formatPlanDateShort(date: string): string {
  const parsed = parsePlanDate(date);
  if (parsed.getTime() === 0) return date;
  return `${parsed.getDate()} ${MONTHS_SHORT[parsed.getMonth()]}`;
}

/**
 * Billing periods run the 16th → the 15th. Returns the date the period
 * containing `date` closes on — the same value for any two dates in one
 * period, which is how "falls in the current period" is tested.
 */
export function periodEnd(date: Date): Date {
  const rollsToNextMonth = date.getDate() > 15;
  return new Date(
    date.getFullYear(),
    date.getMonth() + (rollsToNextMonth ? 1 : 0),
    15,
  );
}

/** Same 16th → 15th billing period? */
export function inSamePeriod(a: Date, b: Date): boolean {
  return periodEnd(a).getTime() === periodEnd(b).getTime();
}

/**
 * Instalment dates for a plan started on `startDate`. Instalments ride along
 * with the monthly bill, so they fall on the 15th — the first one on the
 * payment date of the period the plan was created in, then monthly after
 * that. This is what makes "your instalments are included in your minimum
 * monthly payment" true: the first instalment lands on the current statement.
 */
export function scheduleDates(startDate: Date, n: number): Date[] {
  const first = periodEnd(startDate);
  return Array.from(
    { length: n },
    (_, i) => new Date(first.getFullYear(), first.getMonth() + i, 15),
  );
}

/**
 * Build a plan's schedule.
 *
 * An instalment is 'due' when it lands in the same billing period as
 * `reference` (today, unless a caller supplies its own clock); everything
 * later is 'upcoming'. That's exactly one instalment — the amount that joins
 * the minimum payment this period and therefore enters the wheel.
 */
export function buildSchedule(
  amount: number,
  n: number,
  startDate: Date,
  reference: Date = new Date(),
): Instalment[] {
  const { monthly, last } = calcPlan(amount, n);

  return scheduleDates(startDate, n).map((date, i) => ({
    n: i + 1,
    state: inSamePeriod(date, reference) ? 'due' : 'upcoming',
    amount: i === n - 1 ? last : monthly,
    date: formatPlanDate(date),
  }));
}

/* ── Totals ──────────────────────────────────────────────────────────────── */

function sumInstalments(plans: FlexPlan[], states: InstalmentFilter): number {
  let total = 0;
  for (const plan of plans) {
    for (const instalment of plan.instalments) {
      if (states.has(instalment.state)) total += instalment.amount;
    }
  }
  return round2(total);
}

type InstalmentFilter = Set<Instalment['state']>;

const DUE_ONLY: InstalmentFilter = new Set(['due']);
const UPCOMING_ONLY: InstalmentFilter = new Set(['upcoming']);
const UNPAID: InstalmentFilter = new Set(['due', 'upcoming']);

/**
 * Σ instalments falling in the current billing period. This is the slice that
 * joins the minimum payment and enters the wheel.
 */
export function flexDueTotal(plans: FlexPlan[]): number {
  return sumInstalments(plans, DUE_ONLY);
}

/** Σ instalments scheduled beyond the current period — excluded from the wheel. */
export function flexFutureTotal(plans: FlexPlan[]): number {
  return sumInstalments(plans, UPCOMING_ONLY);
}

/** Σ everything still to pay across active plans (due + upcoming). */
export function flexRemainingTotal(plans: FlexPlan[]): number {
  return sumInstalments(plans, UNPAID);
}

/**
 * The instalment a plan is next on the hook for — the due one if there is
 * one, otherwise the earliest upcoming. `null` once a plan is fully settled.
 */
export function nextInstalment(plan: FlexPlan): Instalment | null {
  return (
    plan.instalments.find((i) => i.state === 'due') ??
    plan.instalments.find((i) => i.state === 'upcoming') ??
    null
  );
}

/** Σ of each plan's next instalment — the "next payment" figure on Home's Flex row. */
export function nextInstalmentTotal(plans: FlexPlan[]): number {
  return round2(
    plans.reduce((sum, plan) => sum + (nextInstalment(plan)?.amount ?? 0), 0),
  );
}

/* ── Amortisation ────────────────────────────────────────────────────────── */

export interface AmortisationRow {
  /** 1-based instalment number. */
  n: number;
  /** '12 Mar 26'. */
  date: string;
  /** All-in payment for this instalment. */
  payment: number;
  /** Principal repaid by it. */
  principal: number;
  /** Interest charged on the balance that month. */
  interest: number;
  /** Principal still outstanding after it. */
  balance: number;
}

/**
 * Per-instalment breakdown for the amortisation-table screen. Interest is
 * charged monthly on the declining principal; the final row clears the
 * balance exactly, absorbing the rounding drift.
 */
export function amortisationRows(
  amount: number,
  n: number,
  startDate: Date = new Date(),
): AmortisationRow[] {
  const { monthly, last } = calcPlan(amount, n);
  const r = FLEX_RATE / 12;
  const dates = scheduleDates(startDate, n);

  let balance = round2(amount);
  return Array.from({ length: n }, (_, i) => {
    const isLast = i === n - 1;
    const payment = isLast ? last : monthly;
    const interest = round2(balance * r);
    // The final payment repays whatever principal is left, so the schedule
    // always lands on zero rather than a cent of drift.
    const principal = isLast ? balance : round2(payment - interest);
    balance = isLast ? 0 : round2(balance - principal);

    return { n: i + 1, date: formatPlanDate(dates[i]), payment, principal, interest, balance };
  });
}

/**
 * Principal and interest inside each unpaid instalment, read from the schedule
 * as it stands rather than as it was created. A prepayment rewrites the
 * upcoming amounts, so rebuilding from `plan.amount` would quote principal
 * that's already been paid. The balance still owed is the present value of
 * what's left to pay; each instalment then takes a month's interest on it and
 * the rest comes off principal. Indexed like `plan.instalments`; `undefined`
 * for paid and cancelled ones.
 */
export function remainingRows(
  plan: FlexPlan,
): ({ principal: number; interest: number } | undefined)[] {
  const r = FLEX_RATE / 12;
  const unpaid = plan.instalments.filter(
    (i) => i.state === 'due' || i.state === 'upcoming',
  );
  let balance = round2(
    unpaid.reduce((sum, i, k) => sum + i.amount / Math.pow(1 + r, k + 1), 0),
  );

  return plan.instalments.map((instalment) => {
    if (instalment.state !== 'due' && instalment.state !== 'upcoming') return undefined;
    const isLast = instalment === unpaid[unpaid.length - 1];
    const interest = round2(balance * r);
    const principal = isLast ? balance : round2(instalment.amount - interest);
    balance = round2(balance - principal);
    return { principal, interest };
  });
}

/* ── Early settlement ────────────────────────────────────────────────────── */

export interface SettlementQuote {
  /** Principal outstanding on instalments beyond this period. */
  principal: number;
  /** Interest those instalments would have charged — forgiven on settlement. */
  interestSaved: number;
}

/**
 * Cost of settling every plan's remaining instalments now.
 *
 * Only 'upcoming' instalments count: the 'due' one is already inside the
 * card's payable balance, so including it here would double-count it.
 *
 * Settling early forgives the interest that hasn't accrued yet, so the quote
 * is the principal half of those instalments — `interestSaved` is the rest.
 */
export function flexSettlementQuote(plans: FlexPlan[]): SettlementQuote {
  let principal = 0;
  let interestSaved = 0;

  for (const plan of plans) {
    const rows = remainingRows(plan);
    plan.instalments.forEach((instalment, i) => {
      if (instalment.state !== 'upcoming') return;
      const row = rows[i];
      if (!row) return;
      principal += row.principal;
      interestSaved += row.interest;
    });
  }

  return { principal: round2(principal), interestSaved: round2(interestSaved) };
}

/* ── Paying off one plan early ───────────────────────────────────────────── */

/**
 * The first day of the billing period `date` falls in — the day after the last
 * statement closed. Interest accrued from here on isn't on any statement yet.
 */
export function periodStart(date: Date): Date {
  const end = periodEnd(date);
  return new Date(end.getFullYear(), end.getMonth() - 1, 16);
}

export interface PlanPayoffQuote {
  /** Principal still owed on the plan — every unpaid instalment's, billed included. */
  principal: number;
  /** Interest accrued on it since the statement closed, not billed yet. */
  accrued: number;
  /** Where that accrual starts (the day after the statement closed). */
  accruedFrom: Date;
  /** Everything above: what clears the plan today. */
  total: number;
  /** Interest the unpaid instalments were scheduled to charge. */
  scheduledInterest: number;
  /** scheduledInterest − accrued: the interest that is never charged. */
  saved: number;
  /** Unpaid instalments the principal is spread across. */
  instalments: number;
}

/** Instalments still to pay — this period's and every later one. */
function isUnpaid(instalment: Instalment): boolean {
  return instalment.state === 'due' || instalment.state === 'upcoming';
}

/**
 * The cost of paying one plan off today: every euro of principal still owed,
 * plus the interest accrued on it since the last statement closed, charged per
 * day. The instalment on this period's bill is part of the plan, so it's
 * included — paying the plan off here takes it out of the minimum rather than
 * charging it twice. Every scheduled euro of interest beyond what has accrued
 * is forgiven, which is the saving.
 */
export function planPayoffQuote(plan: FlexPlan, today: Date = new Date()): PlanPayoffQuote {
  const rows = remainingRows(plan);

  let principal = 0;
  let scheduledInterest = 0;
  let instalments = 0;

  plan.instalments.forEach((instalment, i) => {
    const row = rows[i];
    if (!row || !isUnpaid(instalment)) return;
    principal += row.principal;
    scheduledInterest += row.interest;
    instalments += 1;
  });

  const accruedFrom = periodStart(today);
  const days = Math.max(
    0,
    Math.round((today.getTime() - accruedFrom.getTime()) / 86_400_000),
  );
  const accrued = round2(principal * (FLEX_RATE / 365) * days);

  return {
    principal: round2(principal),
    accrued,
    accruedFrom,
    total: round2(principal + accrued),
    scheduledInterest: round2(scheduledInterest),
    saved: round2(Math.max(0, scheduledInterest - accrued)),
    instalments,
  };
}

export interface PlanPrepayment {
  /** The payment, capped at the payoff total. */
  amount: number;
  /** Of which principal — spread across every unpaid instalment. */
  toPrincipal: number;
  /** Of which accrued interest — only once principal is at zero. */
  toInterest: number;
  /** Each unpaid instalment before and after. */
  monthlyBefore: number;
  monthlyAfter: number;
  /** Future interest the payment forgives. */
  saved: number;
  /** True when the payment clears the plan. */
  paidOff: boolean;
  /** The schedule as it would stand. */
  instalments: Instalment[];
}

/**
 * A payment on one plan, allocated the one way the product offers: principal
 * first, spread equally across every unpaid instalment (same count, same
 * dates, each one smaller — this period's included, so the minimum drops
 * too), and accrued interest only once the principal is gone. The top of the
 * range is `planPayoffQuote().total`, which clears the plan.
 */
export function planPrepayment(
  plan: FlexPlan,
  payment: number,
  today: Date = new Date(),
): PlanPrepayment {
  const quote = planPayoffQuote(plan, today);
  const amount = round2(Math.max(0, Math.min(payment, quote.total)));
  const toPrincipal = round2(Math.min(amount, quote.principal));
  const toInterest = round2(amount - toPrincipal);
  const principalAfter = round2(quote.principal - toPrincipal);

  const unpaid = plan.instalments.filter(isUnpaid);
  const monthlyBefore = unpaid[0]?.amount ?? 0;
  // Same count, same rate, smaller balance.
  const after = principalAfter > 0 ? calcPlan(principalAfter, unpaid.length) : null;

  const instalments = plan.instalments.map((instalment): Instalment => {
    if (!isUnpaid(instalment)) return instalment;
    if (!after) return { ...instalment, state: 'paid' };
    const last = instalment === unpaid[unpaid.length - 1];
    return { ...instalment, amount: last ? after.last : after.monthly };
  });

  return {
    amount,
    toPrincipal,
    toInterest,
    monthlyBefore,
    monthlyAfter: after ? after.monthly : 0,
    // Interest on a fixed schedule is proportional to its principal, so the
    // saving is the payoff's saving in the share of principal cleared — what
    // has already accrued is owed either way.
    saved: after
      ? round2(quote.principal > 0 ? quote.saved * (toPrincipal / quote.principal) : 0)
      : quote.saved,
    paidOff: !after,
    instalments,
  };
}

/**
 * METHOD 1 — reduce exposure.
 *
 * Any amount, spread across the instalments that haven't been billed yet. The
 * payment comes off principal and the remaining schedule is re-amortised over
 * the SAME number of instalments at the same rate, so the term, the count and
 * the rate are unchanged and every remaining instalment simply gets smaller.
 *
 * This period's instalment is deliberately excluded: it's already on an issued
 * statement, and it's inside the minimum payment, so reducing it would move the
 * figure that defined the bill the customer is currently paying.
 *
 * Used by the main wheel above the card balance.
 */
export interface SpreadOutcome {
  /** Instalments the reduction applies to — the upcoming ones. */
  instalments: number;
  /** Principal on those instalments before the payment. */
  principalBefore: number;
  /** …and after it. */
  principalAfter: number;
  /** The instalment amount before the payment. */
  monthlyBefore: number;
  /** …and after re-amortising. */
  monthlyAfter: number;
  /** Interest those instalments would have charged, before the payment. */
  interestBefore: number;
  /** …and after it. */
  interestAfter: number;
  /** interestBefore − interestAfter. */
  saved: number;
}

export function spreadPayment(plan: FlexPlan, payment: number): SpreadOutcome {
  const rows = remainingRows(plan);

  let principalBefore = 0;
  let interestBefore = 0;
  let instalments = 0;

  plan.instalments.forEach((instalment, i) => {
    if (instalment.state !== 'upcoming') return;
    const row = rows[i];
    if (!row) return;
    principalBefore = round2(principalBefore + row.principal);
    interestBefore = round2(interestBefore + row.interest);
    instalments += 1;
  });

  const empty: SpreadOutcome = {
    instalments,
    principalBefore,
    principalAfter: principalBefore,
    monthlyBefore: plan.monthly,
    monthlyAfter: plan.monthly,
    interestBefore,
    interestAfter: interestBefore,
    saved: 0,
  };
  if (instalments === 0) return empty;

  const applied = Math.max(0, Math.min(payment, principalBefore));
  const principalAfter = round2(principalBefore - applied);
  // Same term, same rate, smaller balance.
  const after = calcPlan(principalAfter, instalments);

  return {
    instalments,
    principalBefore,
    principalAfter,
    monthlyBefore: plan.monthly,
    monthlyAfter: principalAfter > 0 ? after.monthly : 0,
    interestBefore,
    interestAfter: principalAfter > 0 ? after.interest : 0,
    saved: round2(interestBefore - (principalAfter > 0 ? after.interest : 0)),
  };
}

/* ── Spreading a payment across every plan ──────────────────────────────── */

/** One plan's slice of a portfolio-wide spread. */
export interface PlanSpread {
  id: string;
  /** The plan's share of the payment. */
  share: number;
  outcome: SpreadOutcome;
}

export interface PortfolioSpread {
  /** What actually landed on the plans — the payment, capped at the principal. */
  applied: number;
  /** Σ principal on upcoming instalments before the payment. */
  principalBefore: number;
  /** …and after it. Zero means every plan is settled. */
  principalAfter: number;
  /** Upcoming instalments the reduction touches, across all plans. */
  instalments: number;
  /** Σ monthly instalment across the affected plans, before re-amortising. */
  monthlyBefore: number;
  /** …and after. */
  monthlyAfter: number;
  /** Interest those instalments would charge, before the payment. */
  interestBefore: number;
  /** …and after it. */
  interestAfter: number;
  /** interestBefore − interestAfter. */
  saved: number;
  perPlan: PlanSpread[];
}

/**
 * METHOD 1 across the whole portfolio — what the main wheel does above the
 * card balance.
 *
 * The payment is split between plans PRO-RATA on their outstanding upcoming
 * principal, then each plan re-amortises its share (see `spreadPayment`). Any
 * other split would favour one plan's interest over another's for no reason
 * the customer chose; pro-rata keeps every plan shrinking at the same rate.
 *
 * The last eligible plan absorbs the rounding remainder, so the shares sum to
 * the payment rather than drifting a cent from it.
 */
export function spreadAcrossPlans(plans: FlexPlan[], payment: number): PortfolioSpread {
  const eligible = plans
    .map((plan) => ({ plan, principal: spreadPayment(plan, 0).principalBefore }))
    .filter((entry) => entry.principal > 0);

  const principalBefore = round2(
    eligible.reduce((sum, entry) => sum + entry.principal, 0),
  );
  const applied = Math.max(0, Math.min(round2(payment), principalBefore));

  let allocated = 0;
  const perPlan: PlanSpread[] = eligible.map((entry, i) => {
    const last = i === eligible.length - 1;
    // Pro-rata, capped at the plan's own principal — a cent of rounding can
    // otherwise hand the final plan more than it has left to prepay.
    const share = Math.min(
      entry.principal,
      last ? round2(applied - allocated) : round2(applied * (entry.principal / principalBefore)),
    );
    allocated = round2(allocated + share);
    return { id: entry.plan.id, share, outcome: spreadPayment(entry.plan, share) };
  });

  const sum = (pick: (o: SpreadOutcome) => number) =>
    round2(perPlan.reduce((total, entry) => total + pick(entry.outcome), 0));

  const interestBefore = sum((o) => o.interestBefore);
  const interestAfter = sum((o) => o.interestAfter);

  return {
    applied: allocated,
    principalBefore,
    principalAfter: sum((o) => o.principalAfter),
    instalments: perPlan.reduce((n, entry) => n + entry.outcome.instalments, 0),
    monthlyBefore: sum((o) => o.monthlyBefore),
    monthlyAfter: sum((o) => o.monthlyAfter),
    interestBefore,
    interestAfter,
    saved: round2(interestBefore - interestAfter),
    perPlan,
  };
}

/**
 * Apply a portfolio spread to the plans themselves — used when a payment is
 * confirmed, on the working copy of the scenario.
 *
 * Upcoming instalments are rewritten from the re-amortised schedule: same
 * count, same dates, smaller amounts. A plan whose upcoming principal is
 * fully prepaid has those instalments marked 'paid', which is what settles it.
 *
 * `interest` and `total` are recomputed from what the customer actually pays —
 * every instalment on the schedule plus the lump sum — so prepaying shows up
 * as the interest it forgives.
 *
 * Returns the amount that landed on the plans; anything above the outstanding
 * principal is left for the caller to deal with.
 */
export function applySpreadToPlans(plans: FlexPlan[], payment: number): number {
  const spread = spreadAcrossPlans(plans, payment);

  for (const entry of spread.perPlan) {
    const plan = plans.find((p) => p.id === entry.id);
    if (!plan) continue;

    const upcoming = plan.instalments.filter((i) => i.state === 'upcoming');
    if (upcoming.length === 0) continue;

    if (entry.outcome.principalAfter <= 0) {
      upcoming.forEach((instalment) => {
        instalment.state = 'paid';
      });
      plan.monthly = 0;
      plan.last = 0;
    } else {
      const after = calcPlan(entry.outcome.principalAfter, upcoming.length);
      upcoming.forEach((instalment, i) => {
        instalment.amount = i === upcoming.length - 1 ? after.last : after.monthly;
      });
      plan.monthly = after.monthly;
      plan.last = after.last;
    }

    const scheduled = round2(
      plan.instalments
        .filter((i) => i.state !== 'cancelled')
        .reduce((sum, i) => sum + i.amount, 0),
    );
    plan.total = round2(scheduled + entry.share);
    plan.interest = round2(plan.total - plan.amount);
  }

  return spread.applied;
}

/* ── Closing a plan ──────────────────────────────────────────────────────── */

export interface CloseEligibility {
  allowed: boolean;
  /** Why not, phrased for the customer. Absent when allowed. */
  reason?: string;
}

/**
 * Whether a plan can be closed — converted back to Credit.
 *
 * Closing trades a lower monthly commitment for a higher rate: the remaining
 * principal rejoins the revolving balance, so the minimum drops from the
 * instalment to a percentage of the balance. That makes it an affordability
 * escape hatch, and the cases below are the ones where it would either
 * duplicate work the missed-payment rule already does, or leave the customer
 * worse off for no gain.
 */
export function planCloseEligibility(
  plan: FlexPlan,
  opts: { accountBlocked: boolean; minimumPaid: boolean },
): CloseEligibility {
  // The missed-payment rule already converts affected instalments to Credit,
  // so a voluntary close on top would handle the same debt twice.
  if (opts.accountBlocked) {
    return {
      allowed: false,
      reason: 'Your account is blocked. Pay your minimum to unblock it, then you can close this plan.',
    };
  }

  // This period's instalment is already on the statement. Closing would pull a
  // billed amount back off it.
  const hasDue = plan.instalments.some((i) => i.state === 'due');
  if (hasDue && !opts.minimumPaid) {
    return {
      allowed: false,
      reason: 'This period\'s instalment is already on your bill. Pay your minimum first, then you can close this plan.',
    };
  }

  // One instalment left: converting moves it to a higher rate and frees up no
  // monthly room, so paying it off is strictly better.
  const unpaid = plan.instalments.filter((i) => i.state === 'due' || i.state === 'upcoming');
  if (unpaid.length <= 1) {
    return {
      allowed: false,
      reason: 'Only your final instalment is left, so closing would cost more in interest. Pay it off instead.',
    };
  }

  return { allowed: true };
}

/* ── Plan helpers ────────────────────────────────────────────────────────── */

/**
 * Transaction ids sitting on the given plans. Pass the ACTIVE plans: a
 * transaction stops being Flex-eligible once it's on one, and becomes
 * eligible again when that plan is cancelled (and leaves the active list).
 */
export function flexedTxnIds(plans: FlexPlan[]): Set<string> {
  return new Set(plans.flatMap((p) => p.items.map((item) => item.id)));
}

/** The plan's headline transaction — plans can bundle several. */
export function planPrimary(plan: FlexPlan): Txn | undefined {
  return plan.items[0];
}

/** 'Hugo' for a single item, 'Hugo +2' when several were flexed together. */
export function planLabel(plan: FlexPlan): string {
  const first = plan.items[0];
  if (!first) return 'Flex plan';
  return plan.items.length > 1
    ? `${first.merchant} +${plan.items.length - 1}`
    : first.merchant;
}
