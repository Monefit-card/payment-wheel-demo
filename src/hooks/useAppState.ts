'use client';

import { useCallback, useMemo, useState } from 'react';
import { AccountState } from '@/types/payment';
import { FlexPlan, Instalment, Scenario, ScenarioKey } from '@/types/app';
import { DEFAULT_SCENARIO_KEY, getScenario } from '@/lib/scenarios';
import {
  AccountSummary,
  deriveAccountState,
  deriveAccountSummary,
  getCurrentBill,
} from '@/lib/derive-account';
import {
  applySpreadToPlans,
  buildSchedule,
  calcPlan,
  formatPlanDate,
  parsePlanDate,
  round2,
} from '@/lib/flex-math';

/**
 * The root store. Plain `useState` + `useCallback` — no external state lib.
 *
 * It holds a deep-cloned WORKING COPY of the picked scenario, so paying,
 * flexing and cancelling mutate the session rather than the shared data in
 * `@/lib/scenarios`. Everything derived (`account`, `summary`) is recomputed
 * from that copy, so consumers never recompute it themselves.
 */

/** Arguments for creating a plan from the picker. */
export interface CreateFlexPlanInput {
  /** Ids of the transactions being flexed together into one plan. */
  txnIds: string[];
  /** Number of instalments. */
  n: number;
}

function cloneScenario(scenario: Scenario): Scenario {
  return structuredClone(scenario);
}

export function useAppState(initialKey: ScenarioKey = DEFAULT_SCENARIO_KEY) {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(initialKey);
  const [scenario, setScenarioState] = useState<Scenario>(() =>
    cloneScenario(getScenario(initialKey)),
  );
  /** QA overrides from the AdminPanel — shallow-merged over the derived state. */
  const [accountOverrides, setAccountOverrides] = useState<Partial<AccountState>>({});
  const [flexIntroSeen, setFlexIntroSeen] = useState(false);

  const summary: AccountSummary = useMemo(
    () => deriveAccountSummary(scenario),
    [scenario],
  );

  const account: AccountState = useMemo(
    () => deriveAccountState(scenario, accountOverrides),
    [scenario, accountOverrides],
  );

  /** Mutate the working copy through a fresh clone — never in place. */
  const update = useCallback((mutate: (draft: Scenario) => void) => {
    setScenarioState((prev) => {
      const draft = cloneScenario(prev);
      mutate(draft);
      return draft;
    });
  }, []);

  /* ── Scenario ──────────────────────────────────────────────────────────── */

  /**
   * Switch scenario. Resets to a fresh clone and drops any QA overrides —
   * a stale override would otherwise mask the scenario you just picked.
   */
  const setScenario = useCallback((key: ScenarioKey) => {
    setScenarioKey(key);
    setScenarioState(cloneScenario(getScenario(key)));
    setAccountOverrides({});
  }, []);

  const overrideAccount = useCallback((partial: Partial<AccountState>) => {
    setAccountOverrides((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetOverrides = useCallback(() => setAccountOverrides({}), []);

  /* ── Flex ──────────────────────────────────────────────────────────────── */

  /**
   * Create a plan from the picked transactions. The flexed purchase LEAVES
   * the credit bill and becomes instalments, so the principal moves out of
   * `currentBill.outstanding` — the bill's `spent` stays put as the record of
   * what was purchased in the period.
   *
   * Returns the created plan, or `null` if no transaction matched.
   */
  const createFlexPlan = useCallback(
    ({ txnIds, n }: CreateFlexPlanInput): FlexPlan | null => {
      const items = scenario.transactions.filter((t) => txnIds.includes(t.id));
      if (items.length === 0) return null;

      const amount = round2(items.reduce((sum, t) => sum + t.amount, 0));
      const today = new Date();
      const { monthly, last, interest, total } = calcPlan(amount, n);

      const plan: FlexPlan = {
        id: `flex_${today.getTime().toString(36)}`,
        items: items.map((t) => ({ ...t })),
        n,
        created: 'Today',
        amount,
        monthly,
        last,
        interest,
        total,
        instalments: buildSchedule(amount, n, today),
      };

      update((draft) => {
        const bill = getCurrentBill(draft);
        bill.outstanding = round2(Math.max(0, bill.outstanding - amount));
        if (bill.outstanding === 0 && bill.state === 'due') bill.state = 'paid';
        draft.flexPlans = [...draft.flexPlans, plan];
      });

      return plan;
    },
    [scenario, update],
  );

  /**
   * Cancel a plan. Unpaid instalments roll back onto the credit bill as
   * `rolledToCredit`, the remaining instalments are marked 'cancelled', and
   * the plan moves to history — which makes its transactions Flex-eligible
   * again, since eligibility is computed from the ACTIVE plans only.
   */
  const cancelFlexPlan = useCallback(
    (id: string) => {
      update((draft) => {
        const plan = draft.flexPlans.find((p) => p.id === id);
        if (!plan) return;

        const unpaid = plan.instalments.filter(
          (i) => i.state === 'due' || i.state === 'upcoming',
        );
        const rolledToCredit = round2(unpaid.reduce((sum, i) => sum + i.amount, 0));
        unpaid.forEach((i) => {
          i.state = 'cancelled';
        });

        const bill = getCurrentBill(draft);
        bill.outstanding = round2(bill.outstanding + rolledToCredit);
        if (bill.outstanding > 0 && bill.state === 'paid') bill.state = 'due';

        plan.outcome = 'cancelled';
        plan.cancelledOn = formatPlanDate(new Date());
        plan.rolledToCredit = rolledToCredit;

        draft.flexPlans = draft.flexPlans.filter((p) => p.id !== id);
        draft.flexHistory = [plan, ...draft.flexHistory];
      });
    },
    [update],
  );

  /**
   * Pay off the next `count` unpaid instalments — the one on this period's
   * bill included, since paying it here simply removes it from the minimum.
   *
   * Early repayment forgives the interest that hasn't accrued, so an upcoming
   * instalment costs its principal only — see `flexSettlementQuote`. Clearing
   * the last one settles the plan.
   */
  const payoffInstalments = useCallback(
    (id: string, count: number) => {
      update((draft) => {
        const plan = draft.flexPlans.find((p) => p.id === id);
        if (!plan) return;

        const unpaid = plan.instalments.filter(
          (i) => i.state === 'due' || i.state === 'upcoming',
        );
        unpaid.slice(0, count).forEach((i) => {
          i.state = 'paid';
        });

        const settled = plan.instalments.every((i) => i.state === 'paid');
        if (!settled) return;

        plan.outcome = 'paid';
        plan.paidOff = formatPlanDate(new Date());
        draft.flexPlans = draft.flexPlans.filter((p) => p.id !== id);
        draft.flexHistory = [plan, ...draft.flexHistory];
      });
    },
    [update],
  );

  /* ── Payment ───────────────────────────────────────────────────────────── */

  /**
   * Apply a payment. Due instalments settle first, oldest first — they're the
   * part of the minimum the account is contractually on the hook for — then
   * whatever is left reduces the credit bill, and anything still left over is
   * above the card balance: it spreads across the plans' future instalments.
   */
  const applyPayment = useCallback(
    (amount: number) => {
      const minimum = summary.minimumPayment;

      update((draft) => {
        let remaining = round2(Math.max(0, amount));

        // 1. Settle due instalments, oldest first. An instalment is only
        //    settled when the payment covers it in full — part-paying one
        //    isn't a thing the product offers.
        const due: { plan: FlexPlan; instalment: Instalment }[] = draft.flexPlans
          .flatMap((plan) =>
            plan.instalments
              .filter((i) => i.state === 'due')
              .map((instalment) => ({ plan, instalment })),
          )
          .sort(
            (a, b) =>
              parsePlanDate(a.instalment.date).getTime() -
              parsePlanDate(b.instalment.date).getTime(),
          );

        for (const { instalment } of due) {
          if (remaining < instalment.amount) break;
          instalment.state = 'paid';
          remaining = round2(remaining - instalment.amount);
        }

        // 2. The remainder pays down the credit bill.
        const bill = getCurrentBill(draft);
        const applied = Math.min(remaining, bill.outstanding);
        bill.outstanding = round2(bill.outstanding - applied);
        bill.repaid = round2(bill.repaid + applied);
        remaining = round2(remaining - applied);

        // 2b. Still money left? It's paying ahead on the open cycle — the
        //     spending after this bill, which is the wheel's due → total band.
        //     State is left alone: an unissued bill that's been paid ahead on
        //     is still upcoming, just smaller.
        const currentIndex = draft.months.indexOf(bill);
        for (const later of draft.months.slice(currentIndex + 1)) {
          if (remaining <= 0) break;
          const toLater = Math.min(remaining, later.outstanding);
          later.outstanding = round2(later.outstanding - toLater);
          later.repaid = round2(later.repaid + toLater);
          remaining = round2(remaining - toLater);
        }

        // 2c. Past the card balance the payment reaches the instalments still
        //     to come. It's spread across them and they're re-amortised over
        //     the same schedule (METHOD 1 — reduce exposure), so the amounts
        //     shrink but the term, count and rate don't move. Prepaying every
        //     one of them settles the plan, which step 5 then files.
        if (remaining > 0) {
          remaining = round2(remaining - applySpreadToPlans(draft.flexPlans, remaining));
        }

        // 3. A cleared bill is a paid bill.
        if (bill.outstanding <= 0) {
          bill.outstanding = 0;
          bill.state = 'paid';
        }
        if (bill.minPayment !== undefined && amount >= bill.minPayment) {
          bill.minPaid = true;
        }

        // 4. Meeting the minimum reactivates a blocked account.
        if (draft.accountBlocked && minimum > 0 && amount >= minimum) {
          draft.accountBlocked = false;
        }

        // 5. A plan with nothing left to pay moves to history.
        const settled = draft.flexPlans.filter((p) =>
          p.instalments.every((i) => i.state === 'paid'),
        );
        if (settled.length > 0) {
          const paidOff = formatPlanDate(new Date());
          settled.forEach((p) => {
            p.outcome = 'paid';
            p.paidOff = paidOff;
          });
          const settledIds = new Set(settled.map((p) => p.id));
          draft.flexPlans = draft.flexPlans.filter((p) => !settledIds.has(p.id));
          draft.flexHistory = [...settled, ...draft.flexHistory];
        }
      });
    },
    [summary.minimumPayment, update],
  );

  const markFlexIntroSeen = useCallback(() => setFlexIntroSeen(true), []);

  return {
    /** Working copy of the picked scenario — safe to mutate through the actions below. */
    scenario,
    scenarioKey,
    accountOverrides,
    flexIntroSeen,
    /** Flat state the wheel reads, overrides applied. */
    account,
    /** Richer figures for Home and Bills. */
    summary,
    setScenario,
    overrideAccount,
    resetOverrides,
    createFlexPlan,
    cancelFlexPlan,
    payoffInstalments,
    applyPayment,
    markFlexIntroSeen,
  };
}

export type AppStateReturn = ReturnType<typeof useAppState>;
