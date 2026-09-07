'use client';

import { motion } from 'motion/react';
import { COLORS } from '@/lib/constants';
import { formatEuro } from '@/lib/payment-math';

interface ProjectionBoxProps {
  label: string;
  amount: number;
  /** 'positive' colours the figure as money kept rather than money charged. */
  tone?: 'default' | 'positive';
}

/**
 * The figure that sits under a wheel — what this payment does to interest.
 * Label and amount only; the label carries any qualifier so the box stays two
 * lines whatever the value. Keyed on the amount so it fades on change.
 */
export function ProjectionBox({ label, amount, tone = 'default' }: ProjectionBoxProps) {
  const positive = tone === 'positive' && amount > 0;
  return (
    <div
      className="flex-1 rounded-2xl px-3.5 py-3"
      style={{ background: COLORS.surface }}
    >
      <div
        className="text-[12px] whitespace-nowrap"
        style={{ color: COLORS.textSecondary }}
      >
        {label}
      </div>
      <motion.div
        key={amount}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-[19px] font-bold tabular-nums mt-0.5"
        style={{ color: positive ? COLORS.flexText : COLORS.textPrimary }}
      >
        {formatEuro(amount)}
      </motion.div>
    </div>
  );
}
