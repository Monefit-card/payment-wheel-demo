'use client';

import { IconCheck } from '@/components/ui/icons';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Sheet } from '@/components/ui/Sheet';
import { COLORS } from '@/lib/constants';

interface PlanCreatedProps {
  isOpen: boolean;
  onDone: () => void;
  zIndex?: number;
}

/**
 * Step 4 — the plan exists. The one thing worth repeating here is where the
 * money now shows up: inside the minimum due, not as a separate bill.
 */
export function PlanCreated({ isOpen, onDone, zIndex = 55 }: PlanCreatedProps) {
  return (
    <Sheet isOpen={isOpen} onClose={onDone} hideHeader zIndex={zIndex} className="text-center">
      <div
        className="flex items-center justify-center mx-auto mt-3 mb-4"
        style={{ width: 56, height: 56, borderRadius: 28, background: COLORS.flex }}
      >
        <IconCheck size={26} color={COLORS.textWhite} />
      </div>

      <div
        className="text-xl font-bold tracking-[-0.3px] mb-2"
        style={{ color: COLORS.textPrimary }}
      >
        Your plan was created
      </div>

      <div
        className="text-[13.5px] leading-[1.5] mb-[22px]"
        style={{ color: COLORS.labelMuted }}
      >
        Your monthly instalments will be included in your minimum due each month.
      </div>

      <PrimaryButton onClick={onDone}>Done</PrimaryButton>
    </Sheet>
  );
}
