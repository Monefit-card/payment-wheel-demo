'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/constants';
import { formatEuro } from '@/lib/payment-math';
import { Bill, BillState } from '@/types/app';
import { IconChevron } from '@/components/ui/icons';
import {
  HelpRow,
  InlinePay,
  Row,
  Section,
  StatusTag,
  TxnRow,
  WhiteCard,
} from './BillRows';
import { InfoKey } from './InfoSheet';
import { BILLS_COLORS } from './shared';

/**
 * Every bill's card shows the same three rows — Balance, Repaid, Payment date —
 * regardless of state. Balance always trends toward €0 as it's repaid (paid
 * bills sit at €0); it only grows again if the bill rolls over, and that shows
 * up as the "Rolled over from" sub-row once expanded, not as a different
 * headline. The chevron reveals the breakdown behind the number: Spent,
 * Rolled over from (if any), Interest (if any).
 *
 * The label reads differently per state — the amount is always
 * `outstanding`, but what it means to the user differs: a locked-in amount
 * still owed (paid/due) vs. a growing rollover balance vs. an accumulating,
 * not-yet-final total (upcoming).
 */
function balanceLabel(state: BillState): string {
  if (state === 'rolled_over') return 'Rolled over amount';
  if (state === 'upcoming') return 'Total';
  return 'Left to pay'; // paid, due
}

interface CreditSummaryProps {
  bill: Bill;
  onOpenInfo: (topic: InfoKey) => void;
  /** The bill's CTA, when it has one. */
  payButton?: React.ReactNode;
}

export function CreditSummary({ bill, onOpenInfo, payButton }: CreditSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-[20px] px-5 pt-[18px] pb-5 flex flex-col gap-3.5"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.divider}`,
        boxShadow: '0 1px 3px rgba(19,20,23,0.04)',
      }}
    >
      <div className="flex items-center gap-2">
        <StatusTag state={bill.state} />
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={expanded}
      >
        <span className="text-[15px] font-medium" style={{ color: COLORS.textPrimary }}>
          {balanceLabel(bill.state)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="text-xl font-semibold"
            style={{ color: COLORS.textPrimary, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatEuro(bill.outstanding)}
          </span>
          <IconChevron dir={expanded ? 'up' : 'down'} size={12} color={COLORS.labelMuted} />
        </span>
      </button>

      {expanded && (
        <div
          className="flex flex-col gap-2.5 py-0.5 pl-3 -mt-1.5"
          style={{ borderLeft: `2px solid ${COLORS.divider}` }}
        >
          <Row label="Spent" value={formatEuro(bill.spent)} />
          {/* Zero rows are noise — only show a line that carries an amount. */}
          {!!bill.rolledOver && (
            <Row
              label={`Rolled over from ${bill.rolledOverFrom}`}
              value={formatEuro(bill.rolledOver)}
              onInfo={() => onOpenInfo('rolledOver')}
            />
          )}
          {!!bill.interest && (
            <Row
              label="Interest"
              value={formatEuro(bill.interest)}
              onInfo={() => onOpenInfo('interest')}
            />
          )}
        </div>
      )}

      <Row label="Repaid" value={formatEuro(bill.repaid)} />
      <Row label="Payment date" value={bill.paymentDate} />
      {payButton && <div className="mt-1.5">{payButton}</div>}
    </div>
  );
}

/**
 * Blocked is an ACCOUNT state, not a bill state — the bill underneath is still
 * an ordinary 'due' bill, so the banner sits above the card rather than
 * changing it.
 */
export function BlockedBanner({ minimumPayment }: { minimumPayment: number }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 flex gap-3 items-start"
      style={{ background: COLORS.dangerSoft, border: '1px solid rgba(226,33,52,0.25)' }}
    >
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
        style={{ background: COLORS.danger, color: COLORS.textWhite }}
      >
        !
      </div>
      <div>
        <div className="text-xs font-semibold mb-0.5" style={{ color: COLORS.dangerText }}>
          Account blocked
        </div>
        <div className="text-[11px] leading-[1.45]" style={{ color: BILLS_COLORS.bannerBody }}>
          Minimum payment wasn&rsquo;t made on time. Pay at least {formatEuro(minimumPayment)} to
          reactivate your card and keep using it.
        </div>
      </div>
    </div>
  );
}

interface CreditSegmentProps {
  bill: Bill;
  /** Account-level block — only bites on the bill that's actually due. */
  accountBlocked: boolean;
  /** Fallback minimum when the bill doesn't carry its own. */
  minimumPayment: number;
  onOpenInfo: (topic: InfoKey) => void;
  onPay: () => void;
}

export function CreditSegment({
  bill,
  accountBlocked,
  minimumPayment,
  onOpenInfo,
  onPay,
}: CreditSegmentProps) {
  const isDue = bill.state === 'due';
  const blocked = accountBlocked && isDue;
  const payable = bill.outstanding > 0 && (isDue || bill.state === 'upcoming');

  return (
    <div className="flex flex-col gap-4 pt-1">
      {/* The banner names the amount that actually reactivates the card, so it
          must be the derived minimum — credit minimum PLUS due Flex
          instalments — not the bill's own `minPayment`, which is the authored
          credit-only figure and would under-state what's needed to unblock. */}
      {blocked && <BlockedBanner minimumPayment={minimumPayment} />}

      <CreditSummary
        key={bill.key}
        bill={bill}
        onOpenInfo={onOpenInfo}
        payButton={
          payable ? (
            <InlinePay
              label={blocked ? 'Pay minimum to unblock' : 'Pay'}
              urgent={blocked}
              onClick={onPay}
            />
          ) : null
        }
      />

      <Section title="Transactions">
        <WhiteCard>
          {bill.txns.map((txn) => (
            <TxnRow key={txn.id} txn={txn} />
          ))}
        </WhiteCard>
      </Section>

      <HelpRow />
    </div>
  );
}
