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
  SavingsTxn,
  SavingsVault,
} from '@/lib/smartsaver';
import { eur, eurWhole } from './format';
import { SMART_SURFACE, SmartSurfaceLayers } from './SmartArt';
import { IconLock } from './icons';

const ROW_TITLE = 'text-[14.5px] font-semibold';
const ROW_SUB = 'text-[12.5px] mt-px';

/* ── Vault hero ──────────────────────────────────────────────────────────── */

/** Balance, what lands tomorrow, and how far through the lock we are. */
function VaultHero({ ledger }: { ledger: CashbackLedger }) {
  const [whole, cents] = ledger.vaultBalance.toFixed(2).split('.');
  return (
    <div className="relative overflow-hidden rounded-[28px] px-6 pt-5 pb-6 text-white" style={SMART_SURFACE}>
      <SmartSurfaceLayers />
      <div className="relative">
        <div className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Cashback Vault
        </div>

        <div className="flex items-baseline mt-2">
          <span className="text-[44px] leading-none font-semibold tabular-nums tracking-[-0.02em]">
            €{Number(whole).toLocaleString('en-US')}
          </span>
          <span className="text-[27px] leading-none font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>
            .{cents}
          </span>
        </div>

        {ledger.pending > 0 && (
          <div className="mt-2 text-[14px] tabular-nums" style={{ color: COLORS.smartGain }}>
            +{eur(ledger.pending)} tomorrow
          </div>
        )}

        <div className="mt-6 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(2, ledger.lockProgress * 100)}%`,
              background: `linear-gradient(90deg, ${COLORS.smartAccent}, ${COLORS.smartGain})`,
            }}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
          <IconLock size={11} color="rgba(255,255,255,0.55)" />
          Unlocks {formatLongDate(ledger.unlocksOn)}
        </div>
      </div>
    </div>
  );
}

/* ── Cap meter ───────────────────────────────────────────────────────────── */

function CapMeter({ ledger }: { ledger: CashbackLedger }) {
  const cap = CASHBACK_RULES.cycleSpendCap;
  return (
    <Card radius={20} className="mt-3 px-5 py-4">
      <div className="text-[14px] tabular-nums" style={{ color: COLORS.labelMuted }}>
        {ledger.capReached ? (
          <>Monthly cap reached · resets {formatShortDate(ledger.cycleResetsOn)}</>
        ) : (
          <>
            <span className="font-semibold" style={{ color: COLORS.textPrimary }}>
              {eurWhole(ledger.cycleCounted)}
            </span>{' '}
            of {eurWhole(cap)} earning this month
          </>
        )}
      </div>
      <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.screenSunken }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(1, ledger.cycleCounted / cap) * 100}%`,
            background: ledger.capReached ? COLORS.textSecondary : COLORS.cashback,
          }}
        />
      </div>
    </Card>
  );
}

/* ── Cashback list ───────────────────────────────────────────────────────── */

function PurchaseRow({ p }: { p: EarnedPurchase }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <MerchantLogo icon={p.icon} size={32} radius={9} />
      <div className="flex-1 min-w-0 text-[14px] truncate" style={{ color: COLORS.textPrimary }}>
        {p.merchant}
      </div>
      <div className="text-[14px] tabular-nums" style={{ color: p.cashback > 0 ? COLORS.cashbackText : COLORS.textMuted }}>
        {eur(p.cashback, { sign: true })}
      </div>
    </div>
  );
}

/** One day's deposit — or tomorrow's, still pending. Opens to its purchases. */
function DayRow({ label, amount, purchases }: { label: string; amount: number; purchases: EarnedPurchase[] }) {
  const [open, setOpen] = useState(false);
  const n = purchases.length;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-5 py-3 text-left">
        <div className="flex-1 min-w-0">
          <div className={ROW_TITLE} style={{ color: COLORS.textPrimary }}>
            {label}
          </div>
          <div className={ROW_SUB} style={{ color: COLORS.labelMuted }}>
            {n} {n === 1 ? 'purchase' : 'purchases'}
          </div>
        </div>
        <div className={`${ROW_TITLE} tabular-nums`} style={{ color: COLORS.cashbackText }}>
          {eur(amount, { sign: true })}
        </div>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
          <ChevronRight size={13} color={COLORS.textMuted} />
        </span>
      </button>
      {open && (
        <div className="pb-1.5" style={{ background: '#fafafb' }}>
          {purchases.map((p) => (
            <PurchaseRow key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CashbackList({ ledger, now }: { ledger: CashbackLedger; now: Date }) {
  if (ledger.purchases.length === 0) {
    return (
      <div className="text-center text-[14px] py-8" style={{ color: COLORS.labelMuted }}>
        Cashback from card purchases shows up here.
      </div>
    );
  }
  return (
    <Card radius={24} className="py-1.5 overflow-hidden">
      {ledger.pendingPurchases.length > 0 && (
        <DayRow label="Tomorrow" amount={ledger.pending} purchases={ledger.pendingPurchases} />
      )}
      {ledger.payouts.map((p) => (
        <DayRow key={p.date.getTime()} label={dayLabel(p.date, now)} amount={p.amount} purchases={p.purchases} />
      ))}
    </Card>
  );
}

/* ── All savings ─────────────────────────────────────────────────────────── */

function SavingsList({
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
  const rows = [{ id: 'cashback', name: 'Cashback Vault', balance: ledger.vaultBalance }, ...vaults];

  // One feed across the account: other vaults' movements plus the Cashback
  // Vault's daily deposits.
  const activity = [
    ...txns,
    ...ledger.payouts.map((p) => ({
      id: `p${p.date.getTime()}`,
      label: 'Cashback',
      vault: 'Cashback Vault',
      amount: p.amount,
      date: p.date,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return (
    <>
      <Card radius={24} className="py-1.5">
        {rows.map((v) => (
          <div key={v.id} className="flex justify-between px-5 py-3">
            <span className={ROW_TITLE} style={{ color: COLORS.textPrimary }}>
              {v.name}
            </span>
            <span className={`${ROW_TITLE} tabular-nums`} style={{ color: COLORS.textPrimary }}>
              {eur(v.balance)}
            </span>
          </div>
        ))}
      </Card>

      {activity.length > 0 && (
        <Card radius={24} className="mt-3 py-1.5">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className={ROW_TITLE} style={{ color: COLORS.textPrimary }}>
                  {a.label}
                </div>
                <div className={ROW_SUB} style={{ color: COLORS.labelMuted }}>
                  {a.vault} · {dayLabel(a.date, now)}
                </div>
              </div>
              <div
                className={`${ROW_TITLE} tabular-nums`}
                style={{ color: a.label === 'Cashback' ? COLORS.cashbackText : COLORS.textPrimary }}
              >
                {eur(a.amount, { sign: true })}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

interface VaultDashboardProps {
  ledger: CashbackLedger;
  vaults: SavingsVault[];
  txns: SavingsTxn[];
  now: Date;
}

/** Rewards once linked — the Cashback Vault first, the rest of SmartSaver a tap away. */
export function VaultDashboard({ ledger, vaults, txns, now }: VaultDashboardProps) {
  const [view, setView] = useState<'cashback' | 'savings'>('cashback');

  return (
    <>
      <VaultHero ledger={ledger} />
      <CapMeter ledger={ledger} />

      <div className="mt-6 mb-3 p-1 rounded-[14px] flex" style={{ background: 'rgba(19,20,23,0.06)' }}>
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
        <CashbackList ledger={ledger} now={now} />
      ) : (
        <SavingsList ledger={ledger} vaults={vaults} txns={txns} now={now} />
      )}
    </>
  );
}
