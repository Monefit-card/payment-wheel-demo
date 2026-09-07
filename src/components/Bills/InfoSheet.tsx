'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { BILLS_COLORS } from './shared';

/** The two lines of the balance breakdown that need explaining. */
export type InfoKey = 'rolledOver' | 'interest';

interface InfoTopic {
  title: string;
  body: string;
}

export const INFO: Record<InfoKey, InfoTopic> = {
  rolledOver: {
    title: 'Rolled over',
    body: "When you don't pay your bill in full by the payment date, the unpaid amount rolls into next month's bill. From that moment, the balance starts accruing interest daily until it's paid off.",
  },
  interest: {
    title: 'Interest',
    body: 'Interest is charged daily on any balance that has rolled over from a previous bill. As soon as you clear the rolled-over balance, interest stops accruing. Bills paid in full each month never carry interest.',
  },
};

interface InfoSheetProps {
  /** `null` closes the sheet. */
  topic: InfoKey | null;
  onClose: () => void;
}

export function InfoSheet({ topic, onClose }: InfoSheetProps) {
  // The sheet stays mounted and slides out, so it has to keep rendering the
  // last topic through the closing transition rather than emptying instantly.
  const [lastTopic, setLastTopic] = useState<InfoKey>('rolledOver');
  if (topic && topic !== lastTopic) setLastTopic(topic);
  const info = INFO[topic ?? lastTopic];

  return (
    <Sheet isOpen={topic !== null} onClose={onClose} title={info.title}>
      <p className="m-0 text-[13px] leading-[1.5]" style={{ color: BILLS_COLORS.sheetBody }}>
        {info.body}
      </p>
    </Sheet>
  );
}
