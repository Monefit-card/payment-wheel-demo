'use client';

import { useState, useMemo, useCallback } from 'react';
import { AccountState, PaymentZone, ZoneInfo } from '@/types/payment';
import {
  calculateMinimumPayment,
  calculateInterestProjection,
  getPaymentZone,
  getZoneInfo,
  getZoneEducation,
} from '@/lib/payment-math';
import { round2, spreadAcrossPlans } from '@/lib/flex-math';
import { FlexPlan } from '@/types/app';
import { PRESETS } from '@/lib/constants';

const defaultAccount: AccountState = PRESETS[0].state;

/**
 * What the wheel needs from the app store. Supply it from `useAppState`:
 *
 *   const app = useAppState();
 *   const paymentState = usePaymentState({
 *     accountState: app.account,
 *     flexDueAmount: app.summary.flexDue,
 *     onAccountStateChange: app.overrideAccount,
 *   });
 */
export interface PaymentAppInput {
  /** Composed account state — `deriveAccountState()` output. */
  accountState: AccountState;
  /**
   * The slice of `dueBalance` that is due Flex instalments. Held separately
   * because the ≤ €20 minimum rule must only ever see the credit portion.
   */
  flexDueAmount: number;
  /**
   * Instalments scheduled beyond this period. Not payable in the wheel — it's
   * the gap between the wheel's maximum and the account's total balance.
   */
  flexFutureAmount: number;
  /**
   * Principal outstanding on those future instalments — what settling every
   * plan costs today, after the unearned interest is forgiven.
   */
  flexSettlementAmount: number;
  /** Interest forgiven by settling now. */
  flexInterestSaved: number;
  /**
   * The active plans, for the stretch of ring above the card balance: a
   * payment there is spread across their upcoming instalments (METHOD 1 —
   * reduce exposure, see `spreadAcrossPlans`). The figures above stay the
   * source of truth for the ring's geometry; these drive what the payment
   * does to the schedule.
   */
  flexPlans?: FlexPlan[];
  /** Where AdminPanel edits and presets are written (`app.overrideAccount`). */
  onAccountStateChange: (state: AccountState) => void;
}

/**
 * Wheel state. Pass the app store to drive it from the real scenario; called
 * with no argument it falls back to standalone local state seeded from
 * `PRESETS[0]`, which keeps the wheel usable on its own.
 */
export function usePaymentState(app?: PaymentAppInput) {
  // Always declared, so the hook order never depends on `app`. Unused when
  // the app store is supplied.
  const [localState, setLocalState] = useState<AccountState>(defaultAccount);
  /**
   * `null` means "follow the account's default amount" — so the wheel
   * re-seeds itself when the scenario or preset changes, but stops the moment
   * the user drags.
   */
  const [pickedAmount, setPickedAmount] = useState<number | null>(null);

  const accountState = app?.accountState ?? localState;
  const flexDueAmount = app?.flexDueAmount ?? 0;
  const flexFutureAmount = app?.flexFutureAmount ?? 0;
  const flexSettlementAmount = app?.flexSettlementAmount ?? 0;
  const flexInterestSaved = app?.flexInterestSaved ?? 0;
  const flexPlans = app?.flexPlans;

  /**
   * The ring's maximum. Past the card's payable balance it covers settling
   * every plan — one discrete step, never a partial instalment payment.
   */
  const settlementTotal = round2(accountState.totalBalance + flexSettlementAmount);

  // No minimum outside the payment period (billing cycle hasn't closed yet).
  //
  // THE CORE RULE: due Flex instalments are part of the minimum, but they are
  // added ON TOP of the credit minimum. `calculateMinimumPayment()` carries a
  // "≤ €20 → minimum is the whole bill" rule that must be decided by the
  // credit portion alone, so the composed `dueBalance` never goes into it.
  const minimumPayment = useMemo(() => {
    if (!accountState.isInPaymentPeriod) return 0;
    const creditDue = Math.max(0, round2(accountState.dueBalance - flexDueAmount));
    return round2(
      calculateMinimumPayment(creditDue, accountState.outstandingInterest) + flexDueAmount,
    );
  }, [
    accountState.isInPaymentPeriod,
    accountState.dueBalance,
    accountState.outstandingInterest,
    flexDueAmount,
  ]);

  /**
   * The credit-line slice of the minimum — the anchor that separates it from
   * the due instalments sitting on top. Zero when there are no due
   * instalments, or when the credit portion is the whole minimum.
   */
  const creditMinimum = useMemo(() => {
    if (flexDueAmount <= 0 || minimumPayment <= 0) return 0;
    const credit = round2(minimumPayment - flexDueAmount);
    return credit > 0 ? credit : 0;
  }, [flexDueAmount, minimumPayment]);

  const isZeroBalance = accountState.totalBalance <= 0;
  const canPay = accountState.totalBalance > 0;

  /** Where the handle rests before the user touches it. */
  const defaultAmount = useMemo(() => {
    if (accountState.isCardBlocked) return minimumPayment;
    if (accountState.dueBalance > 0) return accountState.dueBalance;
    return accountState.totalBalance;
  }, [
    accountState.isCardBlocked,
    accountState.dueBalance,
    accountState.totalBalance,
    minimumPayment,
  ]);

  // Clamp selected amount
  const clampedAmount = useMemo(() => {
    if (!canPay) return 0;
    return Math.max(0, Math.min(pickedAmount ?? defaultAmount, settlementTotal));
  }, [pickedAmount, defaultAmount, settlementTotal, canPay]);

  // Contextual flags for zone copy
  const dueEqualsTotal = useMemo(
    () =>
      accountState.totalBalance > 0 &&
      Math.abs(accountState.dueBalance - accountState.totalBalance) < 0.01,
    [accountState.dueBalance, accountState.totalBalance],
  );

  const minEqualsDue = useMemo(
    () =>
      accountState.totalBalance > 0 &&
      minimumPayment > 0 &&
      Math.abs(minimumPayment - accountState.dueBalance) < 0.01,
    [minimumPayment, accountState.dueBalance, accountState.totalBalance],
  );

  /**
   * The slice of the payment sitting above the card balance — what reaches the
   * plans' future instalments.
   */
  const flexPayment = useMemo(() => {
    if (flexSettlementAmount <= 0) return 0;
    return round2(Math.max(0, clampedAmount - accountState.totalBalance));
  }, [clampedAmount, accountState.totalBalance, flexSettlementAmount]);

  /**
   * What that slice does to the schedule: pro-rata across the plans, each
   * re-amortised over the same instalment count. `null` when there's nothing
   * above the card balance to spread, or no plans to spread it across.
   */
  const flexSpread = useMemo(() => {
    if (!flexPlans || flexPlans.length === 0 || flexSettlementAmount <= 0) return null;
    return spreadAcrossPlans(flexPlans, flexPayment);
  }, [flexPlans, flexPayment, flexSettlementAmount]);

  // Determine zone. The stretch above the card balance is the plans' future
  // instalments, so it's resolved here rather than inside `getPaymentZone`,
  // which only knows the card's own anchors.
  const zone: PaymentZone = useMemo(() => {
    if (flexSettlementAmount > 0 && clampedAmount > accountState.totalBalance + 0.01) {
      // The top of the ring settles every plan; below it the payment is a
      // partial prepayment against the instalments still to come.
      return clampedAmount >= settlementTotal - 0.01
        ? 'at_settlement'
        : 'between_total_settlement';
    }
    return getPaymentZone(
      clampedAmount,
      minimumPayment,
      accountState.dueBalance,
      accountState.totalBalance,
      creditMinimum,
    );
  }, [
    clampedAmount,
    minimumPayment,
    accountState.dueBalance,
    accountState.totalBalance,
    flexSettlementAmount,
    settlementTotal,
    creditMinimum,
  ]);

  // Interest projection
  const interestProjection = useMemo(() => {
    if (!canPay || isZeroBalance) return 0;
    if (clampedAmount >= accountState.dueBalance) return 0;
    const remaining = accountState.dueBalance - clampedAmount;
    return calculateInterestProjection(remaining, 30);
  }, [accountState, clampedAmount, canPay, isZeroBalance]);

  const showInterest = interestProjection > 0;

  const zoneInfo: ZoneInfo = useMemo(
    () =>
      getZoneInfo(zone, {
        dueEqualsTotal,
        minEqualsDue,
        userType: accountState.userType,
        flexFuture: flexFutureAmount,
      }),
    [zone, dueEqualsTotal, minEqualsDue, accountState.userType, flexFutureAmount],
  );

  const zoneEducation: string = useMemo(
    () =>
      getZoneEducation(zone, {
        dueEqualsTotal,
        minEqualsDue,
        userType: accountState.userType,
        // The drawer names the Flex slice: a minimum that silently contains
        // instalments is the one number a user can't reconcile on their own.
        flexDue: flexDueAmount,
        flexFuture: flexFutureAmount,
        flexInterestSaved,
        // Names what a partial payment above the card balance does to the
        // schedule — the one stage whose meaning is the outcome, not the figure.
        flexSpread: flexSpread
          ? { ...flexSpread, plans: flexSpread.perPlan.length }
          : undefined,
      }),
    [
      zone,
      dueEqualsTotal,
      minEqualsDue,
      accountState.userType,
      flexDueAmount,
      flexFutureAmount,
      flexInterestSaved,
      flexSpread,
    ],
  );

  const setAmount = useCallback((amount: number) => {
    setPickedAmount(amount);
  }, []);

  const onAccountStateChange = app?.onAccountStateChange;

  const setAccountState = useCallback(
    (state: AccountState) => {
      if (onAccountStateChange) onAccountStateChange(state);
      else setLocalState(state);
    },
    [onAccountStateChange],
  );

  /** AdminPanel presets — swap the whole account and re-seed the handle. */
  const applyPreset = useCallback(
    (state: AccountState) => {
      setAccountState(state);
      setPickedAmount(null);
    },
    [setAccountState],
  );

  return {
    accountState,
    setAccountState,
    selectedAmount: clampedAmount,
    setAmount,
    minimumPayment,
    /**
     * Anchor inside the minimum: the credit-line minimum, with the due
     * instalments making up the rest. Zero when the split isn't shown.
     */
    creditMinimum,
    /** The part of `minimumPayment` / `dueBalance` that is due Flex instalments. */
    flexDueAmount,
    /** Instalments beyond this period — outside every wheel figure. */
    flexFutureAmount,
    /** Cost of settling every plan today. */
    flexSettlementAmount,
    /** Interest forgiven by settling now. */
    flexInterestSaved,
    /** The slice of the payment above the card balance — reaches the plans. */
    flexPayment,
    /**
     * Reduce-exposure outcome for that slice: the instalments it shrinks, the
     * monthly before and after, the interest it forgives. `null` when there's
     * nothing above the card balance.
     */
    flexSpread,
    /** The ring's maximum: card balance + settlement. */
    settlementTotal,
    zone,
    zoneInfo,
    zoneEducation,
    interestProjection,
    showInterest,
    isZeroBalance,
    canPay,
    applyPreset,
  };
}

export type PaymentStateReturn = ReturnType<typeof usePaymentState>;
