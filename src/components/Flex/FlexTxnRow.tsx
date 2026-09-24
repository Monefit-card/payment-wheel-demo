'use client';

import { IconFlex } from '@/components/ui/icons';
import { MerchantLogo } from '@/components/ui/MerchantLogo';
import { COLORS } from '@/lib/constants';
import { Txn } from '@/types/app';
import { CashbackTag } from '@/components/Rewards/CashbackTag';
import { EarnedPurchase } from '@/lib/smartsaver';
import { txnAmount } from './format';

/**
 * "Flex available" — the small CTA that deep-links into the instalment picker
 * with this transaction pre-selected.
 *
 * Discovery deliberately lives here, at the transaction level, rather than in
 * the Flex widget on Home: the widget stays state-agnostic (one shape to
 * design and reason about), and the question "can I split *this* purchase?"
 * is answered where the purchase is.
 */
export function FlexChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-[5px] pl-2 pr-[11px] py-1.5 rounded-[9px] text-xs font-medium cursor-pointer"
      style={{ background: '#EEEEF0', color: COLORS.textPrimary }}
    >
      <IconFlex size={13} color={COLORS.textPrimary} /> Flex available
    </button>
  );
}

/**
 * Non-interactive marker for a transaction already on a plan — same icon as
 * the chip, muted, no action. The plan itself is managed from Flex.
 */
export function FlexedTag() {
  return (
    <span
      className="inline-flex items-center gap-[5px] pl-2 pr-[11px] py-1.5 rounded-[9px] text-xs font-medium"
      style={{ background: '#F2F7F3', color: COLORS.flex }}
    >
      <IconFlex size={13} color={COLORS.flex} /> Flexed
    </span>
  );
}

interface FlexTxnRowProps {
  txn: Txn;
  /** Opens the Flex create flow with this transaction pre-selected. */
  onFlex: (txnId: string) => void;
  /** Drop the day from the sub line — for day-sectioned lists. */
  timeOnly?: boolean;
  /** Flex-eligible and not yet on a plan. Wins over `eligibleIds`. */
  eligible?: boolean;
  /** Already on an active plan. Wins over `flexedIds`. */
  flexed?: boolean;
  /**
   * Set form of the two flags above, for callers rendering a whole list from
   * one pair of sets (`flexedTxnIds()` produces the second).
   */
  eligibleIds?: ReadonlySet<string>;
  flexedIds?: ReadonlySet<string>;
  /**
   * Smart Card cashback, keyed by transaction id. Only purchases made after
   * the SmartSaver link are in it, so older rows show nothing.
   */
  cashbackByTxn?: ReadonlyMap<string, EarnedPurchase>;
}

/**
 * One transaction row — logo, merchant + time, amount (with its optional
 * foreign-currency line), and either the Flex chip or the "Flexed" marker
 * underneath.
 */
export function FlexTxnRow({
  txn,
  onFlex,
  timeOnly = false,
  eligible: eligibleProp,
  flexed: flexedProp,
  eligibleIds,
  flexedIds,
  cashbackByTxn,
}: FlexTxnRowProps) {
  const cashback = cashbackByTxn?.get(txn.id);
  const eligible = eligibleProp ?? eligibleIds?.has(txn.id) ?? false;
  const flexed = flexedProp ?? flexedIds?.has(txn.id) ?? false;

  return (
    <div className="px-5 py-[13px]">
      <div className="flex items-center gap-3.5">
        <MerchantLogo icon={txn.icon} size={46} />
        <div className="flex-1 min-w-0">
          <div className="text-[15.5px] font-semibold truncate" style={{ color: COLORS.textPrimary }}>
            {txn.merchant}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: COLORS.labelMuted }}>
            {timeOnly ? (txn.time ?? txn.sub) : txn.sub}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[15.5px] tabular-nums" style={{ color: COLORS.textPrimary }}>
            {txnAmount(txn)}
          </div>
          {txn.fx && (
            <div className="text-[12.5px] mt-0.5" style={{ color: COLORS.labelMuted }}>
              {txn.fx}
            </div>
          )}
          {cashback && <CashbackTag purchase={cashback} />}
        </div>
      </div>

      {eligible && (
        <div className="mt-[9px]">
          <FlexChip onClick={() => onFlex(txn.id)} />
        </div>
      )}

      {flexed && (
        <div className="mt-[9px]">
          <FlexedTag />
        </div>
      )}
    </div>
  );
}
