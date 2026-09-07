'use client';

import { COLORS } from '@/lib/constants';

interface DetailRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Drops the divider — set it on the final row of a group. */
  last?: boolean;
}

/**
 * Label/value row inside a `Card` — plan details, fee breakdowns. Rows share
 * a hairline divider, so the last one in a group opts out of it.
 */
export function DetailRow({ label, value, last = false }: DetailRowProps) {
  return (
    <div
      className="flex items-center justify-between py-[13px]"
      style={{ borderBottom: last ? 'none' : `0.5px solid ${COLORS.divider}` }}
    >
      <span className="text-sm" style={{ color: COLORS.labelMuted }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
        {value}
      </span>
    </div>
  );
}
