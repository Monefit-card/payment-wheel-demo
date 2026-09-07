'use client';

import { COLORS } from '@/lib/constants';

/**
 * Shared icon set. The first block is the app's own iconography; the second is
 * the prototype's `icons.jsx`, ported to typed components.
 *
 * `@/components/Home/icons` re-exports everything here, so existing imports
 * keep working.
 */

interface IconProps {
  size?: number;
  color?: string;
}

export function ChevronRight({
  size = 16,
  color = COLORS.textPrimary,
  strokeWidth = 2.2,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path
        d="M6.5 3.5L12 9l-5.5 5.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CardIcon({ color = COLORS.textPrimary }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect
        x="2.5"
        y="5.5"
        width="19"
        height="13"
        rx="3"
        stroke={color}
        strokeWidth="1.9"
      />
      <path d="M2.5 10h19" stroke={color} strokeWidth="1.9" />
      <rect x="5.5" y="13" width="4.5" height="2.4" rx="1.2" fill={color} />
    </svg>
  );
}

export function CloseIcon({ color = COLORS.textMuted }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 3.5l9 9M12.5 3.5l-9 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HomeIcon({ color = COLORS.textPrimary }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.6l8-6.2 8 6.2V19a1.6 1.6 0 01-1.6 1.6h-3.2v-5.3h-6.4v5.3H5.6A1.6 1.6 0 014 19v-8.4z"
        fill={color}
      />
    </svg>
  );
}

export function BillsIcon({ color = COLORS.textSecondary }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h12v18l-2.4-1.6L13.2 21l-1.2-1.6L10.8 21l-2.4-1.6L6 21V3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8h5.6M9.2 12h5.6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Netflix wordmark "N" — two uprights with a diagonal between them. */
export function NetflixMark() {
  return (
    <svg width="22" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M6 1.5h4.2L18 22.5h-4.2L6 1.5z" fill="#b1060f" />
      <rect x="6" y="1.5" width="4.2" height="21" fill="#e50914" />
      <rect x="13.8" y="1.5" width="4.2" height="21" fill="#e50914" />
    </svg>
  );
}

/** Nike swoosh. */
export function NikeMark() {
  return (
    <svg width="28" height="14" viewBox="0 0 24 12" fill="none">
      <path
        d="M23 0.9c0 0-13.3 7.4-16 8.4-2 .8-3.7.3-4.3-.8-.6-1.1.2-2.2 1.8-3.1L8.7 2.9 6.7 6.2c-.6 1 0 1.7 1.2 1.3C9.5 7 23 .9 23 .9z"
        fill="#f97316"
      />
    </svg>
  );
}

/** The stack of Monefit cards shown in the promo carousel. */
export function CardStackArt() {
  return (
    <svg width="132" height="104" viewBox="0 0 132 104" fill="none">
      {/* Two frosted cards fanned out behind the black one */}
      <g opacity="0.55">
        <rect
          x="16"
          y="42"
          width="74"
          height="48"
          rx="7"
          transform="rotate(-9 16 42)"
          fill="#c9d2dc"
        />
        <rect
          x="24"
          y="34"
          width="74"
          height="48"
          rx="7"
          transform="rotate(-9 24 34)"
          fill="#e2e8ee"
        />
      </g>

      {/* Front card */}
      <g transform="rotate(-9 34 24)">
        <rect x="34" y="24" width="74" height="48" rx="7" fill="#17171a" />
        <text
          x="42"
          y="38"
          fill="#ffffff"
          fontSize="7.5"
          fontWeight="600"
          letterSpacing="-0.2"
        >
          monefit
        </text>
        <text x="42" y="65" fill="#8e8e93" fontSize="6" letterSpacing="0.4">
          •• 7040
        </text>
        {/* Mastercard mark */}
        <circle cx="90" cy="60" r="7" fill="#eb001b" />
        <circle cx="98" cy="60" r="7" fill="#f79e1b" fillOpacity="0.92" />
      </g>
    </svg>
  );
}

/* ── Ported from the prototype's `icons.jsx` ─────────────────────────────── */

/**
 * Flex — a card split into three equal panels, reading as "split into
 * instalments". Used anywhere Flex is called out: the widget row, the
 * "Flex available" chip, and the marker on transactions already flexed.
 */
export function IconFlex({ size = 20, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke={color} strokeWidth="1.6" />
      <path d="M9.5 4.5v15M14.5 4.5v15" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

/** Receipt — statements, amortisation tables. */
export function IconReceipt({ size = 24, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 3h14v18l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L5 21V3z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 8h8M8 12h8M8 16h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Bank — the linked bank account / payment method row. */
export function IconBank({ size = 20, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 10l9-6 9 6" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 10v8M19 10v8M9 10v8M15 10v8" stroke={color} strokeWidth="1.6" />
      <path d="M3 19h18" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Gear — opens payment + autopay management. */
export function IconGear({ size = 18, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" />
      <path
        d="M19.4 13.6a7.7 7.7 0 0 0 0-3.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.8-1.6L13.7 2h-3.4l-.6 2.5a7.6 7.6 0 0 0-2.8 1.6l-2.3-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 3.2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.8 1.6l.6 2.3h3.4l.6-2.3a7.6 7.6 0 0 0 2.8-1.6l2.3 1 2-3.4-2-1.5z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Plus — "Add payment method", "New plan". */
export function IconPlus({ size = 14, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * AutoPay — a recurring loop (two arrows forming a cycle). Reads as "this
 * repeats automatically" more directly than a bolt in a circle.
 */
export function IconAutoPay({ size = 16, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 9a8 8 0 0 1 14.6-2.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 3v4h-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 15a8 8 0 0 1-14.6 2.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 21v-4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Check — used inside filled instalment dots and success states. */
/** Filled grey info dot — the affordance on Flex's explainable rows. */
export function IconInfo({ size = 15, color = '#c4c4ca' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="7.5" fill={color} />
      <circle cx="7.5" cy="4.3" r="0.95" fill="#ffffff" />
      <path d="M7.5 6.6v4.4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ size = 10, color = COLORS.textWhite }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path
        d="M2 5.2l2 2 4-4.4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Close — the prototype's stroked X (see also `CloseIcon` above). */
export function IconClose({ size = 10, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M1 1l8 8M9 1l-8 8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export type ChevronDirection = 'right' | 'left' | 'up' | 'down';

const CHEVRON_ROTATION: Record<ChevronDirection, number> = {
  right: 0,
  left: 180,
  down: 90,
  up: 270,
};

/** Chevron — one glyph, rotated to point wherever it's needed. */
export function IconChevron({
  dir = 'right',
  size = 14,
  color = COLORS.textPrimary,
}: IconProps & { dir?: ChevronDirection }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      style={{ transform: `rotate(${CHEVRON_ROTATION[dir]}deg)` }}
      fill="none"
    >
      <path
        d="M5 2l5 5-5 5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Card — the prototype's outlined card (see also `CardIcon` above). */
export function IconCard({ size = 22, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5.5" width="19" height="14" rx="3" stroke={color} strokeWidth="1.6" />
      <path d="M2.5 10h19" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

/** Home tab glyph. `filled` is the active state. */
export function IconHome({
  size = 24,
  color = COLORS.textPrimary,
  filled = true,
}: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2.5"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="1.6"
      />
      <rect x="3" y="11" width="18" height="2" fill={filled ? COLORS.textWhite : color} />
    </svg>
  );
}

/** Card with a gear in the corner — the manage-payment-methods entry point. */
export function IconCardSettings({ size = 18, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="16" height="11" rx="2.2" stroke={color} strokeWidth="1.6" />
      <path d="M2 9h16" stroke={color} strokeWidth="1.6" />
      <circle cx="18" cy="18" r="4.2" fill={COLORS.surface} />
      <circle cx="18" cy="18" r="1.6" stroke={color} strokeWidth="1.3" />
      <path
        d="M18 14.2v1.2M18 20.6v1.2M14.2 18h1.2M20.6 18h1.2M15.3 15.3l.85.85M19.85 19.85l.85.85M15.3 20.7l.85-.85M19.85 16.15l.85-.85"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Bolt — energy / instant, used on the AutoPay settings row. */
export function IconBolt({ size = 24, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color} />
    </svg>
  );
}
