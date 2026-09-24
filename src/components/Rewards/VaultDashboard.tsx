'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { MerchantLogo } from '@/components/ui/MerchantLogo';
import { ChevronRight } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import {
  CashbackLedger,
  CASHBACK_RULES,
  dayLabel,
  EarnedPurchase,
  formatLongDate,
  formatShortDate,
  MAX_CYCLE_CASHBACK,
  Payout,
  SavingsTxn,
  SavingsVault,
} from '@/lib/smartsaver';
import { eur, eurWhole } from './format';
import { SMART_SURFACE, SmartSurfaceLayers } from './SmartArt';
import { IconCashback, IconLock, IconVault, SmartSaverMark } from './icons';

const EYEBROW = 'text-[12px] font-semibold uppercase tracking-[0.06em]';

/* ── Vault hero ──────────────────────────────────────────────────────────── */

function VaultHero({ ledger, linkedAt }: { ledger: CashbackLedger; linkedAt: Date }) {
  const [whole, cents] = ledger.vaultBalance.toFixed(2).split('.');
  return (
    <div className="relative overflow-hidden rounded-[28px] px-6 pt-5 pb-6 text-white" style={SMART_SURFACE}>
      <SmartSurfaceLayers />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconVault size={18} color="rgba(255,255,255,0.8)" />
            <span className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Cashback Vault
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
          >
            <IconLock size={11} color="rgba(255,255,255,0.85)" />
            Locked
          </span>
        </div>

        <div className="flex items-baseline mt-2">
          <span className="text-[44px] leading-none font-semibold tabular-nums tracking-[-0.02em]">
            €{Number(whole).toLocaleString('en-US')}
          </span>
          <span className="text-[27px] leading-none font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>
            .{cents}
          </span>
        </div>

        <div className="mt-2 text-[14px] tabular-nums" style={{ color: COLORS.smartGain }}>
          {ledger.pending > 0
            ? `+${eur(ledger.pending)} arriving tomorrow`
            : ledger.vaultBalance === 0
              ? 'Your first cashback lands the morning after you spend'
              : 'Nothing pending — spend today, paid in tomorrow'}
        </div>

        {/* Lock period */}
        <div className="mt-6">
          <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, ledger.lockProgress * 100)}%`,
                background: `linear-gradient(90deg, ${COLORS.smartAccent}, ${COLORS.smartGain})`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[12px] tabular-nums" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span>Opened {formatShortDate(linkedAt)}</span>
            <span>
              Unlocks {formatLongDate(ledger.unlocksOn)} · {ledger.daysToUnlock} days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Cap meter ───────────────────────────────────────────────────────────── */

function CapMeter({ ledger }: { ledger: CashbackLedger }) {
  const cap = CASHBACK_RULES.cycleSpendCap;
  const share = Math.min(1, ledger.cycleCounted / cap);
  return (
    <Card radius={24} className="mt-4 px-5 pt-4 pb-5">
      <div className="flex items-baseline justify-between">
        <span className={EYEBROW} style={{ color: COLORS.textSecondary }}>
          This month
        </span>
        <span className="text-[13px] tabular-nums" style={{ color: COLORS.labelMuted }}>
          {eur(ledger.cycleCashback)} of {eur(MAX_CYCLE_CASHBACK)} earned
        </span>
      </div>

      <div className="mt-2.5 text-[17px] font-semibold tabular-nums" style={{ color: COLORS.textPrimary }}>
        {ledger.capReached ? (
          <>Cap reached for this month</>
        ) : (
          <>
            {eurWhole(ledger.cycleCounted)}{' '}
            <span style={{ color: COLORS.labelMuted, fontWeight: 500 }}>of {eurWhole(cap)} spend earning</span>
          </>
        )}
      </div>

      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: COLORS.screenSunken }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${share * 100}%`, background: ledger.capReached ? COLORS.textSecondary : COLORS.cashback }}
        />
      </div>

      <div className="mt-2.5 text-[12.5px] leading-[1.45]" style={{ color: COLORS.labelMuted }}>
        {ledger.capReached
          ? `Card purchases earn again from ${formatShortDate(ledger.cycleResetsOn)}. Your card works as normal until then.`
          : `${eurWhole(cap - ledger.cycleCounted)} left to earn on · resets ${formatShortDate(ledger.cycleResetsOn)}`}
      </div>
    </Card>
  );
}

/* ── Lists ───────────────────────────────────────────────────────────────── */

function PurchaseRow({ p }: { p: EarnedPurchase }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <MerchantLogo icon={p.icon} size={38} radius={11} />
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold truncate" style={{ color: COLORS.textPrimary }}>
          {p.merchant}
        </div>
        <div className="text-[12.5px] mt-px tabular-nums" style={{ color: COLORS.labelMuted }}>
          {eur(p.amount)}
          {p.capped && (p.cashback > 0 ? ` · ${eur(p.spendCounted)} under cap` : ' · over the cap')}
        </div>
      </div>
      <div
        className="text-[14.5px] font-semibold tabular-nums"
        style={{ color: p.cashback > 0 ? COLORS.cashbackText : COLORS.textMuted }}
      >
        {eur(p.cashback, { sign: true })}
      </div>
    </div>
  );
}

function PayoutRow({ payout, now }: { payout: Payout; now: Date }) {
  const [open, setOpen] = useState(false);
  const n = payout.purchases.length;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-5 py-3 text-left">
        <div
          className="shrink-0 w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
          style={{ background: COLORS.cashbackSoft }}
        >
          <IconCashback size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
            Paid into vault
          </div>
          <div className="text-[12.5px] mt-px" style={{ color: COLORS.labelMuted }}>
            {dayLabel(payout.date, now)} · {n} {n === 1 ? 'purchase' : 'purchases'}
          </div>
        </div>
        <div className="text-[14.5px] font-semibold tabular-nums" style={{ color: COLORS.cashbackText }}>
          {eur(payout.amount, { sign: true })}
        </div>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
          <ChevronRight size={13} color={COLORS.textMuted} />
        </span>
      </button>
      {open && (
        <div className="pb-1.5" style={{ background: '#fafafb' }}>
          {payout.purchases.map((p) => (
            <PurchaseRow key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CashbackActivity({ ledger, now }: { ledger: CashbackLedger; now: Date }) {
  if (ledger.purchases.length === 0) {
    return (
      <Card radius={24} className="px-6 py-8 text-center">
        <div
          className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: COLORS.cashbackSoft }}
        >
          <IconCashback size={24} />
        </div>
        <div className="mt-3.5 text-[16px] font-semibold" style={{ color: COLORS.textPrimary }}>
          No cashback yet
        </div>
        <p className="mt-1.5 text-[13.5px] leading-[1.45]" style={{ color: COLORS.labelMuted }}>
          Use your Monefit card and your cashback shows here straight away. It’s paid into the vault the next morning.
        </p>
      </Card>
    );
  }

  return (
    <>
      {ledger.pendingPurchases.length > 0 && (
        <>
          <div className="flex items-baseline justify-between mx-1 mb-2.5">
            <span className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>
              Arriving tomorrow
            </span>
            <span className="text-[13px] tabular-nums" style={{ color: COLORS.cashbackText }}>
              {eur(ledger.pending, { sign: true })}
            </span>
          </div>
          <Card radius={24} className="py-1.5 mb-6">
            {ledger.pendingPurchases.map((p) => (
              <PurchaseRow key={p.id} p={p} />
            ))}
          </Card>
        </>
      )}

      {ledger.payouts.length > 0 && (
        <>
          <div className="text-base font-semibold mx-1 mb-2.5" style={{ color: COLORS.textPrimary }}>
            Paid in
          </div>
          <Card radius={24} className="py-1.5 overflow-hidden">
            {ledger.payouts.map((payout) => (
              <PayoutRow key={payout.date.getTime()} payout={payout} now={now} />
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function SavingsOverview({
  ledger,
  vaults,
  txns,
  now,
}: {
  ledger: CashbackLedger;
  vaults: SavingsVault[];
  txns: SavingsTxn[];
  now: Date;
}) {
  const total = ledger.vaultBalance + vaults.reduce((s, v) => s + v.balance, 0);

  // One activity feed across the account: other vaults' movements plus the
  // Cashback Vault's daily deposits.
  const activity = [
    ...txns.map((t) => ({ id: t.id, label: t.label, vault: t.vault, amount: t.amount, date: t.date })),
    ...ledger.payouts.map((p) => ({
      id: `p${p.date.getTime()}`,
      label: 'Cashback',
      vault: 'Cashback Vault',
      amount: p.amount,
      date: p.date,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 12);

  return (
    <>
      <Card radius={24} className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <SmartSaverMark size={36} />
          <div>
            <div className={EYEBROW} style={{ color: COLORS.textSecondary }}>
              SmartSaver total
            </div>
            <div className="text-[24px] font-bold tabular-nums" style={{ color: COLORS.textPrimary }}>
              {eur(total)}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-3 py-3" style={{ borderTop: `0.5px solid ${COLORS.divider}` }}>
            <IconVault size={20} color={COLORS.textPrimary} />
            <div className="flex-1">
              <div className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
                Cashback Vault
              </div>
              <div className="text-[12.5px] flex items-center gap-1" style={{ color: COLORS.labelMuted }}>
                <IconLock size={10} color={COLORS.labelMuted} /> Until {formatLongDate(ledger.unlocksOn)}
              </div>
            </div>
            <div className="text-[14.5px] font-semibold tabular-nums" style={{ color: COLORS.textPrimary }}>
              {eur(ledger.vaultBalance)}
            </div>
          </div>
          {vaults.map((v) => (
            <div key={v.id} className="flex items-center gap-3 py-3" style={{ borderTop: `0.5px solid ${COLORS.divider}` }}>
              <IconVault size={20} color={COLORS.textSecondary} />
              <div className="flex-1">
                <div className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
                  {v.name}
                </div>
                <div className="text-[12.5px]" style={{ color: COLORS.labelMuted }}>
                  {v.kind}
                </div>
              </div>
              <div className="text-[14.5px] font-semibold tabular-nums" style={{ color: COLORS.textPrimary }}>
                {eur(v.balance)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <button
        className="w-full mt-3 flex items-center justify-between px-5 py-4 rounded-[18px]"
        style={{ background: COLORS.surface, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
      >
        <span className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
          Manage vaults in SmartSaver
        </span>
        <span className="text-[14px]" style={{ color: COLORS.textSecondary }}>
          ↗
        </span>
      </button>

      {activity.length > 0 && (
        <>
          <div className="text-base font-semibold mx-1 mt-6 mb-2.5" style={{ color: COLORS.textPrimary }}>
            Activity
          </div>
          <Card radius={24} className="py-1.5">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
                    {a.label}
                  </div>
                  <div className="text-[12.5px] mt-px" style={{ color: COLORS.labelMuted }}>
                    {a.vault} · {dayLabel(a.date, now)}
                  </div>
                </div>
                <div
                  className="text-[14.5px] font-semibold tabular-nums"
                  style={{ color: a.label === 'Cashback' ? COLORS.cashbackText : COLORS.textPrimary }}
                >
                  {eur(a.amount, { sign: true })}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

interface VaultDashboardProps {
  ledger: CashbackLedger;
  linkedAt: Date;
  vaults: SavingsVault[];
  txns: SavingsTxn[];
  now: Date;
}

/** Rewards once linked — the Cashback Vault first, the rest of SmartSaver a tap away. */
export function VaultDashboard({ ledger, linkedAt, vaults, txns, now }: VaultDashboardProps) {
  const [view, setView] = useState<'cashback' | 'savings'>('cashback');

  return (
    <>
      <VaultHero ledger={ledger} linkedAt={linkedAt} />

      {ledger.projectedAtUnlock > ledger.vaultBalance + 0.5 && (
        <div className="mt-3 mx-1 text-[13px] tabular-nums" style={{ color: COLORS.labelMuted }}>
          At this month’s pace, about{' '}
          <span className="font-semibold" style={{ color: COLORS.textPrimary }}>
            {eurWhole(ledger.projectedAtUnlock)}
          </span>{' '}
          by {formatShortDate(ledger.unlocksOn)}.
        </div>
      )}

      <CapMeter ledger={ledger} />

      {/* Segmented control */}
      <div className="mt-6 mb-4 p-1 rounded-[14px] flex" style={{ background: 'rgba(19,20,23,0.06)' }}>
        {(
          [
            ['cashback', 'Cashback'],
            ['savings', 'All savings'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="flex-1 py-2 rounded-[10px] text-[14px]"
            style={{
              background: view === key ? COLORS.surface : 'transparent',
              color: COLORS.textPrimary,
              fontWeight: view === key ? 600 : 500,
              boxShadow: view === key ? '0 1px 3px rgba(19,20,23,0.08)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'cashback' ? (
        <CashbackActivity ledger={ledger} now={now} />
      ) : (
        <SavingsOverview ledger={ledger} vaults={vaults} txns={txns} now={now} />
      )}
    </>
  );
}
