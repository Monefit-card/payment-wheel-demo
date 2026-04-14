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

  const minimumPayment = useMemo(
    () => calculateMinimumPayment(accountState.dueBalance, accountState.outstandingInterest),
    [accountState.dueBalance, accountState.outstandingInterest]
  );

  const isZeroBalance = accountState.totalBalance <= 0;
  const canPay = accountState.totalBalance > 0;

  // Clamp selected amount
  const clampedAmount = useMemo(() => {
    if (!canPay) return 0;
    return Math.max(0, Math.min(selectedAmount, accountState.totalBalance));
  }, [selectedAmount, accountState, canPay]);

  // Determine zone
  const zone: PaymentZone = useMemo(
    () => getPaymentZone(clampedAmount, minimumPayment, accountState.dueBalance, accountState.totalBalance),
    [clampedAmount, minimumPayment, accountState.dueBalance, accountState.totalBalance]
  );

  // Interest projection (must be before zoneInfo)
  const interestProjection = useMemo(() => {
    if (!canPay || isZeroBalance) return 0;
    if (clampedAmount >= accountState.dueBalance) return 0;
    const remaining = accountState.dueBalance - clampedAmount;
    const days = accountState.userType === 'revolver' ? 30 : 30;
    return calculateInterestProjection(remaining, days);
  }, [accountState, clampedAmount, canPay, isZeroBalance]);

  const showInterest = interestProjection > 0;

  const zoneInfo: ZoneInfo = useMemo(() => getZoneInfo(zone), [zone]);

  const setAmount = useCallback((amount: number) => {
    setSelectedAmount(amount);
  }, []);

  const applyPreset = useCallback((state: AccountState) => {
    setAccountState(state);
    // Default to due balance
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
