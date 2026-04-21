'use client';

import { useState, useMemo, useCallback } from 'react';
import { AccountState, PaymentZone, ZoneInfo } from '@/types/payment';
import {
  calculateMinimumPayment,
  calculateInterestProjection,
  getPaymentZone,
  getZoneInfo,
} from '@/lib/payment-math';
import { PRESETS } from '@/lib/constants';

const defaultAccount: AccountState = PRESETS[0].state;

export function usePaymentState() {
  const [accountState, setAccountState] = useState<AccountState>(defaultAccount);
  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAccount.dueBalance);

  // No minimum outside the payment period (billing cycle hasn't closed yet)
  const minimumPayment = useMemo(() => {
    if (!accountState.isInPaymentPeriod) return 0;
    return calculateMinimumPayment(accountState.dueBalance, accountState.outstandingInterest);
  }, [accountState.isInPaymentPeriod, accountState.dueBalance, accountState.outstandingInterest]);

  const isZeroBalance = accountState.totalBalance <= 0;
  const canPay = accountState.totalBalance > 0;

  // Clamp selected amount
  const clampedAmount = useMemo(() => {
    if (!canPay) return 0;
    return Math.max(0, Math.min(selectedAmount, accountState.totalBalance));
  }, [selectedAmount, accountState, canPay]);

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

  // Determine zone
  const zone: PaymentZone = useMemo(
    () =>
      getPaymentZone(
        clampedAmount,
        minimumPayment,
        accountState.dueBalance,
        accountState.totalBalance,
      ),
    [clampedAmount, minimumPayment, accountState.dueBalance, accountState.totalBalance],
  );

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
      }),
    [zone, dueEqualsTotal, minEqualsDue, accountState.userType],
  );

  const setAmount = useCallback((amount: number) => {
    setSelectedAmount(amount);
  }, []);

  const applyPreset = useCallback((state: AccountState) => {
    setAccountState(state);
    if (state.isCardBlocked) {
      setSelectedAmount(calculateMinimumPayment(state.dueBalance, state.outstandingInterest));
    } else if (state.dueBalance > 0) {
      setSelectedAmount(state.dueBalance);
    } else {
      setSelectedAmount(state.totalBalance);
    }
  }, []);

  return {
    accountState,
    setAccountState,
    selectedAmount: clampedAmount,
    setAmount,
    minimumPayment,
    zone,
    zoneInfo,
    interestProjection,
    showInterest,
    isZeroBalance,
    canPay,
    applyPreset,
  };
}

export type PaymentStateReturn = ReturnType<typeof usePaymentState>;
