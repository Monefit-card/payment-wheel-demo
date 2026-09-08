'use client';

import { useMemo, useState } from 'react';
import { buildSchedule, round2 } from '@/lib/flex-math';
import { FlexPlan, Txn } from '@/types/app';
import { FlexIntroStory } from './FlexIntroStory';
import { FlexPicker } from './FlexPicker';
import { FlexPlanDetail } from './FlexPlanDetail';
import { FlexPayoffWheel } from './FlexPayoffWheel';
import { FlexPlanList } from './FlexPlanList';
import { InstalmentChooser } from './InstalmentChooser';
import { PlanCreated } from './PlanCreated';

export type FlexMode = 'create' | 'manage';

/**
 * Steps of the create path. The instalment chooser is the last screen before
 * the plan exists — it already carries the schedule and the full cost of the
 * choice, so confirming happens there rather than on a review screen that
 * would restate it.
 */
type CreateStep = 'pick' | 'choose' | 'created';

export const DEFAULT_INSTALMENTS = 4;

export interface FlexFlowProps {
  /** 'create' opens the picker; 'manage' opens the plan list. */
  mode: FlexMode;
  /** Pre-select a transaction and skip straight to the instalment step. */
  initialTxnId?: string | null;
  /** Active plans. */
  plans: FlexPlan[];
  /** Settled + cancelled plans; each carries an `outcome`. */
  history: FlexPlan[];
  /** Flex-eligible transactions not already on a plan. */
  eligibleTxns: Txn[];
  onCreate: (input: { txnIds: string[]; n: number }) => void;
  /** Converts a plan's remaining balance back to Credit. */
  onCancelPlan: (id: string) => void;
  /** Clears the next `count` upcoming instalments early. */
  onPayoffInstalments: (id: string, count: number) => void;
  /** Account frozen for a missed minimum — blocks closing a plan. */
  accountBlocked: boolean;
  /** This period's minimum has been paid. */
  minimumPaid: boolean;
  onClose: () => void;
}

/**
 * The Flex flows, as one overlay.
 *
 * Two entry points share the same state: `create` (pick what to flex → choose
 * instalments and confirm → success) and `manage` (plans → plan detail).
 * "+ New" on the manage list crosses over into the create path, and backing
 * out of the picker returns to the list rather than dismissing the whole flow.
 */
export function FlexFlow({
  mode,
  initialTxnId,
  plans,
  history,
  eligibleTxns,
  onCreate,
  onCancelPlan,
  onPayoffInstalments,
  accountBlocked,
  minimumPaid,
  onClose,
}: FlexFlowProps) {
  const [path, setPath] = useState<FlexMode>(mode);
  const [step, setStep] = useState<CreateStep>(initialTxnId ? 'choose' : 'pick');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialTxnId ? [initialTxnId] : []),
  );
  const [n, setN] = useState(DEFAULT_INSTALMENTS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [payoffOpen, setPayoffOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);

  // One clock for the whole flow, so the schedule can't shift by a render
  // between the chooser and the plan it creates.
  const [startDate] = useState(() => new Date());

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedItems = eligibleTxns.filter((t) => selectedIds.has(t.id));
  const selectedTotal = round2(selectedItems.reduce((sum, t) => sum + t.amount, 0));

  const instalments = useMemo(
    () => (selectedTotal > 0 ? buildSchedule(selectedTotal, n, startDate, startDate) : []),
    [selectedTotal, n, startDate],
  );

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  /* ── Manage path ───────────────────────────────────────────────────────── */

  if (path === 'manage') {
    if (selectedPlan) {
      return (
        <>
          <FlexPlanDetail
            plan={selectedPlan}
            accountBlocked={accountBlocked}
            minimumPaid={minimumPaid}
            onBack={() => setSelectedPlanId(null)}
            onPayoff={() => setPayoffOpen(true)}
            onClosePlan={(id) => {
              setSelectedPlanId(null);
              onCancelPlan(id);
            }}
          />

          {payoffOpen && (
            <FlexPayoffWheel
              plan={selectedPlan}
              onBack={() => setPayoffOpen(false)}
              onPay={(count) => {
                setPayoffOpen(false);
                setSelectedPlanId(null);
                onPayoffInstalments(selectedPlan.id, count);
              }}
            />
          )}
        </>
      );
    }

    return (
      <FlexPlanList
        plans={plans}
        history={history}
        eligibleTxns={eligibleTxns}
        onOpenPlan={setSelectedPlanId}
        onNew={() => {
          setStep('pick');
          setPath('create');
        }}
        onBack={onClose}
      />
    );
  }

  /* ── Create path ───────────────────────────────────────────────────────── */

  // Backing out of the picker returns to the plan list when that's where the
  // flow started; otherwise it leaves Flex entirely.
  const leavePicker = () => (mode === 'manage' ? setPath('manage') : onClose());

  // A deep-linked transaction skipped the picker, so its back gesture has to
  // skip it too rather than stranding the user on a step they never saw.
  const leaveChooser = () => (initialTxnId ? onClose() : setStep('pick'));

  return (
    <>
      {step === 'pick' && (
        <FlexPicker
          txns={eligibleTxns}
          selectedIds={selectedIds}
          onToggle={toggle}
          onBack={leavePicker}
          onContinue={() => setStep('choose')}
        />
      )}

      {/* Stays mounted through 'created' so the success sheet slides up over
          the screen the plan was confirmed on. */}
      {(step === 'choose' || step === 'created') && (
        <InstalmentChooser
          items={selectedItems}
          total={selectedTotal}
          n={n}
          onChangeN={setN}
          instalments={instalments}
          onBack={leaveChooser}
          onConfirm={() => setStep('created')}
        />
      )}

      {(step === 'choose' || step === 'created') && (
        <PlanCreated
          isOpen={step === 'created'}
          onDone={() => {
            onCreate({ txnIds: selectedItems.map((t) => t.id), n });
            onClose();
          }}
        />
      )}

      {introOpen && <FlexIntroStory onDone={() => setIntroOpen(false)} zIndex={65} />}
    </>
  );
}
