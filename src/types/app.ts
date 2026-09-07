/**
 * App-level domain types — bills, transactions, Flex instalment plans and the
 * demo scenarios that compose them.
 *
 * These EXTEND `@/types/payment` rather than replace it: `AccountState` there
 * stays the wheel's flat view of the world, and everything here is the richer
 * model that view is derived from (see `@/lib/derive-account`).
 *
 * Shapes are ported from the prototype's `credit-data.jsx`, with the source's
 * `installments` spelled `instalments` and `flexActive` renamed `flexPlans`.
 */

import { UserType } from './payment';

/* ── Transactions ────────────────────────────────────────────────────────── */

/**
 * One card transaction. Used in three places: a bill's line items, the Home
 * feed, and the `items` of a Flex plan (the purchases that were split).
 */
export interface Txn {
  id: string;
  merchant: string;
  /**
   * Day bucket for grouped lists — 'Today', 'Yesterday', '16 Jun'. Lists
   * section on this, preserving first-appearance order.
   */
  day: string;
  /** Clock time, 'HH:MM'. Absent on bill line items, which only carry a date. */
  time?: string;
  /** The sub line rendered under the merchant — usually `${day}, ${time}`. */
  sub: string;
  amount: number;
  /** Merchant key resolved to a file in `public/merchants/` — see `merchantLogo()`. */
  icon: string;
  /**
   * Explicit display string that wins over the formatted amount (e.g. '€210'
   * for a round foreign-currency conversion).
   */
  display?: string;
  /** Foreign-currency line shown under the amount, e.g. 'kr 2445.78'. */
  fx?: string;
  /**
   * Eligible to be split into a Flex plan. A transaction stops being offered
   * once it's on an active plan (see `flexedTxnIds()`) and becomes offerable
   * again if that plan is cancelled.
   */
  flexEligible?: boolean;
}

/* ── Bills ───────────────────────────────────────────────────────────────── */

/**
 * Blocked is deliberately NOT a bill state — it's account-level. A blocked
 * account still has a bill in the 'due' state.
 */
export type BillState = 'paid' | 'due' | 'upcoming' | 'rolled_over';

/**
 * One monthly credit bill. Billing periods run the 16th → the 15th, so the
 * 'Feb 26' bill covers 16 Feb – 15 Mar and is due on 15 Mar 26.
 */
export interface Bill {
  /** Stable month key, e.g. 'feb26'. Matches `Scenario.currentMonthKey`. */
  key: string;
  /** Human label, e.g. 'Feb 26'. */
  period: string;
  state: BillState;
  /** Purchases made in this billing period. */
  spent: number;
  /** Paid toward this bill so far. */
  repaid: number;
  /** Still owed: spent + rolledOver + interest − repaid. */
  outstanding: number;
  /** '15 Mar 26' — or the date it was settled when state is 'paid'. */
  paymentDate: string;
  /** Unpaid amount carried in from the previous bill. */
  rolledOver?: number;
  /** Which bill it rolled over from, e.g. 'Jan 26'. */
  rolledOverFrom?: string;
  /** Interest accrued on this bill. */
  interest?: number;
  minPayment?: number;
  minPaid?: boolean;
  txns: Txn[];
}

/* ── Flex (instalment plans) ─────────────────────────────────────────────── */

/**
 * 'due' instalments fall inside the current billing period and are therefore
 * part of the minimum payment — they enter the wheel. 'upcoming' ones do not.
 */
export type InstalmentState = 'paid' | 'due' | 'upcoming' | 'cancelled';

export interface Instalment {
  /** 1-based position in the schedule. */
  n: number;
  state: InstalmentState;
  amount: number;
  /** '12 Mar 26' — see `formatPlanDate()` / `parsePlanDate()`. */
  date: string;
}

/**
 * An instalment plan. One plan can bundle several transactions flexed
 * together, so `items` is a list and `items[0]` is the plan's primary
 * merchant (see `planPrimary()` / `planLabel()`).
 */
export interface FlexPlan {
  id: string;
  /** The transactions that were split into this plan. */
  items: Txn[];
  /** Number of instalments in the schedule. */
  n: number;
  /** When the plan was created — 'Today', '2 days ago', '12 Jan 26'. */
  created: string;
  /** Principal — the summed transaction amounts, before interest. */
  amount: number;
  /** All-in monthly payment (principal + interest). */
  monthly: number;
  /** Final instalment — absorbs the rounding remainder. */
  last: number;
  /** Total interest over the term. */
  interest: number;
  /** Total to repay = amount + interest. */
  total: number;
  instalments: Instalment[];
  /** Set only on plans that have moved to `flexHistory`. */
  outcome?: 'paid' | 'cancelled';
  /** Date the plan was fully repaid, when outcome is 'paid'. */
  paidOff?: string;
  /** Date the plan was cancelled, when outcome is 'cancelled'. */
  cancelledOn?: string;
  /** Unpaid instalments rolled back into the credit bill on cancellation. */
  rolledToCredit?: number;
}

/* ── Scenarios ───────────────────────────────────────────────────────────── */

export type ScenarioKey = 'transactor' | 'revolver' | 'blocked';

/** A complete demo app state — everything the UI reads flows from one of these. */
export interface Scenario {
  key: ScenarioKey;
  label: string;
  caption: string;
  /**
   * Account frozen after a missed minimum payment: banner on Bills, and a
   * "Pay minimum to unblock" CTA on the due bill.
   */
  accountBlocked: boolean;
  userType: UserType;
  /** The card's credit line, in €. */
  creditLimit: number;
  /** Statement issued and the bill is payable (vs. mid-cycle). */
  isInPaymentPeriod: boolean;
  /** Bill history, oldest first. */
  months: Bill[];
  /** `Bill.key` of the bill the account is currently being asked to pay. */
  currentMonthKey: string;
  /** Active instalment plans. */
  flexPlans: FlexPlan[];
  /** Settled or cancelled plans — every entry carries an `outcome`. */
  flexHistory: FlexPlan[];
  /** The Home / Flex-picker transaction feed. */
  transactions: Txn[];
}
