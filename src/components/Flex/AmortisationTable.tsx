'use client';

import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { IconChevron, IconReceipt } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { amortisationRows, calcPlan } from '@/lib/flex-math';
import { formatEuro } from '@/lib/payment-math';

interface AmortisationTableProps {
  /** Principal being split — the summed transaction amounts. */
  amount: number;
  /** Number of instalments. */
  n: number;
  /** Plan start date; defaults to today, matching a plan created right now. */
  startDate?: Date;
  onBack: () => void;
  zIndex?: number;
}

/**
 * The full per-instalment breakdown.
 *
 * Six numeric columns do not fit a 390pt frame without becoming unreadable, so
 * each instalment is its own block: the payment as the headline, and
 * principal / interest / remaining balance as a labelled three-up beneath it.
 * Everything numeric is tabular so the columns line up down the page.
 */
export function AmortisationTable({
  amount,
  n,
  startDate,
  onBack,
  zIndex = 60,
}: AmortisationTableProps) {
  const rows = amortisationRows(amount, n, startDate ?? new Date());
  const { interest, total } = calcPlan(amount, n);

  return (
    <FullScreenOverlay centerTitle="Amortisation table" onBack={onBack} zIndex={zIndex}>
      <Card className="px-4 mt-3.5">
        <DetailRow label="Amount to split" value={formatEuro(amount)} />
        <DetailRow label="Total interest" value={formatEuro(interest)} />
        <DetailRow label="Total to repay" value={formatEuro(total)} last />
      </Card>

      <div
        className="text-[13px] font-bold mx-1 mt-5 mb-2"
        style={{ color: COLORS.textPrimary }}
      >
        {n} instalments
      </div>

      <Card className="px-4 py-1">
        {rows.map((row, i) => (
          <div
            key={row.n}
            className="py-3.5"
            style={{
              borderBottom:
                i === rows.length - 1 ? 'none' : `0.5px solid ${COLORS.divider}`,
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2 min-w-0">
                <span
                  className="text-[13px] font-bold tabular-nums"
                  style={{ color: COLORS.labelMuted }}
                >
                  {String(row.n).padStart(2, '0')}
                </span>
                <span
                  className="text-[15px] font-semibold truncate"
                  style={{ color: COLORS.textPrimary }}
                >
                  {row.date}
                </span>
              </div>
              <span
                className="text-[15px] font-semibold tabular-nums shrink-0"
                style={{ color: COLORS.textPrimary }}
              >
                {formatEuro(row.payment)}
              </span>
            </div>

            <div className="flex gap-2 mt-2.5">
              <AmortCell label="Principal" value={formatEuro(row.principal)} />
              <AmortCell label="Interest" value={formatEuro(row.interest)} />
              <AmortCell label="Balance" value={formatEuro(row.balance)} />
            </div>
          </div>
        ))}
      </Card>

      <div
        className="text-xs text-center leading-[1.45] px-3 pt-4 pb-2"
        style={{ color: COLORS.labelMuted }}
      >
        Interest is charged monthly on the balance still outstanding, so the
        share of each payment going to principal grows over the term.
      </div>
    </FullScreenOverlay>
  );
}

/**
 * The row that opens the table. Lives on both the review step and a plan's
 * detail screen, so it ships with the table rather than being copied twice.
 */
export function AmortisationLink({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`w-full text-left cursor-pointer ${className}`}>
      <Card className="flex items-center gap-3 px-4 py-[15px]">
        <IconReceipt size={20} color={COLORS.textPrimary} />
        <span className="flex-1 text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
          Amortisation table
        </span>
        <IconChevron dir="right" size={14} color={COLORS.labelMuted} />
      </Card>
    </button>
  );
}

function AmortCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.6px]"
        style={{ color: COLORS.labelMuted }}
      >
        {label}
      </div>
      <div
        className="text-[13.5px] font-medium tabular-nums mt-0.5"
        style={{ color: COLORS.textPrimary }}
      >
        {value}
      </div>
    </div>
  );
}
