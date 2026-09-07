'use client';

import { useRef, useCallback, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { WHEEL, COLORS, STAGE_ARC } from '@/lib/constants';
import {
  getFullTrackPath,
  polarToCartesian,
  ratioToAngle,
  pointerToAngle,
  angleToRatio,
  amountToRatio,
  ratioToAmount,
} from '@/lib/arc-geometry';
import { useHaptic } from '@/hooks/useHaptic';
import { AccountState, ZoneInfo } from '@/types/payment';

const STEP_COUNT = 100;
/**
 * Drag steps across the future-instalment segment. It's a narrow slice of the
 * ring, so it gets its own grid rather than the card range's — 20 stops is a
 * partial prepayment the user can actually land on.
 */
const SETTLEMENT_STEP_COUNT = 20;

interface WheelSVGProps {
  accountState: AccountState;
  selectedAmount: number;
  minimumPayment: number;
  /**
   * The credit-line slice of the minimum, when the minimum is shown split.
   * Draws an extra anchor between it and the due Flex instalments stacked on
   * top; 0 (the default) leaves the minimum as one undivided step.
   */
  creditMinimum?: number;
  isZeroBalance: boolean;
  zoneInfo: ZoneInfo;
  /**
   * The account's total balance, including Flex instalments scheduled beyond
   * this period. Larger than the ring's maximum whenever plans are running —
   * shown so "total payment" never reads as "everything you owe".
   */
  accountTotalBalance?: number;
  /**
   * The ring's maximum — the card balance plus the cost of settling every Flex
   * plan. The stretch above `accountState.totalBalance` is the future-instalment
   * segment: a continuous range, since a payment there is spread across the
   * upcoming instalments rather than clearing any one of them.
   */
  settlementTotal?: number;
  /**
   * Label on the balance line. 'Total balance' when the figure includes Flex
   * instalments the ring can't reach; 'Balance' when it is simply the card's.
   */
  balanceLabel?: string;
  onAmountChange: (amount: number) => void;
  onInfoClick?: () => void;
}

export function WheelSVG({
  accountState,
  selectedAmount,
  minimumPayment,
  creditMinimum = 0,
  isZeroBalance,
  zoneInfo,
  accountTotalBalance,
  settlementTotal,
  balanceLabel = 'Total balance',
  onAmountChange,
  onInfoClick,
}: WheelSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const [dragging, setDragging] = useState(false);
  const lastAngle = useRef<number | null>(null);
  const { snap, tick } = useHaptic();
  const lastSnap = useRef<string | null>(null);
  const lastStepIndex = useRef<number | null>(null);

  const trackPath = useMemo(() => getFullTrackPath(), []);
  const { totalBalance, dueBalance, isCardBlocked } = accountState;
  const isDisabled = isZeroBalance;

  /** Ring maximum. Equals the card balance when there's nothing to settle. */
  const wheelMax = Math.max(totalBalance, settlementTotal ?? totalBalance);
  /** True when the instalment segment exists at all. */
  const hasSettlement = wheelMax > totalBalance + 0.01;

  const selectedRatio = wheelMax > 0 ? amountToRatio(selectedAmount, 0, wheelMax) : 0;
  /** Where the card balance sits — the boundary the segment starts at. */
  const payableRatio = wheelMax > 0 ? amountToRatio(totalBalance, 0, wheelMax) : 0;

  const stage = isCardBlocked ? STAGE_ARC.below_minimum : STAGE_ARC[zoneInfo.zone];

  const markerPos = useMemo(() => {
    const angle = ratioToAngle(Math.min(selectedRatio, 0.999));
    return polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, angle);
  }, [selectedRatio]);

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

  const minRatio = wheelMax > 0 ? amountToRatio(minimumPayment, 0, wheelMax) : 0;
  const dueRatio = wheelMax > 0 ? amountToRatio(dueBalance, 0, wheelMax) : 0;
  const creditMinRatio = wheelMax > 0 ? amountToRatio(creditMinimum, 0, wheelMax) : 0;

  const minPos = useMemo(() =>
    polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, ratioToAngle(minRatio)),
  [minRatio]);

  const creditMinPos = useMemo(() =>
    polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, ratioToAngle(creditMinRatio)),
  [creditMinRatio]);

  const duePos = useMemo(() =>
    polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, ratioToAngle(dueRatio)),
  [dueRatio]);

  const totalPos = useMemo(() =>
    polarToCartesian(
      WHEEL.cx,
      WHEEL.cy,
      WHEEL.radius,
      ratioToAngle(hasSettlement ? payableRatio : 0.999),
    ),
  [hasSettlement, payableRatio]);

  const settlementPos = useMemo(() =>
    polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, ratioToAngle(0.999)),
  []);

  const hasDistinctMin =
    minimumPayment > 0 && minimumPayment < dueBalance - wheelMax * 0.04;
  const hasDueMilestone =
    dueBalance > 0 && dueBalance < totalBalance - wheelMax * 0.01;
  /**
   * The split anchor inside the minimum. It needs clear air on both sides: a
   * snap window (3%) off 12 o'clock, where the total anchor already sits and
   * below which the point isn't separately reachable anyway, and a dot's width
   * more (4%) below the minimum's own anchor.
   */
  const hasCreditMinSplit =
    hasDistinctMin &&
    creditMinimum > wheelMax * 0.03 &&
    creditMinimum < minimumPayment - wheelMax * 0.04;

  /**
   * Anchor the wheel snaps to — minimum, bill, total. Anchors the arc has
   * reached darken into it; the rest sit grey on the white track. The total
   * anchor shares the arc's start point at 12 o'clock, so it reads as covered
   * as soon as the arc has any length.
   */
  const anchorDot = (
    pos: { x: number; y: number },
    key: string,
    covered: boolean,
  ) => (
    <circle
      key={key}
      cx={pos.x}
      cy={pos.y}
      r={WHEEL.anchorRadius}
      fill={covered ? '#000000' : COLORS.anchorIdle}
      opacity={covered ? 0.24 : 1}
      style={{ transition: 'opacity 0.3s ease, fill 0.3s ease' }}
    />
  );

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
    let amount = ratioToAmount(ratio, 0, wheelMax);

    const snapDist = wheelMax * 0.03;
    const stepSize = totalBalance / STEP_COUNT;
    let snappedTo: string | null = null;

    // Above the card balance the payment reaches the plans' future instalments
    // and is spread across them, so any amount is meaningful. The segment has
    // its own grid, and the snap windows at its two ends are scaled to its
    // width rather than the ring's — a 3% window would otherwise swallow most
    // of a narrow segment and leave nothing partial to land on.
    if (hasSettlement && amount > totalBalance) {
      const segment = wheelMax - totalBalance;
      const endSnap = Math.min(snapDist, segment * 0.15);
      const segmentStep = segment / SETTLEMENT_STEP_COUNT;
      let resolved: number;
      let hitEnd: string | null = null;

      if (amount < totalBalance + endSnap) {
        resolved = totalBalance;
        hitEnd = 'total';
      } else if (amount > wheelMax - endSnap) {
        resolved = wheelMax;
        hitEnd = 'settlement';
      } else {
        resolved =
          Math.round(
            (totalBalance + Math.round((amount - totalBalance) / segmentStep) * segmentStep) * 100,
          ) / 100;
      }

      if (hitEnd) {
        if (lastSnap.current !== hitEnd) {
          snap();
          lastSnap.current = hitEnd;
          lastStepIndex.current = null;
        }
      } else {
        lastSnap.current = null;
        const stepIndex = Math.round((resolved - totalBalance) / segmentStep);
        if (lastStepIndex.current !== stepIndex) {
          tick();
          lastStepIndex.current = stepIndex;
        }
      }

      onAmountChange(resolved);
      return;
    }

    // Anchor snapping: candidates win over the grid. 3% window comfortably
    // exceeds the 1% grid step, so anchors always pull cleanly off-grid.
    const candidates: Array<{ value: number; label: string }> = [];
    if (hasCreditMinSplit) candidates.push({ value: creditMinimum, label: 'credit-min' });
    if (minimumPayment > 0) candidates.push({ value: minimumPayment, label: 'min' });
    if (dueBalance > 0) candidates.push({ value: dueBalance, label: 'due' });
    candidates.push({ value: totalBalance, label: 'total' });
    candidates.push({ value: 0, label: 'zero' });

    // Pin to the card balance as it's approached from below. Only when it is
    // also the ring's maximum — with a future-instalment segment above it, the
    // branch there owns both sides of the boundary.
    if (!hasSettlement && amount > totalBalance - snapDist) {
      amount = totalBalance;
      snappedTo = 'total';
    } else {
      let best: { value: number; label: string } | null = null;
      let bestDist = snapDist;
      for (const c of candidates) {
        const d = Math.abs(amount - c.value);
        if (d < bestDist) {
          best = c;
          bestDist = d;
        }
      }
      if (best) {
        amount = best.value;
        snappedTo = best.label;
      } else if (stepSize > 0) {
        // Between anchors, quantise to the 100-step grid. Round to cents so
        // values like €2.9499999… display cleanly.
        amount = Math.round(amount / stepSize) * stepSize;
        amount = Math.round(amount * 100) / 100;
      }
    }

    // Haptics: strong snap when entering an anchor; a light tick only when
    // crossing a new grid step (not on every pointer move).
    if (snappedTo && snappedTo !== lastSnap.current) {
      snap();
      lastSnap.current = snappedTo;
      lastStepIndex.current = null;
    } else if (!snappedTo) {
      lastSnap.current = null;
      const stepIndex = stepSize > 0 ? Math.round(amount / stepSize) : 0;
      if (lastStepIndex.current !== stepIndex) {
        tick();
        lastStepIndex.current = stepIndex;
      }
    }

    onAmountChange(Math.max(0, Math.min(wheelMax, amount)));
  }, [
    totalBalance,
    wheelMax,
    hasSettlement,
    minimumPayment,
    creditMinimum,
    hasCreditMinSplit,
    dueBalance,
    onAmountChange,
    getSVGPoint,
    snap,
    tick,
  ]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isDisabled) return;
    isDragging.current = true;
    setDragging(true);
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
    setDragging(false);
    lastAngle.current = null;
    lastSnap.current = null;
    lastStepIndex.current = null;
  }, []);

  return (
    <div className="relative w-full max-w-[340px] mx-auto aspect-square select-none touch-none">
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
        <defs>
          <linearGradient
            id="arc-gradient"
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

        {/* Background track — white, sitting on the grey screen */}
        <path
          d={trackPath}
          fill="none"
          stroke={COLORS.arcTrack}
          strokeWidth={WHEEL.trackStrokeWidth}
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 3px 8px rgba(17,17,19,0.07))' }}
        />

        {/* Filled arc */}
        {!isZeroBalance && selectedRatio > 0 && (
          <path
            d={trackPath}
            fill="none"
            stroke="url(#arc-gradient)"
            strokeWidth={WHEEL.strokeWidth}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - Math.min(selectedRatio, 0.999)}
            style={{ transition: dragging ? 'none' : 'stroke-dashoffset 0.3s ease' }}
          />
        )}

        {/* Anchor points the wheel snaps to */}
        {!isZeroBalance && (
          <>
            {hasCreditMinSplit &&
              anchorDot(
                creditMinPos,
                'credit-min-anchor',
                selectedRatio >= creditMinRatio - 0.001,
              )}
            {hasDistinctMin &&
              anchorDot(minPos, 'min-anchor', selectedRatio >= minRatio - 0.001)}
            {hasDueMilestone &&
              anchorDot(duePos, 'due-anchor', selectedRatio >= dueRatio - 0.001)}
            {anchorDot(
              totalPos,
              'total-anchor',
              hasSettlement ? selectedRatio >= payableRatio - 0.001 : selectedRatio > 0,
            )}
            {hasSettlement &&
              anchorDot(settlementPos, 'settlement-anchor', selectedRatio > 0.998)}
          </>
        )}

        {/* Drag handle — pale tint of the stage colour, rimmed in it */}
        {!isZeroBalance && (
          <g style={{ cursor: 'grab' }}>
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
          </g>
        )}

      </svg>

      {/* Center display: stage title + selected amount + total balance */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          {isZeroBalance ? (
            <div
              className="text-[19px] font-semibold"
              style={{ color: COLORS.textPrimary }}
            >
              All clear
            </div>
          ) : isCardBlocked ? (
            <>
              <div
                className="text-[17px] font-semibold"
                style={{ color: COLORS.textDanger }}
              >
                Card blocked
              </div>
              <div
                className="text-[13px] mt-1.5 leading-snug px-8"
                style={{ color: COLORS.textSecondary }}
              >
                Pay the minimum amount to unblock your card.
              </div>
            </>
          ) : (
            <>
              {/* Stage title. Keyed on the zone so it remounts and fades in on
                  each stage change, with no exit animation — waiting on one
                  would leave the wrong stage on screen if a frame callback is
                  dropped, the same reason page.tsx avoids exits. */}
              <motion.button
                  key={zoneInfo.zone}
                  type="button"
                  onClick={onInfoClick}
                  className="inline-flex items-center justify-center gap-1.5 pointer-events-auto"
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ color: COLORS.textSecondary }}
                >
                  <span className="text-[16px]">{zoneInfo.title}</span>
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 13 13"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="6.5"
                      cy="6.5"
                      r="5.75"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                    <circle cx="6.5" cy="3.6" r="0.75" fill="currentColor" />
                    <path
                      d="M6.5 5.6v4.2"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.button>

              {/* Selected amount */}
              <div
                className="text-[38px] font-bold tabular-nums leading-tight mt-1"
                style={{ color: COLORS.textPrimary }}
              >
                €{selectedAmount.toFixed(2)}
              </div>

              {/* Total balance */}
              <div
                className="text-[15px] mt-1 tabular-nums"
                style={{ color: COLORS.textSecondary }}
              >
                {balanceLabel}: €{(accountTotalBalance ?? totalBalance).toFixed(2)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
