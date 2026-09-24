'use client';

import { useCallback, useMemo, useState } from 'react';
import { Txn } from '@/types/app';
import {
  addDays,
  buildLedger,
  CashbackLedger,
  DEFAULT_SMARTSAVER_PRESET,
  EXISTING_VAULTS,
  existingSavingsTxns,
  SavingsTxn,
  SavingsVault,
  SMARTSAVER_PRESETS,
  SmartSaverPresetKey,
  syntheticHistory,
} from '@/lib/smartsaver';

/**
 * The card ↔ SmartSaver link. Separate from `useAppState` because it's a
 * second product's account: the card scenario (bills, Flex) and the SmartSaver
 * state vary independently in the admin panel.
 */

export type SmartSaverStatus = 'no_account' | 'email_match' | 'linked';

export function useSmartSaver(feed: Txn[]) {
  // One fixed "now" per session, so every figure agrees with every other.
  const [now] = useState(() => new Date());

  const [presetKey, setPresetKey] = useState<SmartSaverPresetKey>(DEFAULT_SMARTSAVER_PRESET);
  const [hasAccount, setHasAccount] = useState(true);
  /** Opened from inside the card app — so it holds only the Cashback Vault. */
  const [openedInApp, setOpenedInApp] = useState(false);
  const [linkedAt, setLinkedAt] = useState<Date | null>(null);
  const [historyScale, setHistoryScale] = useState(0);

  const applyPreset = useCallback(
    (key: SmartSaverPresetKey) => {
      const preset = SMARTSAVER_PRESETS.find((p) => p.key === key);
      if (!preset) return;
      setPresetKey(key);
      setHasAccount(preset.hasAccount);
      setOpenedInApp(false);
      setHistoryScale(preset.historyScale);
      setLinkedAt(
        preset.linkedDaysAgo === null
          ? null
          : preset.linkedDaysAgo === 0
            ? new Date()
            : addDays(now, -preset.linkedDaysAgo),
      );
    },
    [now],
  );

  const status: SmartSaverStatus = linkedAt ? 'linked' : hasAccount ? 'email_match' : 'no_account';

  /** Log in to the existing account and link it. Cashback starts now. */
  const link = useCallback(() => {
    setHistoryScale(0);
    setLinkedAt(new Date());
  }, []);

  /** Open a SmartSaver account from the card app, linked from the start. */
  const openAndLink = useCallback(() => {
    setHasAccount(true);
    setOpenedInApp(true);
    setHistoryScale(0);
    setLinkedAt(new Date());
  }, []);

  /** Stop future cashback. The vault keeps its balance and its lock. */
  const unlink = useCallback(() => setLinkedAt(null), []);

  const history = useMemo(
    () => (linkedAt ? syntheticHistory(linkedAt, now, historyScale) : []),
    [linkedAt, now, historyScale],
  );

  const ledger: CashbackLedger | null = useMemo(
    () => (linkedAt ? buildLedger({ linkedAt, feed, history, now }) : null),
    [linkedAt, feed, history, now],
  );

  const otherVaults: SavingsVault[] = hasAccount && !openedInApp ? EXISTING_VAULTS : [];
  const otherTxns: SavingsTxn[] = useMemo(
    () => (hasAccount && !openedInApp ? existingSavingsTxns(now) : []),
    [hasAccount, openedInApp, now],
  );

  return {
    now,
    presetKey,
    status,
    linkedAt,
    ledger,
    otherVaults,
    otherTxns,
    applyPreset,
    link,
    openAndLink,
    unlink,
  };
}

export type SmartSaverState = ReturnType<typeof useSmartSaver>;
