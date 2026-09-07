/**
 * Demo data — ported from the prototype's `credit-data.jsx`, with the
 * Flex-eligible transaction feed from `v3-flex-screen.jsx` merged in as each
 * scenario's Home feed.
 *
 * A SCENARIO is a complete app state: bill history, the bill currently being
 * asked for, active and past Flex plans, and the transaction feed. Everything
 * the UI shows is derived from one of these (see `@/lib/derive-account`).
 *
 * The objects here are module-level and shared between scenarios; treat them
 * as immutable. `useAppState` deep-clones the picked scenario before any
 * mutation so the library can't be corrupted by a demo session.
 */

import { Bill, FlexPlan, Instalment, Scenario, ScenarioKey, Txn } from '@/types/app';
import { calcPlan, round2 } from './flex-math';

/** Every scenario shares one credit line — matches Home's headline figure. */
export const CREDIT_LIMIT = 1900;

/* ── Bill line items ─────────────────────────────────────────────────────── */

/**
 * Bill transactions carry a date but no clock time, so `day` and `sub` are
 * both the date. Ids are `<month>-<n>` so they never collide with the Home
 * feed's ids.
 */
function billTxn(
  monthKey: string,
  index: number,
  merchant: string,
  date: string,
  amount: number,
  icon: string,
): Txn {
  return { id: `${monthKey}-${index}`, merchant, day: date, sub: date, amount, icon };
}

const TXNS: Record<string, Txn[]> = {
  oct25: [
    billTxn('oct25', 1, 'Bolt Drive', '28 Oct', 14.8, 'bolt'),
    billTxn('oct25', 2, 'Amazon DE', '20 Oct', 198.0, 'amazon'),
    billTxn('oct25', 3, 'Nike Ülemiste', '12 Oct', 200.0, 'nike'),
  ],
  nov25: [
    billTxn('nov25', 1, 'Amazon DE', '26 Nov', 88.4, 'amazon'),
    billTxn('nov25', 2, 'Bolt Drive', '15 Nov', 22.1, 'bolt'),
    billTxn('nov25', 3, 'Nike Ülemiste', '4 Nov', 140.0, 'nike'),
  ],
  dec25: [
    billTxn('dec25', 1, 'Amazon DE', '22 Dec', 215.3, 'amazon'),
    billTxn('dec25', 2, 'Bolt Drive', '18 Dec', 31.5, 'bolt'),
    billTxn('dec25', 3, 'Nike Ülemiste', '8 Dec', 95.0, 'nike'),
  ],
  jan26: [
    billTxn('jan26', 1, 'Amazon DE', '30 Jan', 112.5, 'amazon'),
    billTxn('jan26', 2, 'Bolt Drive', '24 Jan', 42.3, 'bolt'),
    billTxn('jan26', 3, 'Nike Ülemiste', '19 Jan', 157.7, 'nike'),
  ],
  feb26: [
    billTxn('feb26', 1, 'Bolt Drive', '24 Feb', 14.2, 'bolt'),
    billTxn('feb26', 2, 'Amazon DE', '18 Feb', 172.2, 'amazon'),
    billTxn('feb26', 3, 'Nike Ülemiste', '5 Feb', 100.0, 'nike'),
  ],
  // The open cycle. This is the spending the wheel's due → total band is made
  // of, so it carries real weight rather than a couple of subscriptions.
  mar26: [
    billTxn('mar26', 1, 'Spotify Premium', '1 Mar', 9.99, 'bolt'),
    billTxn('mar26', 2, 'Amazon Prime', '4 Mar', 12.99, 'amazon'),
    billTxn('mar26', 3, 'Kaup24.ee', '9 Mar', 64.9, 'kaup24'),
    billTxn('mar26', 4, 'Bolt Drive', '11 Mar', 18.4, 'bolt'),
    billTxn('mar26', 5, 'Hugo', '13 Mar', 42.5, 'hugo'),
  ],
  // Blocked accounts stop here: the card froze on 4 Mar, so only the two
  // transactions that cleared before it are on the bill.
  mar26_blocked: [
    billTxn('mar26', 1, 'Spotify Premium', '1 Mar', 9.99, 'bolt'),
    billTxn('mar26', 2, 'Amazon Prime', '4 Mar', 12.99, 'amazon'),
  ],
};

/** Σ of a bill's line items — keeps `spent` honest against `txns`. */
const spentOf = (txns: Txn[]): number =>
  round2(txns.reduce((sum, t) => sum + t.amount, 0));

/* ── Home / Flex transaction feed ────────────────────────────────────────── */

function feedTxn(
  id: string,
  merchant: string,
  day: string,
  time: string,
  amount: number,
  icon: string,
  extra?: Pick<Txn, 'flexEligible' | 'display' | 'fx'>,
): Txn {
  return { id, merchant, day, time, sub: `${day}, ${time}`, amount, icon, ...extra };
}

/**
 * The Flex-eligible feed from the prototype's `v3-flex-screen.jsx`. Rows
 * marked `flexEligible` show the "Flex available" chip; a row already on an
 * active plan shows a muted "Flexed" marker instead (see `flexedTxnIds()`).
 */
export const FEED_TXNS: Txn[] = [
  feedTxn('f1', 'Hugo', 'Today', '20:47', 120.39, 'hugo', { flexEligible: true }),
  feedTxn('f2', 'Nike', 'Today', '20:35', 42.0, 'nike'),
  feedTxn('f3', 'Apple Store', 'Today', '20:09', 210.0, 'apple', {
    flexEligible: true,
    display: '€210',
    fx: 'kr 2445.78',
  }),
  feedTxn('f4', 'Bolt Drive', 'Yesterday', '18:12', 23.5, 'bolt'),
  feedTxn('f5', 'Kaup24.ee', 'Yesterday', '12:39', 129.99, 'kaup24', { flexEligible: true }),
  feedTxn('f6', 'US POLO', '16 Jun', '07:45', 75.2, 'uspolo', { flexEligible: true }),
];

const feed = (id: string): Txn => {
  const txn = FEED_TXNS.find((t) => t.id === id);
  if (!txn) throw new Error(`Unknown feed transaction: ${id}`);
  return txn;
};

/* ── Bill library ────────────────────────────────────────────────────────── */

const M: Record<string, Bill> = {
  oct25_paid: {
    key: 'oct25', period: 'Oct 25', state: 'paid',
    spent: 412.8, repaid: 412.8, outstanding: 0,
    paymentDate: '15 Nov 25',
    txns: TXNS.oct25,
  },
  nov25_paid: {
    key: 'nov25', period: 'Nov 25', state: 'paid',
    spent: 250.5, repaid: 250.5, outstanding: 0,
    paymentDate: '15 Dec 25',
    txns: TXNS.nov25,
  },
  dec25_paid: {
    key: 'dec25', period: 'Dec 25', state: 'paid',
    spent: 341.8, repaid: 341.8, outstanding: 0,
    paymentDate: '15 Jan 26',
    txns: TXNS.dec25,
  },
  jan26_paid: {
    key: 'jan26', period: 'Jan 26', state: 'paid',
    spent: 312.5, repaid: 312.5, outstanding: 0,
    paymentDate: '15 Feb 26',
    txns: TXNS.jan26,
  },
  jan26_rolled: {
    key: 'jan26', period: 'Jan 26', state: 'rolled_over',
    spent: 312.5, repaid: 150.0, outstanding: 175.1,
    paymentDate: '15 Feb 26',
    interest: 12.6,
    minPayment: 38.63, minPaid: true,
    txns: TXNS.jan26,
  },
  feb26_due: {
    key: 'feb26', period: 'Feb 26', state: 'due',
    spent: 286.4, repaid: 0, outstanding: 465.7,
    paymentDate: '15 Mar 26',
    rolledOver: 175.1, rolledOverFrom: 'Jan 26',
    interest: 4.2,
    minPayment: 25, minPaid: false,
    txns: TXNS.feb26,
  },
  feb26_due_clean: {
    key: 'feb26', period: 'Feb 26', state: 'due',
    spent: 286.4, repaid: 0, outstanding: 286.4,
    paymentDate: '15 Mar 26',
    minPayment: 25, minPaid: false,
    txns: TXNS.feb26,
  },
  feb26_rolled_blocked: {
    key: 'feb26', period: 'Feb 26', state: 'rolled_over',
    spent: 286.4, repaid: 0, outstanding: 469.9,
    paymentDate: '15 Mar 26',
    rolledOver: 175.1, rolledOverFrom: 'Jan 26',
    interest: 8.4,
    minPayment: 25, minPaid: false,
    txns: TXNS.feb26,
  },
  mar26_upcoming: {
    key: 'mar26', period: 'Mar 26', state: 'upcoming',
    spent: spentOf(TXNS.mar26), repaid: 0, outstanding: spentOf(TXNS.mar26),
    paymentDate: '15 Apr 26',
    txns: TXNS.mar26,
  },
  // Revolver: the in-progress March bill is still "due" because the user
  // already has rolling debt — every open balance is a debt that needs paying.
  // Nothing has rolled over yet, but interest accrues on the open balance.
  mar26_due_revolver: {
    key: 'mar26', period: 'Mar 26', state: 'due',
    spent: spentOf(TXNS.mar26), repaid: 0, outstanding: round2(spentOf(TXNS.mar26) + 0.4),
    paymentDate: '15 Apr 26',
    interest: 0.4,
    minPayment: 25, minPaid: false,
    txns: TXNS.mar26,
  },
  mar26_due_blocked: {
    key: 'mar26', period: 'Mar 26', state: 'due',
    spent: 22.98, repaid: 0, outstanding: 499.08,
    paymentDate: '15 Apr 26',
    rolledOver: 469.9, rolledOverFrom: 'Feb 26',
    interest: 6.2,
    minPayment: 49.91, minPaid: false,
    txns: TXNS.mar26_blocked,
  },
};

/* ── Flex plans ──────────────────────────────────────────────────────────── */

interface PlanSpec {
  id: string;
  items: Txn[];
  created: string;
  /**
   * One date per instalment, in order. Instalments ride along with the
   * monthly bill, so they fall on the 15th — the same convention
   * `buildSchedule()` generates for plans created in-app.
   */
  dates: string[];
  /**
   * Index of the instalment falling in the scenario's CURRENT billing period.
   * Earlier instalments are 'paid', later ones 'upcoming'. Exactly one 'due'
   * instalment per active plan is what makes `flexDue` non-zero — that slice
   * joins the minimum payment and enters the wheel.
   *
   * `-1` on a settled plan: everything is 'paid'.
   */
  dueIndex: number;
  /** Instalments cancelled from `cancelFrom` onwards (used by history plans). */
  cancelFrom?: number;
}

/**
 * Build a plan from its principal (the summed transaction amounts) and its
 * schedule dates. Money comes from `calcPlan`, so every figure on the plan is
 * internally consistent with the amortisation the create flow shows.
 */
function makePlan(spec: PlanSpec): FlexPlan {
  const amount = round2(spec.items.reduce((sum, t) => sum + t.amount, 0));
  const n = spec.dates.length;
  const { monthly, last, interest, total } = calcPlan(amount, n);

  const instalments: Instalment[] = spec.dates.map((date, i) => {
    const state: Instalment['state'] =
      spec.cancelFrom !== undefined && i >= spec.cancelFrom
        ? 'cancelled'
        : spec.dueIndex < 0 || i < spec.dueIndex
          ? 'paid'
          : i === spec.dueIndex
            ? 'due'
            : 'upcoming';
    return { n: i + 1, state, amount: i === n - 1 ? last : monthly, date };
  });

  return {
    id: spec.id,
    items: spec.items,
    n,
    created: spec.created,
    amount,
    monthly,
    last,
    interest,
    total,
    instalments,
  };
}

/**
 * Active plans, authored against the Feb 26 billing period (16 Feb – 15 Mar),
 * which is the current period for the transactor and revolver scenarios.
 */
const FLEX = {
  hugo: makePlan({
    id: 'flex_hugo',
    items: [feed('f1')],
    created: '20 Dec 25',
    dates: ['15 Jan 26', '15 Feb 26', '15 Mar 26', '15 Apr 26'],
    dueIndex: 2,
  }),
  apple: makePlan({
    id: 'flex_apple',
    items: [feed('f3')],
    created: '20 Oct 25',
    dates: ['15 Nov 25', '15 Dec 25', '15 Jan 26', '15 Feb 26', '15 Mar 26', '15 Apr 26'],
    dueIndex: 4,
  }),
  kaup24: makePlan({
    id: 'flex_kaup24',
    items: [feed('f5')],
    created: '20 Jan 26',
    dates: ['15 Feb 26', '15 Mar 26', '15 Apr 26'],
    dueIndex: 1,
  }),
  /** The Apple plan a month later — the blocked scenario's period is Mar 26. */
  appleMar: makePlan({
    id: 'flex_apple',
    items: [feed('f3')],
    created: '20 Nov 25',
    dates: ['15 Dec 25', '15 Jan 26', '15 Feb 26', '15 Mar 26', '15 Apr 26', '15 May 26'],
    dueIndex: 4,
  }),
};

/** Past plans. Every entry carries an `outcome`. */
const FLEX_HISTORY = {
  applePaid: {
    ...makePlan({
      id: 'flex_apple_past',
      items: [
        { id: 'h1', merchant: 'Apple Store', day: '14 Oct 25', sub: '14 Oct 25', amount: 840, icon: 'apple' },
      ],
      created: '20 Oct 25',
      dates: ['15 Nov 25', '15 Dec 25', '15 Jan 26', '15 Feb 26'],
      dueIndex: -1,
    }),
    outcome: 'paid',
    paidOff: '15 Feb 26',
  } satisfies FlexPlan,
  nikePaid: {
    ...makePlan({
      id: 'flex_nike_past',
      items: [
        { id: 'h2', merchant: 'Nike Ülemiste', day: '20 Aug 25', sub: '20 Aug 25', amount: 220, icon: 'nike' },
      ],
      created: '20 Aug 25',
      dates: ['15 Sep 25', '15 Oct 25', '15 Nov 25', '15 Dec 25'],
      dueIndex: -1,
    }),
    outcome: 'paid',
    paidOff: '15 Dec 25',
  } satisfies FlexPlan,
  // Cancelled plan — the unpaid instalments rolled back into the credit bill.
  // (The prototype had no Zara tile, so it borrows the Amazon one.)
  zaraCancelled: buildCancelled(),
};

/** Cancelled plans need `rolledToCredit` summed from the cancelled instalments. */
function buildCancelled(): FlexPlan {
  const plan = makePlan({
    id: 'flex_zara_cancelled',
    items: [
      { id: 'h3', merchant: 'Zara Online', day: '10 Oct 25', sub: '10 Oct 25', amount: 180, icon: 'amazon' },
    ],
    created: '20 Oct 25',
    dates: ['15 Nov 25', '15 Dec 25', '15 Jan 26', '15 Feb 26'],
    dueIndex: -1,
    cancelFrom: 2,
  });
  return {
    ...plan,
    outcome: 'cancelled',
    cancelledOn: '10 Jan 26',
    rolledToCredit: round2(
      plan.instalments
        .filter((i) => i.state === 'cancelled')
        .reduce((sum, i) => sum + i.amount, 0),
    ),
  };
}

/* ── Scenarios ───────────────────────────────────────────────────────────── */

export const SCENARIOS: Scenario[] = [
  {
    key: 'transactor',
    label: 'Transactor',
    caption: 'Always pays in full before the payment date. Never carries interest.',
    accountBlocked: false,
    userType: 'transactor',
    creditLimit: CREDIT_LIMIT,
    isInPaymentPeriod: true,
    months: [M.oct25_paid, M.nov25_paid, M.dec25_paid, M.jan26_paid, M.feb26_due_clean, M.mar26_upcoming],
    currentMonthKey: 'feb26',
    flexPlans: [FLEX.hugo, FLEX.apple, FLEX.kaup24],
    flexHistory: [FLEX_HISTORY.applePaid, FLEX_HISTORY.nikePaid, FLEX_HISTORY.zaraCancelled],
    transactions: FEED_TXNS,
  },
  {
    key: 'revolver',
    label: 'Revolver',
    caption:
      'Made minimum but not full payment last month — some debt rolled into this bill.',
    accountBlocked: false,
    userType: 'revolver',
    creditLimit: CREDIT_LIMIT,
    isInPaymentPeriod: true,
    months: [M.oct25_paid, M.nov25_paid, M.dec25_paid, M.jan26_rolled, M.feb26_due, M.mar26_due_revolver],
    currentMonthKey: 'feb26',
    flexPlans: [FLEX.hugo, FLEX.apple],
    flexHistory: [FLEX_HISTORY.nikePaid, FLEX_HISTORY.zaraCancelled],
    transactions: FEED_TXNS,
  },
  {
    key: 'blocked',
    label: 'Blocked',
    caption:
      'Account frozen — missed the minimum payment. The bill is still just "Due"; the account is what’s blocked.',
    accountBlocked: true,
    userType: 'revolver',
    creditLimit: CREDIT_LIMIT,
    isInPaymentPeriod: true,
    months: [M.oct25_paid, M.nov25_paid, M.dec25_paid, M.jan26_rolled, M.feb26_rolled_blocked, M.mar26_due_blocked],
    currentMonthKey: 'mar26',
    flexPlans: [FLEX.appleMar],
    flexHistory: [FLEX_HISTORY.nikePaid, FLEX_HISTORY.zaraCancelled],
    transactions: FEED_TXNS,
  },
];

export const DEFAULT_SCENARIO_KEY: ScenarioKey = 'transactor';

export function getScenario(key: ScenarioKey): Scenario {
  return SCENARIOS.find((s) => s.key === key) ?? SCENARIOS[0];
}
