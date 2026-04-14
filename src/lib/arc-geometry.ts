import { WHEEL } from './constants';

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function describeArc(
  startAngle: number,
  endAngle: number,
  cx: number = WHEEL.cx,
  cy: number = WHEEL.cy,
  radius: number = WHEEL.radius
): string {
  const sweep = endAngle - startAngle;
  if (sweep >= 360) {
    const mid = startAngle + 180;
    const s1 = polarToCartesian(cx, cy, radius, startAngle);
    const m1 = polarToCartesian(cx, cy, radius, mid);
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${radius} ${radius} 0 1 1 ${m1.x} ${m1.y}`,
      `A ${radius} ${radius} 0 1 1 ${s1.x} ${s1.y}`,
    ].join(' ');
  }

  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
  ].join(' ');
}

export function getFullTrackPath(): string {
  // Full circle
  return describeArc(WHEEL.startAngle, WHEEL.endAngle);
}

/** Convert a ratio (0-1) to an angle on the arc */
export function ratioToAngle(ratio: number): number {
  return WHEEL.startAngle + ratio * WHEEL.totalArcDegrees;
}

/** Convert an angle to a ratio (0-1) on the arc */
export function angleToRatio(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return Math.max(0, Math.min(1, a / WHEEL.totalArcDegrees));
}

/** Get the position on the arc for a given ratio */
export function getPositionOnArc(ratio: number): { x: number; y: number } {
  const angle = ratioToAngle(ratio);
  return polarToCartesian(WHEEL.cx, WHEEL.cy, WHEEL.radius, angle);
}

/** Convert pointer position (relative to SVG) to an angle, starting from 12 o'clock */
export function pointerToAngle(px: number, py: number): number {
  const dx = px - WHEEL.cx;
  const dy = py - WHEEL.cy;
  // atan2 gives angle from positive x-axis (3 o'clock); +90 rotates so 0 = top (12 o'clock)
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;
  return Math.max(WHEEL.startAngle, Math.min(WHEEL.endAngle, angle));
}

/** Convert amount to ratio given min and max */
export function amountToRatio(amount: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (amount - min) / (max - min)));
}

/** Convert ratio to amount given min and max */
export function ratioToAmount(ratio: number, min: number, max: number): number {
  return min + ratio * (max - min);
}

/** Get the color for a given ratio based on thresholds */
export function getArcColor(
  ratio: number,
  minRatio: number,
  dueRatio: number
): string {
  if (ratio <= minRatio) {
    return '#f97316'; // orange
  }
  if (ratio < dueRatio) {
    const t = (ratio - minRatio) / (dueRatio - minRatio);
    return interpolateColor('#f97316', '#22c55e', t);
  }
  if (ratio <= dueRatio + 0.02) {
    return '#22c55e'; // green at due
  }
  const t = Math.min(1, (ratio - dueRatio) / (1 - dueRatio));
  return interpolateColor('#22c55e', '#3b82f6', t);
}

function interpolateColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
