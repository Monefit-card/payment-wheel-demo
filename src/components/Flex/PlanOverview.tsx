'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { IconChevron } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { formatInstalmentDue, round2 } from '@/lib/flex-math';
import { formatEuro } from '@/lib/payment-math';
import { Instalment } from '@/types/app';

/* ── Timeline row ────────────────────────────────────────────────────────── */

interface PlanRowProps {
  /** Green dot — the instalment that is live this period (or already paid). */
  active?: boolean;
  title: React.ReactNode;
  sub: React.ReactNode;
  amount: React.ReactNode;
  /** Draws the connector down to the next row. */
  line?: boolean;
  onClick?: () => void;
  chevron?: 'up' | 'down';
}

export function PlanRow({ active = false, title, sub, amount, line = false, onClick, chevron }: PlanRowProps) {
  const body = (
    <>
      <div
        className="flex flex-col items-center self-stretch shrink-0"
        style={{ width: 18 }}
      >
        <div
          className="flex items-center justify-center shrink-0 mt-px"
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: active ? COLORS.flexSoft : 'transparent',
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 4.5,
              background: active ? COLORS.flex : '#A9A9AF',
            }}
          />
        </div>
        {line && (
          <div
            className="flex-1 my-[7px]"
            style={{ width: 3, borderRadius: 2, background: 'rgba(19,20,23,0.15)' }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0" style={{ paddingBottom: line ? 22 : 0 }}>
        <div
          className="flex items-center gap-1.5 text-[15px] font-semibold"
          style={{ color: COLORS.textPrimary }}
        >
          {title}
          {chevron && <IconChevron dir={chevron} size={12} color={COLORS.labelMuted} />}
        </div>
        <div className="text-[12.5px] mt-[3px]" style={{ color: COLORS.labelMuted }}>
          {sub}
        </div>
      </div>

      <div className="text-[15px] font-semibold shrink-0" style={{ color: COLORS.textPrimary }}>
        {amount}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex gap-3.5 w-full text-left cursor-pointer">
        {body}
      </button>
    );
  }

  return <div className="flex gap-3.5 w-full text-left">{body}</div>;
}

/* ── Timeline ────────────────────────────────────────────────────────────── */

interface PlanOverviewProps {
  /** The full schedule — `buildSchedule(...)` when creating, `plan.instalments` when managing. */
  instalments: Instalment[];
  /**
   * Label for the first row. 'First instalment' while creating a plan;
   * 'Next instalment' on a running one, where earlier instalments are paid.
   */
  firstLabel?: string;
}

/**
 * The instalment timeline. First and final instalments are always visible;
 * everything between them collapses into a single "Nx instalments" row that
 * expands on tap — a 12-month plan otherwise buries the two dates that
 * actually matter under ten identical ones.
 */
export function PlanOverview({
  instalments,
  firstLabel = 'First instalment',
}: PlanOverviewProps) {
  const [open, setOpen] = useState(false);

  if (instalments.length === 0) return null;

  const first = instalments[0];
  const final = instalments[instalments.length - 1];
  const middle = instalments.slice(1, -1);
  const isActive = (i: Instalment) => i.state === 'due' || i.state === 'paid';
  const middleTotal = round2(middle.reduce((sum, i) => sum + i.amount, 0));

  return (
    <Card className="px-4 py-[18px]">
      <PlanRow
        active={isActive(first)}
        line={instalments.length > 1}
        title={firstLabel}
        sub={`Due ${formatInstalmentDue(first.date)}`}
        amount={formatEuro(first.amount)}
      />

      {middle.length > 0 &&
        (open ? (
          middle.map((instalment, i) => (
            <PlanRow
              key={instalment.n}
              line
              active={isActive(instalment)}
              title={`Instalment ${instalment.n}`}
              sub={`Due ${formatInstalmentDue(instalment.date)}`}
              amount={formatEuro(instalment.amount)}
              onClick={() => setOpen(false)}
              chevron={i === 0 ? 'up' : undefined}
            />
          ))
        ) : (
          <PlanRow
            line
            title={`${middle.length}x instalment${middle.length > 1 ? 's' : ''}`}
            sub="Due by the 15th of following months"
            amount={formatEuro(middleTotal)}
            onClick={() => setOpen(true)}
            chevron="down"
          />
        ))}

      {instalments.length > 1 && (
        <PlanRow
          active={isActive(final)}
          title="Final instalment"
          sub={`Due ${formatInstalmentDue(final.date)}`}
          amount={formatEuro(final.amount)}
        />
      )}
    </Card>
  );
}

/* ── Compact two-line schedule summary ───────────────────────────────────── */

interface ScheduleItemProps {
  color: string;
  title: React.ReactNode;
  sub: React.ReactNode;
  line?: boolean;
}

/** The condensed "this statement / scheduled" summary used on review + detail. */
export function ScheduleItem({ color, title, sub, line = false }: ScheduleItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div style={{ width: 10, height: 10, borderRadius: 5, background: color, marginTop: 3 }} />
        {line && (
          <div className="flex-1 my-0.5" style={{ width: 2, background: 'rgba(19,20,23,0.12)' }} />
        )}
      </div>
      <div style={{ paddingBottom: line ? 16 : 0 }}>
        <div className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
          {title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: COLORS.labelMuted }}>
          {sub}
        </div>
      </div>
    </div>
  );
}
