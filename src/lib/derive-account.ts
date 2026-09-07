/**
 * Scenario → account numbers.
 *
 * THE CORE RULE: Flex balances are a child of the main balance, but only DUE
 * instalments enter the wheel — they're part of the minimum payment. Future
 * instalments are excluded, so with Flex active the wheel's total payment can
 * be LOWER than the account's total balance.
 *
 *   creditOutstanding   = currentBill.outstanding
 *   upcomingSpend       = Σ outstanding on bills after the current one
 *   flexDue             = Σ instalments in the current billing period
 *   flexFuture          = Σ instalments beyond it
 *
 *   accountTotalBalance = creditOutstanding + upcomingSpend + flexDue + flexFuture  ← Home
 *   totalBalance        = creditOutstanding + upcomingSpend + flexDue               ← wheel
 *   dueBalance          = creditOutstanding + flexDue                               ← wheel
 *   minimumPayment      = minimum(creditOutstanding) + flexDue
 *
 * `upcomingSpend` is what opens the wheel's due → total drag band: spending in
 * the open cycle that hasn't been billed yet, which you can pay ahead on. The
 * core rule survives intact — `totalBalance` sits below `accountTotalBalance`
 * by exactly `flexFuture`, because future instalments are in neither wheel
 * figure.
 *
 * The ≤ €20 "minimum is the whole bill" rule in `calculateMinimumPayment()`
 * must only ever see the CREDIT portion; `flexDue` is added on top afterwards.
 * Never pass a composed balance into it.
 */

import { AccountState } from '@/types/payment';
import { Bill, Scenario } from '@/types/app';
import { calculateMinimumPayment } from './payment-math';
import {
  flexDueTotal,
  flexFutureTotal,
  flexRemainingTotal,
  flexSettlementQuote,
  round2,
} from './flex-math';

/** The bill the account is currently being asked to pay. */
export function getCurrentBill(scenario: Scenario): Bill {
  // A `currentMonthKey` with no matching bill is a data bug; fall back to the
  // most recent month rather than leaving every consumer to null-check.
  return (
    scenario.months.find((m) => m.key === scenario.currentMonthKey) ??
    scenario.months[scenario.months.length - 1]
  );
}

export interface AccountSummary {
  /**
   * Everything owed: the current bill + open-cycle spending + every unpaid
   * instalment. Home's "what's owed".
   */
  accountTotalBalance: number;
  /** The credit bill on its own, excluding Flex. */
  creditOutstanding: number;
  /** Σ instalments falling in the current billing period — these enter the wheel. */
  flexDue: number;
  /** Σ instalments scheduled beyond it — excluded from the wheel. */
  flexFuture: number;
  /** flexDue + flexFuture. */
  flexRemaining: number;
  /** Cost of settling every plan today — principal only, unearned interest forgiven. */
  flexSettlement: number;
  /** Interest forgiven by settling now. */
  flexInterestSaved: number;
  /** Credit line left, after everything owed. */
  available: number;
  currentBill: Bill;
  /** Credit minimum + flexDue. Zero outside the payment period. */
  minimumPayment: number;
  /**
   * Σ outstanding on bills after the current one — spending in the open cycle
   * that hasn't been billed yet. Part of `totalBalance` but not `dueBalance`,
   * so it's exactly the wheel's due → total drag band.
   */
  upcomingSpend: number;
}

/** The richer view Home and Bills read from. */
export function deriveAccountSummary(scenario: Scenario): AccountSummary {
  const currentBill = getCurrentBill(scenario);
  const creditOutstanding = currentBill.outstanding;

  const flexDue = flexDueTotal(scenario.flexPlans);
  const flexFuture = flexFutureTotal(scenario.flexPlans);
  const flexRemaining = flexRemainingTotal(scenario.flexPlans);
  const settlement = flexSettlementQuote(scenario.flexPlans);

  // Spending in the open cycle. The current bill is the one being asked for,
  // so anything after it is new spending you can choose to pay ahead on.
  const currentIndex = scenario.months.indexOf(currentBill);
  const upcomingSpend = round2(
    scenario.months
      .slice(currentIndex + 1)
      .reduce((sum, m) => sum + m.outstanding, 0),
  );

  const accountTotalBalance = round2(
    creditOutstanding + upcomingSpend + flexRemaining,
  );

  // The credit minimum must see the credit portion only — the ≤ €20 rule
  // would otherwise be decided by an amount that includes instalments.
  const minimumPayment = scenario.isInPaymentPeriod
    ? round2(
        calculateMinimumPayment(creditOutstanding, currentBill.interest ?? 0) + flexDue,
      )
    : 0;

  return {
    accountTotalBalance,
    creditOutstanding,
    flexDue,
    flexFuture,
    flexRemaining,
    flexSettlement: settlement.principal,
    flexInterestSaved: settlement.interestSaved,
    available: round2(Math.max(0, scenario.creditLimit - accountTotalBalance)),
    currentBill,
    minimumPayment,
    upcomingSpend,
  };
}

/**
 * The flat state the wheel reads. `overrides` are shallow-merged last, which
 * is how the AdminPanel's QA controls push a hand-picked balance through the
 * same pipeline.
 */
export function deriveAccountState(
  scenario: Scenario,
  overrides?: Partial<AccountState>,
): AccountState {
  const { creditOutstanding, upcomingSpend, flexDue, currentBill } =
    deriveAccountSummary(scenario);

  return {
    // Future instalments are deliberately excluded from BOTH figures — that's
    // the core rule. The gap between them is `upcomingSpend`: new spending
    // that isn't due yet but can be paid ahead on.
    totalBalance: round2(creditOutstanding + upcomingSpend + flexDue),
    dueBalance: round2(creditOutstanding + flexDue),
    outstandingInterest: currentBill.interest ?? 0,
    userType: scenario.userType,
    isInPaymentPeriod: scenario.isInPaymentPeriod,
    isCardBlocked: scenario.accountBlocked,
    ...overrides,
  };
}
