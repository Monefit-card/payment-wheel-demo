'use client';

import { useRef, useCallback, useMemo } from 'react';
import { WHEEL, COLORS } from '@/lib/constants';
import {
  getFullTrackPath,
  polarToCartesian,
  ratioToAngle,
  pointerToAngle,
  angleToRatio,
  amountToRatio,
  ratioToAmount,
  getArcColor,
  describeArc,
} from '@/lib/arc-geometry';
import { useHaptic } from '@/hooks/useHaptic';
import { AccountState } from '@/types/payment';

const DOT_R = 7;

interface WheelSVGProps {
  accountState: AccountState;
  selectedAmount: number;
  minimumPayment: number;
  isZeroBalance: boolean;
  onAmountChange: (amount: number) => void;
}

export function WheelSVG({
  accountState,
  selectedAmount,
  minimumPayment,
  isZeroBalance,
  onAmountChange,
}: WheelSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastAngle = useRef<number | null>(null);
  const { snap, tick } = useHaptic();
  const lastSnap = useRef<string | null>(null);

  const trackPath = useMemo(() => getFullTrackPath(), []);
  const { totalBalance, dueBalance, isCardBlocked } = accountState;
  const isDisabled = isZeroBalance;

  const minRatio = totalBalance > 0 ? amountToRatio(minimumPayment, 0, totalBalance) : 0;
  const dueRatio = totalBalance > 0 ? amountToRatio(dueBalance, 0, totalBalance) : 0;
  const selectedRatio = totalBalance > 0 ? amountToRatio(selectedAmount, 0, totalBalance) : 0;

  const arcColor = useMemo(
    () => getArcColor(selectedRatio, minRatio, dueRatio),
    [selectedRatio, minRatio, dueRatio]
  );

  const markerPos = useMemo(() => {
    const angle = ratioToAngle(Math.min(selectedRatio, 0.999));
    return polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, angle);
  }, [selectedRatio]);

  const minPos = useMemo(() =>
    polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, ratioToAngle(minRatio)),
  [minRatio]);

  const duePos = useMemo(() =>
    polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, ratioToAngle(dueRatio)),
  [dueRatio]);

  const totalPos = useMemo(() =>
    polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, ratioToAngle(0.999)),
  []);

  const hasDistinctMin = minimumPayment < dueBalance - (totalBalance * 0.04);
  const hasDueMilestone = dueBalance < totalBalance;

  // Curved text path for "CARD BALANCE" — arc hugging the inside top of the wheel
  const balanceTextPath = useMemo(() => {
    const r = WHEEL.radius - WHEEL.strokeWidth / 2 - 20; // inside the ring
    const cx = WHEEL.cx;
    const cy = WHEEL.cy;
    // Clockwise arc across the top so text reads left-to-right
    return describeArc(300, 420, cx, cy, r);
  }, []);

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

  const handlePointerToAmount = useCallback((clientX: number, clientY: number) => {
    const pt = getSVGPoint(clientX, clientY);
    const rawAngle = pointerToAngle(pt.x, pt.y);

    let angle = rawAngle;
    if (isDragging.current && lastAngle.current !== null) {
      const delta = angle - lastAngle.current;
      if (delta > 180) angle = 1;
      else if (delta < -180) angle = 359;
    }
    lastAngle.current = angle;

    const ratio = angleToRatio(angle);
    let amount = ratioToAmount(ratio, 0, totalBalance);

    const snapDist = totalBalance * 0.03;
    let snappedTo: string | null = null;

    if (Math.abs(amount - minimumPayment) < snapDist) {
      amount = minimumPayment;
      snappedTo = 'min';
    } else if (Math.abs(amount - dueBalance) < snapDist) {
      amount = dueBalance;
      snappedTo = 'due';
    } else if (Math.abs(amount - totalBalance) < snapDist || amount > totalBalance - snapDist) {
      amount = totalBalance;
      snappedTo = 'total';
    } else if (amount < snapDist) {
      amount = 0;
      snappedTo = 'zero';
    }

    if (snappedTo && snappedTo !== lastSnap.current) {
      snap();
      lastSnap.current = snappedTo;
    } else if (!snappedTo) {
      lastSnap.current = null;
      tick();
    }

    onAmountChange(Math.max(0, Math.min(totalBalance, amount)));
  }, [totalBalance, minimumPayment, dueBalance, onAmountChange, getSVGPoint, snap, tick]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isDisabled) return;
    isDragging.current = true;
    lastAngle.current = null;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    handlePointerToAmount(e.clientX, e.clientY);
  }, [isDisabled, handlePointerToAmount]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    handlePointerToAmount(e.clientX, e.clientY);
  }, [handlePointerToAmount]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    lastAngle.current = null;
    lastSnap.current = null;
  }, []);

  // Grey dot helper
  const greyDot = (pos: { x: number; y: number }, key: string) => (
    <g key={key}>
      <circle cx={pos.x} cy={pos.y} r={DOT_R + 2} fill="white" />
      <circle cx={pos.x} cy={pos.y} r={DOT_R} fill="#d1d5db" />
    </g>
  );

  return (
    <div className="relative w-full max-w-[280px] mx-auto aspect-square select-none touch-none">
      <svg
        ref={svgRef}
        viewBox={WHEEL.viewBox}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: isDisabled ? 'default' : 'pointer' }}
      >
        {/* Background track */}
        <path
          d={trackPath}
          fill="none"
          stroke={COLORS.arcTrack}
          strokeWidth={WHEEL.trackStrokeWidth}
          strokeLinecap="butt"
        />

        {/* Filled arc */}
        {!isZeroBalance && (
          <path
            d={trackPath}
            fill="none"
            stroke={isCardBlocked ? COLORS.arcBlocked : arcColor}
            strokeWidth={WHEEL.strokeWidth}
            strokeLinecap="butt"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - Math.min(selectedRatio, 0.999)}
            style={{ transition: isDragging.current ? 'none' : 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
          />
        )}

        {/* Grey dot milestones */}
        {!isZeroBalance && (
          <>
            {hasDistinctMin && greyDot(minPos, 'min-dot')}
            {hasDueMilestone && greyDot(duePos, 'due-dot')}
            {greyDot(totalPos, 'total-dot')}
          </>
        )}

        {/* Draggable marker */}
        {!isZeroBalance && (
          <g style={{ cursor: 'grab' }}>
            <circle
              cx={markerPos.x}
              cy={markerPos.y}
              r={WHEEL.markerRadius + 2}
              fill="rgba(0,0,0,0.06)"
              style={{ transition: isDragging.current ? 'none' : 'cx 0.3s ease, cy 0.3s ease' }}
            />
            <circle
              cx={markerPos.x}
              cy={markerPos.y}
              r={WHEEL.markerRadius}
              fill="white"
              stroke={arcColor}
              strokeWidth="3"
              style={{
                transition: isDragging.current ? 'none' : 'cx 0.3s ease, cy 0.3s ease, stroke 0.3s ease',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
              }}
            />
          </g>
        )}
      </svg>

      {/* Center display: balance label + selected amount */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          {isZeroBalance ? (
            <div className="text-lg font-semibold" style={{ color: COLORS.textNoInterest }}>
              All clear
            </div>
          ) : (
            <>
              <div
                className="text-4xl font-bold tabular-nums"
                style={{ color: COLORS.textPrimary }}
              >
                €{selectedAmount.toFixed(2)}
              </div>
              <div
                className="text-[10px] mt-1 tabular-nums"
                style={{ color: COLORS.textMuted }}
              >
                of €{totalBalance.toFixed(2)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
