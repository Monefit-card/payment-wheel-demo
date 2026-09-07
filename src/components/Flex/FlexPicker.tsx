'use client';

import { Card } from '@/components/ui/Card';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { IconCheck } from '@/components/ui/icons';
import { MerchantLogo } from '@/components/ui/MerchantLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { COLORS } from '@/lib/constants';
import { Txn } from '@/types/app';
import { groupTxnsByDay, txnAmount } from './format';

/* ── Row ─────────────────────────────────────────────────────────────────── */

interface FlexPickRowProps {
  txn: Txn;
  selected: boolean;
  onToggle: () => void;
}

/**
 * One pickable transaction. Selection is multi-select — any combination of
 * eligible purchases can be flexed together into a single plan — so the
 * control is a checkbox rather than a radio.
 */
export function FlexPickRow({ txn, selected, onToggle }: FlexPickRowProps) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className="w-full text-left flex items-center gap-[13px] px-4 py-[13px] cursor-pointer"
    >
      <MerchantLogo icon={txn.icon} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold truncate" style={{ color: COLORS.textPrimary }}>
          {txn.merchant}
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: COLORS.labelMuted }}>
          {txn.time ?? txn.sub}
        </div>
      </div>
      <div className="text-[15px] tabular-nums" style={{ color: COLORS.textPrimary }}>
        {txnAmount(txn)}
      </div>
      <div
        className="flex items-center justify-center shrink-0 ml-1"
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          border: selected ? 'none' : '1.8px solid rgba(19,20,23,0.18)',
          background: selected ? COLORS.ctaBackground : 'transparent',
        }}
      >
        {selected && <IconCheck size={12} color={COLORS.textWhite} />}
      </div>
    </button>
  );
}

/* ── Screen ──────────────────────────────────────────────────────────────── */

interface FlexPickerProps {
  /** Flex-eligible transactions not already on an active plan. */
  txns: Txn[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 1 — pick what to flex. Day-sectioned, multi-select. */
export function FlexPicker({
  txns,
  selectedIds,
  onToggle,
  onBack,
  onContinue,
}: FlexPickerProps) {
  const groups = groupTxnsByDay(txns);
  const count = selectedIds.size;

  return (
    <FullScreenOverlay
      centerTitle="Select transactions"
      onBack={onBack}
      footer={
        <PrimaryButton disabled={count === 0} onClick={onContinue}>
          Select
        </PrimaryButton>
      }
    >
      {groups.length === 0 && (
        <Card className="px-4 py-7 text-center text-[13px] mt-3.5" style={{ color: COLORS.labelMuted }}>
          No purchases are eligible for Flex right now.
        </Card>
      )}

      {groups.map((group, gi) => (
        <div key={group.day}>
          <div
            className={`text-base font-semibold mx-1 mb-2.5 ${gi === 0 ? 'mt-3.5' : 'mt-6'}`}
            style={{ color: COLORS.textPrimary }}
          >
            {group.day}
          </div>
          <Card className="overflow-hidden py-1">
            {group.items.map((txn) => (
              <FlexPickRow
                key={txn.id}
                txn={txn}
                selected={selectedIds.has(txn.id)}
                onToggle={() => onToggle(txn.id)}
              />
            ))}
          </Card>
        </div>
      ))}
    </FullScreenOverlay>
  );
}
