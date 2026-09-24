/**
 * Smart Card — card cashback paid into a SmartSaver Cashback Vault.
 *
 * Everything the Rewards surfaces show is derived here from three inputs: when
 * the accounts were linked, the card's transaction feed, and (for the demo
 * presets) a synthetic purchase history that stands in for the weeks of spend
 * the feed is too short to hold.
 *
 * The rules are TBD, so they live in one place: `CASHBACK_RULES` and
 * `cashbackRate()`. Nothing else hard-codes a rate, cap or lock period.
 */

import { Txn } from '@/types/app';
import { round2 } from '@/lib/flex-math';

/* ── Rules ───────────────────────────────────────────────────────────────── */

export const CASHBACK_RULES = {
  /** The headline "up to" rate. */
  maxRate: 0.01,
  /** Spend that earns cashback per billing cycle (16th → 15th). */
  cycleSpendCap: 1500,
  /** How long the Cashback Vault stays locked after it opens. */
  lockMonths: 6,
} as const;

/**
 * Rate for one purchase. Every purchase earns the max rate until the category
 * rules land; they slot in here, keyed on the transaction.
 */
export function cashbackRate(): number {
  return CASHBACK_RULES.maxRate;
}

/** Most cashback one cycle can earn. */
export const MAX_CYCLE_CASHBACK = round2(CASHBACK_RULES.cycleSpendCap * CASHBACK_RULES.maxRate);

/* ── Dates ───────────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86_400_000;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

/** Billing cycles run the 16th → the 15th, like the bills. */
export function cycleStart(d: Date): Date {
  return d.getDate() >= 16
    ? new Date(d.getFullYear(), d.getMonth(), 16)
    : new Date(d.getFullYear(), d.getMonth() - 1, 16);
}

/** "24 Mar 2027" */
export function formatLongDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "16 Oct" */
export function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Today", "Yesterday", or "16 Sep" — the day buckets the lists use. */
export function dayLabel(d: Date, now: Date): string {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatShortDate(d);
}

/**
 * When a feed transaction happened. The feed only carries day labels
 * ('Today', 'Yesterday', '16 Jun'), so they're resolved against `now`. A
 * 'Today, 20:47' purchase has already happened even when the demo is opened
 * at 10:00, so today's clock times are squeezed into the part of the day that
 * has passed — keeping their order, which decides who crosses the cap.
 */
export function feedTxnDate(txn: Txn, now: Date): Date {
  const [hh, mm] = (txn.time ?? '12:00').split(':').map(Number);
  let day: Date;
  if (txn.day === 'Today') day = startOfDay(now);
  else if (txn.day === 'Yesterday') day = addDays(startOfDay(now), -1);
  else {
    const [d, mon] = txn.day.split(' ');
    day = new Date(now.getFullYear(), MONTHS.indexOf(mon), Number(d));
  }
  if (txn.day !== 'Today') {
    day.setHours(hh, mm);
    return day;
  }
  const elapsed = now.getTime() - day.getTime();
  return new Date(day.getTime() + (((hh * 60 + mm) * 60_000) / DAY_MS) * elapsed);
}

/* ── Ledger ──────────────────────────────────────────────────────────────── */

export interface Purchase {
  id: string;
  merchant: string;
  icon: string;
  amount: number;
  at: Date;
  /** Set on purchases that come from the card feed. */
  feedTxnId?: string;
}

export interface EarnedPurchase extends Purchase {
  /** The part of the amount that fell under the cycle cap. */
  spendCounted: number;
  cashback: number;
  /** Some or all of the amount was over the cap. */
  capped: boolean;
  /** Cashback is paid into the vault the morning after the purchase. */
  paysOn: Date;
  paid: boolean;
}

export interface Payout {
  date: Date;
  amount: number;
  purchases: EarnedPurchase[];
}

export interface CashbackLedger {
  /** Every purchase since linking, newest first. */
  purchases: EarnedPurchase[];
  /** Daily deposits already in the vault, newest first. */
  payouts: Payout[];
  /** Today's purchases — cashback that lands tomorrow. */
  pendingPurchases: EarnedPurchase[];
  pending: number;
  vaultBalance: number;
  /** Spend this cycle, and the part of it that earned cashback. */
  cycleSpend: number;
  cycleCounted: number;
  cycleCashback: number;
  capReached: boolean;
  cycleResetsOn: Date;
  unlocksOn: Date;
  /** How far through the lock period we are, 0 → 1. */
  lockProgress: number;
  daysToUnlock: number;
  /** Vault balance at unlock if spend carries on at this cycle's pace. */
  projectedAtUnlock: number;
  /** Look-up for the feed's cashback tags. */
  byFeedTxn: Map<string, EarnedPurchase>;
}

interface BuildLedgerInput {
  linkedAt: Date;
  feed: Txn[];
  history: Purchase[];
  now: Date;
}

export function buildLedger({ linkedAt, feed, history, now }: BuildLedgerInput): CashbackLedger {
  const fromFeed: Purchase[] = feed.map((t) => ({
    id: t.id,
    merchant: t.merchant,
    icon: t.icon,
    amount: t.amount,
    at: feedTxnDate(t, now),
    feedTxnId: t.id,
  }));

  // Opt-in: only purchases made after linking earn.
  const eligible = [...history, ...fromFeed]
    .filter((p) => p.at.getTime() >= linkedAt.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const today = startOfDay(now);
  const countedPerCycle = new Map<number, number>();

  const earned: EarnedPurchase[] = eligible.map((p) => {
    const cycle = cycleStart(p.at).getTime();
    const used = countedPerCycle.get(cycle) ?? 0;
    const spendCounted = round2(Math.max(0, Math.min(p.amount, CASHBACK_RULES.cycleSpendCap - used)));
    const after = round2(used + spendCounted);
    countedPerCycle.set(cycle, after);
    const paysOn = addDays(startOfDay(p.at), 1);
    return {
      ...p,
      spendCounted,
      // Rounded on the running total, so a cycle's cashback can't round past
      // the cap's worth. Assumes one rate; per-category rates need a running
      // cashback total instead.
      cashback: round2(round2(after * cashbackRate()) - round2(used * cashbackRate())),
      capped: spendCounted < p.amount,
      paysOn,
      paid: paysOn.getTime() <= today.getTime(),
    };
  });

  const payoutsByDay = new Map<number, Payout>();
  for (const p of earned) {
    if (!p.paid || p.cashback === 0) continue;
    const key = p.paysOn.getTime();
    const payout = payoutsByDay.get(key) ?? { date: p.paysOn, amount: 0, purchases: [] };
    payout.amount = round2(payout.amount + p.cashback);
    payout.purchases.push(p);
    payoutsByDay.set(key, payout);
  }
  const payouts = [...payoutsByDay.values()].sort((a, b) => b.date.getTime() - a.date.getTime());

  const pendingPurchases = earned.filter((p) => !p.paid).reverse();
  const pending = round2(pendingPurchases.reduce((s, p) => s + p.cashback, 0));
  const vaultBalance = round2(payouts.reduce((s, p) => s + p.amount, 0));

  const thisCycle = cycleStart(now);
  const inCycle = earned.filter((p) => cycleStart(p.at).getTime() === thisCycle.getTime());
  const cycleSpend = round2(inCycle.reduce((s, p) => s + p.amount, 0));
  const cycleCounted = round2(inCycle.reduce((s, p) => s + p.spendCounted, 0));
  const cycleCashback = round2(inCycle.reduce((s, p) => s + p.cashback, 0));

  const unlocksOn = addMonths(startOfDay(linkedAt), CASHBACK_RULES.lockMonths);
  const lockSpan = unlocksOn.getTime() - startOfDay(linkedAt).getTime();
  const lockProgress = Math.min(1, Math.max(0, (now.getTime() - linkedAt.getTime()) / lockSpan));
  const daysToUnlock = Math.max(0, Math.ceil((unlocksOn.getTime() - now.getTime()) / DAY_MS));

  // Pace = this cycle's cashback per elapsed day, held to the cycle maximum.
  const cycleDays = Math.max(1, Math.round((today.getTime() - thisCycle.getTime()) / DAY_MS) + 1);
  const daily = Math.min(cycleCashback / cycleDays, MAX_CYCLE_CASHBACK / 30);
  const projectedAtUnlock = round2(vaultBalance + pending + daily * daysToUnlock);

  return {
    purchases: [...earned].reverse(),
    payouts,
    pendingPurchases,
    pending,
    vaultBalance,
    cycleSpend,
    cycleCounted,
    cycleCashback,
    capReached: cycleCounted >= CASHBACK_RULES.cycleSpendCap,
    cycleResetsOn: addMonths(thisCycle, 1),
    unlocksOn,
    lockProgress,
    daysToUnlock,
    projectedAtUnlock,
    byFeedTxn: new Map(earned.filter((p) => p.feedTxnId).map((p) => [p.feedTxnId as string, p])),
  };
}

/* ── Demo data ───────────────────────────────────────────────────────────── */

/** The SmartSaver account the card's email matches. */
export const SMARTSAVER_PROFILE = {
  name: 'John Smith',
  email: 'john.smith@gmail.com',
  maskedEmail: 'jo••••••@gmail.com',
  phone: '+372 5•••• 482',
};

export interface SavingsVault {
  id: string;
  name: string;
  kind: string;
  balance: number;
}

/** Vaults an existing SmartSaver customer already holds. */
export const EXISTING_VAULTS: SavingsVault[] = [
  { id: 'flex', name: 'Flexible Vault', kind: 'Withdraw any time', balance: 2340.18 },
  { id: 'fixed', name: 'Fixed Vault', kind: '12 months', balance: 5000 },
];

export interface SavingsTxn {
  id: string;
  label: string;
  vault: string;
  amount: number;
  date: Date;
}

/** Recent SmartSaver activity outside the Cashback Vault, relative to `now`. */
export function existingSavingsTxns(now: Date): SavingsTxn[] {
  const d = (n: number) => addDays(startOfDay(now), -n);
  return [
    { id: 's1', label: 'Interest', vault: 'Flexible Vault', amount: 7.42, date: d(3) },
    { id: 's2', label: 'Top-up', vault: 'Flexible Vault', amount: 200, date: d(9) },
    { id: 's3', label: 'Interest', vault: 'Fixed Vault', amount: 28.75, date: d(24) },
    { id: 's4', label: 'Withdrawal', vault: 'Flexible Vault', amount: -150, date: d(31) },
    { id: 's5', label: 'Top-up', vault: 'Flexible Vault', amount: 200, date: d(39) },
  ];
}

const HISTORY_MERCHANTS: [string, string][] = [
  ['Bolt Drive', 'bolt'],
  ['Amazon', 'amazon'],
  ['Kaup24.ee', 'kaup24'],
  ['Nike', 'nike'],
  ['Hugo', 'hugo'],
];

/** Small deterministic PRNG so the demo history is the same on every load. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Card purchases from the day after linking up to two days ago — the feed
 * covers yesterday and today itself. `scale` sets how heavy a spender this is.
 */
export function syntheticHistory(linkedAt: Date, now: Date, scale: number): Purchase[] {
  if (scale <= 0) return [];
  const rand = seeded(42);
  const out: Purchase[] = [];
  const last = addDays(startOfDay(now), -2);
  for (let day = addDays(startOfDay(linkedAt), 1); day <= last; day = addDays(day, 1)) {
    const count = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const [merchant, icon] = HISTORY_MERCHANTS[Math.floor(rand() * HISTORY_MERCHANTS.length)];
      const at = new Date(day);
      at.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60));
      out.push({
        id: `h${day.getTime()}_${i}`,
        merchant,
        icon,
        amount: round2((8 + rand() * 38) * scale),
        at,
      });
    }
  }
  return out;
}

/* ── Presets ─────────────────────────────────────────────────────────────── */

export type SmartSaverPresetKey =
  | 'no_account'
  | 'email_match'
  | 'linked_new'
  | 'linked_active'
  | 'linked_capped';

export interface SmartSaverPreset {
  key: SmartSaverPresetKey;
  label: string;
  caption: string;
  hasAccount: boolean;
  /** Days before now the accounts were linked; null = not linked. */
  linkedDaysAgo: number | null;
  /** Synthetic spend intensity — 0 for none. */
  historyScale: number;
}

export const SMARTSAVER_PRESETS: SmartSaverPreset[] = [
  {
    key: 'no_account',
    label: 'No SmartSaver account',
    caption: 'Card customer who has never used SmartSaver.',
    hasAccount: false,
    linkedDaysAgo: null,
    historyScale: 0,
  },
  {
    key: 'email_match',
    label: 'Account found by email',
    caption: 'SmartSaver account with the same email — needs to log in to link.',
    hasAccount: true,
    linkedDaysAgo: null,
    historyScale: 0,
  },
  {
    key: 'linked_new',
    label: 'Just linked',
    caption: 'Linked a moment ago — empty vault, nothing earned yet.',
    hasAccount: true,
    linkedDaysAgo: 0,
    historyScale: 0,
  },
  {
    key: 'linked_active',
    label: 'Linked · 3 weeks in',
    caption: 'Daily payouts landing, mid-way to the cycle cap.',
    hasAccount: true,
    linkedDaysAgo: 23,
    historyScale: 1,
  },
  {
    key: 'linked_capped',
    label: 'Linked · cap reached',
    caption: 'Heavy spender — today’s purchases cross the €1,500 cap.',
    hasAccount: true,
    linkedDaysAgo: 23,
    historyScale: 3.4,
  },
];

export const DEFAULT_SMARTSAVER_PRESET: SmartSaverPresetKey = 'email_match';
