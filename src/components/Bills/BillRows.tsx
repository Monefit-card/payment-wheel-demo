'use client';

import { COLORS } from '@/lib/constants';
import { formatEuro } from '@/lib/payment-math';
import { BillState, Txn } from '@/types/app';
import { IconChevron } from '@/components/ui/icons';
import { MerchantLogo } from '@/components/ui/MerchantLogo';
import { BILLS_COLORS } from './shared';

/* ── Label / value row ───────────────────────────────────────────────────── */

interface RowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  bold?: boolean;
  accent?: string;
  /** Renders a "?" affordance next to the label that opens an explainer. */
  onInfo?: () => void;
}

/**
 * The summary card's own row. Deliberately not `ui/DetailRow`: these rows sit
 * in a flex column with no dividers, read a size smaller, and some of them
 * carry an info affordance.
 */
export function Row({ label, value, bold = false, accent, onInfo }: RowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="inline-flex items-center gap-1.5" style={{ color: BILLS_COLORS.rowLabel }}>
        {label}
        {onInfo && <InfoButton onClick={onInfo} />}
      </span>
      <span
        className={bold ? 'font-semibold' : ''}
        style={{ color: accent ?? COLORS.textPrimary, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  );
}

export function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="More info"
      className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-semibold leading-none"
      style={{
        border: '0.5px solid rgba(19,20,23,0.25)',
        background: 'transparent',
        color: COLORS.labelMuted,
      }}
    >
      ?
    </button>
  );
}

/* ── Bill state tag ──────────────────────────────────────────────────────── */

const STATUS_TAG: Record<BillState, { background: string; color: string; label: string }> = {
  paid: { background: COLORS.flexSoft, color: COLORS.flexText, label: 'Paid' },
  due: { background: BILLS_COLORS.dueSoft, color: BILLS_COLORS.dueText, label: 'Due' },
  upcoming: { background: COLORS.hairline, color: BILLS_COLORS.rowLabel, label: 'Upcoming' },
  rolled_over: {
    background: BILLS_COLORS.rolledSoft,
    color: BILLS_COLORS.rolledText,
    label: 'Rolled over',
  },
};

export function StatusTag({ state }: { state: BillState }) {
  const tag = STATUS_TAG[state];
  return (
    <span
      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-[0.4px]"
      style={{ background: tag.background, color: tag.color }}
    >
      {tag.label}
    </span>
  );
}

/* ── Section / card scaffolding ──────────────────────────────────────────── */

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium px-1 pb-2" style={{ color: BILLS_COLORS.rowLabel }}>
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * The bordered white list container. Flatter than `ui/Card` — the Bills lists
 * are drawn with a hairline border and no shadow.
 */
export function WhiteCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-4 py-1.5"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}
    >
      {children}
    </div>
  );
}

/* ── Transaction row ─────────────────────────────────────────────────────── */

export function TxnRow({ txn }: { txn: Txn }) {
  return (
    <div className="flex items-center gap-3.5 py-3">
      <MerchantLogo icon={txn.icon} size={36} radius={12} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium" style={{ color: COLORS.textPrimary }}>
          {txn.merchant}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: COLORS.labelMuted }}>
          {txn.sub}
        </div>
      </div>
      <div className="text-right">
        {/* `display` is the merchant's own rounded figure — it wins over the
            formatted amount when the two disagree. */}
        <div className="text-[13px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {txn.display ?? formatEuro(txn.amount)}
        </div>
        {txn.fx && (
          <div className="text-[11px] mt-0.5" style={{ color: COLORS.labelMuted }}>
            {txn.fx}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Footer rows ─────────────────────────────────────────────────────────── */

export function HelpRow({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl px-4 py-3.5 flex items-center justify-between text-left"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}
    >
      <span className="text-[13px]" style={{ color: COLORS.textPrimary }}>
        Need help?
      </span>
      <IconChevron color={COLORS.labelMuted} />
    </button>
  );
}

interface InlinePayProps {
  label: string;
  onClick?: () => void;
  /** Blocked accounts get the red CTA — paying is the only way back in. */
  urgent?: boolean;
}

export function InlinePay({ label, onClick, urgent = false }: InlinePayProps) {
  return (
    <button
      onClick={onClick}
      className="w-full h-[50px] rounded-2xl text-[13px] font-semibold"
      style={{
        background: urgent ? COLORS.danger : COLORS.ctaBackground,
        color: COLORS.textWhite,
      }}
    >
      {label}
    </button>
  );
}
