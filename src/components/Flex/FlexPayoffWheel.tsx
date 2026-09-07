'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { COLORS, STAGE_ARC, WHEEL } from '@/lib/constants';
import {
  amountToRatio,
  getFullTrackPath,
  polarToCartesian,
  pointerToAngle,
  angleToRatio,
  ratioToAmount,
  ratioToAngle,
} from '@/lib/arc-geometry';
import { ProjectionBox } from '@/components/ui/ProjectionBox';
import { payoffStops } from '@/lib/flex-math';
import { formatEuro } from '@/lib/payment-math';
import { useHaptic } from '@/hooks/useHaptic';
import { FlexPlan } from '@/types/app';

/**
 * Paying off one plan early.
 *
 * An instalment can't be part-paid, so the ring is quantised to whole
 * instalments rather than to euros: every stop is "the next N cleared", and
 * the last one settles the plan. Every unpaid instalment is payable here,
 * including the one on this period's bill — clearing it drops out of the
 * card's minimum, since that minimum is derived from the due instalments.
 *
 * Pricing follows what has accrued. The due instalment is already billed, so
 * it costs its full scheduled amount; upcoming ones cost principal only,
 * because the interest they carry hasn't been earned yet.
 */

interface FlexPayoffWheelProps {
  plan: FlexPlan;
  onBack: () => void;
  onPay: (count: number) => void;
}

export function FlexPayoffWheel({ plan, onBack, onPay }: FlexPayoffWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const [dragging, setDragging] = useState(false);
  const lastStop = useRef<number | null>(null);
  const { snap } = useHaptic();

  const trackPath = useMemo(() => getFullTrackPath(), []);

  /** One stop per unpaid instalment — see `payoffStops`. */
  const stops = useMemo(() => payoffStops(plan), [plan]);

  const max = stops.length > 0 ? stops[stops.length - 1].amount : 0;
  const [count, setCount] = useState(stops.length);
  const current = stops.find((s) => s.count === count) ?? stops[stops.length - 1];
  const settling = current ? current.count === stops.length : false;

  const selectedRatio = max > 0 && current ? amountToRatio(current.amount, 0, max) : 0;
  const stage = settling ? STAGE_ARC.at_settlement : STAGE_ARC.between_due_total;

  const markerPos = useMemo(
    () =>
      polarToCartesian(
        WHEEL.cx,
        WHEEL.cy,
        WHEEL.radius,
        ratioToAngle(Math.min(selectedRatio, 0.999)),
      ),
    [selectedRatio],
  );

  const gradientAxis = useMemo(() => {
    const start = polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, 0);
    const end = polarToCartesian(
      WHEEL.cx,
      WHEEL.cy,
      WHEEL.radius,
      ratioToAngle(Math.min(Math.max(selectedRatio, 0.08), 0.75)),
    );
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }, [selectedRatio]);

  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    return {
      x: ((clientX - rect.left) / rect.width) * viewBox.width,
      y: ((clientY - rect.top) / rect.height) * viewBox.height,
    };
  }, []);

  /** Resolve a pointer to the nearest stop — never to a value between two. */
  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (stops.length === 0 || max <= 0) return;
      const pt = getSVGPoint(clientX, clientY);
      const amount = ratioToAmount(angleToRatio(pointerToAngle(pt.x, pt.y)), 0, max);

      let nearest = stops[0];
      for (const stop of stops) {
        if (Math.abs(stop.amount - amount) < Math.abs(nearest.amount - amount)) nearest = stop;
      }

      if (lastStop.current !== nearest.count) {
        snap();
        lastStop.current = nearest.count;
      }
      setCount(nearest.count);
    },
    [stops, max, getSVGPoint, snap],
  );

  const anchors = stops.map((stop, i) => ({
    key: stop.count,
    covered: stop.amount <= (current?.amount ?? 0) + 0.001,
    pos: polarToCartesian(
      WHEEL.cx,
      WHEEL.cy,
      WHEEL.radius,
      // The final stop closes the ring, so it sits just shy of 360° — the same
      // clamp the main wheel uses for its top anchor.
      ratioToAngle(
        i === stops.length - 1 ? 0.999 : amountToRatio(stop.amount, 0, max),
      ),
    ),
  }));

  if (stops.length === 0) {
    return (
      <FullScreenOverlay centerTitle="Repayment" onBack={onBack} zIndex={56}>
        <div className="text-center text-[14px] mt-10" style={{ color: COLORS.labelMuted }}>
          Every instalment on this plan is paid.
        </div>
      </FullScreenOverlay>
    );
  }

  return (
    <FullScreenOverlay
      centerTitle="Repayment"
      onBack={onBack}
      zIndex={56}
      footer={<PrimaryButton onClick={() => onPay(count)}>Pay</PrimaryButton>}
    >
      <div className="relative w-full max-w-[340px] mx-auto aspect-square select-none touch-none mt-4">
        <svg
          ref={svgRef}
          viewBox={WHEEL.viewBox}
          className="w-full h-full"
          onPointerDown={(e) => {
            isDragging.current = true;
            setDragging(true);
            (e.target as Element).setPointerCapture?.(e.pointerId);
            handlePointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!isDragging.current) return;
            e.preventDefault();
            handlePointer(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            isDragging.current = false;
            setDragging(false);
            lastStop.current = null;
          }}
          onPointerCancel={() => {
            isDragging.current = false;
            setDragging(false);
          }}
          style={{ cursor: 'pointer' }}
        >
          <defs>
            <linearGradient
              id="payoff-gradient"
              gradientUnits="userSpaceOnUse"
              x1={gradientAxis.x1}
              y1={gradientAxis.y1}
              x2={gradientAxis.x2}
              y2={gradientAxis.y2}
            >
              <stop offset="0%" stopColor={stage.from} />
              <stop offset="100%" stopColor={stage.to} />
            </linearGradient>
          </defs>

          <path
            d={trackPath}
            fill="none"
            stroke={COLORS.arcTrack}
            strokeWidth={WHEEL.trackStrokeWidth}
            strokeLinecap="butt"
            style={{ filter: 'drop-shadow(0 3px 8px rgba(17,17,19,0.07))' }}
          />

          {selectedRatio > 0 && (
            <path
              d={trackPath}
              fill="none"
              stroke="url(#payoff-gradient)"
              strokeWidth={WHEEL.strokeWidth}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - Math.min(selectedRatio, 0.999)}
              style={{ transition: dragging ? 'none' : 'stroke-dashoffset 0.3s ease' }}
            />
          )}

          {/* One anchor per instalment boundary */}
          {anchors.map((anchor) => (
            <circle
              key={anchor.key}
              cx={anchor.pos.x}
              cy={anchor.pos.y}
              r={WHEEL.anchorRadius}
              fill={anchor.covered ? '#000000' : COLORS.anchorIdle}
              opacity={anchor.covered ? 0.24 : 1}
            />
          ))}

          <circle
            cx={markerPos.x}
            cy={markerPos.y}
            r={dragging ? WHEEL.markerRadius + 3 : WHEEL.markerRadius}
            fill={stage.handle}
            stroke={stage.to}
            strokeWidth={2}
            style={{
              transition: dragging
                ? 'r 0.15s ease'
                : 'cx 0.3s ease, cy 0.3s ease, fill 0.3s ease, stroke 0.3s ease, r 0.15s ease',
              filter: 'drop-shadow(0 2px 6px rgba(17,17,19,0.18))',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-10">
            <div className="text-[15px]" style={{ color: COLORS.textSecondary }}>
              {count} of {stops.length} instalment{stops.length > 1 ? 's' : ''}
            </div>
            <div
              className="text-[38px] font-bold tabular-nums leading-tight mt-1"
              style={{ color: COLORS.textPrimary }}
            >
              {formatEuro(current?.amount ?? 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-1 mt-6 flex">
        <ProjectionBox label="Interest saved" amount={current?.saved ?? 0} tone="positive" />
      </div>

      <div
        className="text-xs text-center leading-[1.45] px-5 pt-6"
        style={{ color: COLORS.labelMuted }}
      >
        Paying instalments early forgives the interest they hadn&apos;t charged
        yet. Clearing this period&apos;s instalment also lowers your minimum
        payment.
      </div>
    </FullScreenOverlay>
  );
}
