import { PaymentZone, Preset } from '@/types/payment';

export const COLORS = {
  background: '#e8e8ed',   // page behind the phone frame
  screen: '#f2f2f4',       // phone screen
  surface: '#ffffff',
  surfaceBorder: '#e5e5ea',
  surfaceHover: '#eaeaef',
  /** Sunken fill on a white card — secondary buttons, count chips. */
  screenSunken: '#eeeef2',

  arcTrack: '#ffffff',     // unfilled ring — white, on the grey screen
  arcBlocked: '#fa1e0a',
  anchorIdle: '#c4c4ca',
  /** Track tint over the instalment segment — previews at_settlement's colour. */
  settlementRegion: 'rgba(63,52,201,0.09)',   // anchor the arc hasn't reached
  accent: '#3b82f6',       // links / selection controls outside the wheel

  // Text
  textPrimary: '#111113',
  textSecondary: '#8e8e93',
  textMuted: '#aeaeb2',
  textInterest: '#111113',
  textNoInterest: '#111113',
  textDanger: '#fa1e0a',
  textWhite: '#ffffff',

  ctaBackground: '#0a0a0c',

  // Ported design tokens (Flex, sheets, overlays)
  flex: '#1DB954',              // Flex green — plans, paid instalments, success
  flexSoft: 'rgba(29,185,84,0.15)',
  flexText: '#0E7A38',          // Flex green, legible as text on flexSoft
  danger: '#E22134',            // destructive actions, blocked-account banner
  dangerSoft: '#FEE7EA',
  dangerText: '#A7121F',
  scrim: 'rgba(10,10,14,0.35)', // dimming behind a bottom sheet
  hairline: 'rgba(19,20,23,0.08)',
  divider: 'rgba(19,20,23,0.07)',
  buttonDisabled: '#C9C9CE',
  labelMuted: '#898989',        // sub lines in ported list rows
  labelStrong: '#6F6F74',
};

/**
 * Arc gradient per stage. The ramp runs red → orange → yellow → green → blue
 * as the payment grows; each stage draws a two-stop slice of it along the arc,
 * with `handle` the pale tint used for the drag knob.
 */
export const STAGE_ARC: Record<PaymentZone, { from: string; to: string; handle: string }> = {
  at_zero:           { from: '#a8e82a', to: '#22d94f', handle: '#cff5db' },
  below_minimum:     { from: '#fa1e0a', to: '#ff6b2e', handle: '#ffd3c4' },
  // Credit-line minimum with the due instalments still uncovered — short of
  // the full minimum, so it stays on the red side of at_minimum's orange.
  at_credit_minimum: { from: '#f83a12', to: '#ff8534', handle: '#ffdcc9' },
  // Climbing through the instalment slice of the minimum: a step further along
  // the ramp, still short of at_minimum.
  between_credit_min_min:
                     { from: '#f6480f', to: '#fd9439', handle: '#fce1cd' },
  at_minimum:        { from: '#f4571a', to: '#fba33f', handle: '#fbe7d0' },
  between_min_due:   { from: '#fa9a2e', to: '#ffe81a', handle: '#fdf6be' },
  at_due:            { from: '#a8e82a', to: '#22d94f', handle: '#cff5db' },
  between_due_total: { from: '#31c9f2', to: '#2081d6', handle: '#cae8fa' },
  at_total:          { from: '#22bfef', to: '#1477d2', handle: '#cdebf8' },
  // Past the card balance: paying down the future instalments, then settling
  // the plans outright. Continues the ramp into indigo.
  between_total_settlement:
                     { from: '#3f9dff', to: '#2a55d0', handle: '#d3ddfb' },
  at_settlement:     { from: '#5b8cff', to: '#3f34c9', handle: '#d7dcff' },
};

export const WHEEL = {
  cx: 160,
  cy: 160,
  // Ring outer diameter is 308 of the 320 viewBox — the design's wheel spans
  // ~84% of the screen width, with the stroke at ~15% of the outer diameter.
  radius: 131,
  strokeWidth: 46,
  trackStrokeWidth: 46,
  markerRadius: 20,
  anchorRadius: 8.5,
  gapDegrees: 0,
  get startAngle() { return 0; },   // 12 o'clock (top)
  get endAngle() { return 360; },   // full 360 back to top
  get totalArcDegrees() { return 360; },
  viewBox: '0 0 320 320',
};

export const ANIMATION = {
  arcSpring: { type: 'spring' as const, stiffness: 120, damping: 20 },
  numberSpring: { type: 'spring' as const, stiffness: 80, damping: 25 },
  fadeIn: { duration: 0.2, ease: 'easeOut' as const },
};

export const INTEREST_RATE = 0.1999;

export const PRESETS: Preset[] = [
  /* 1 */ {
    name: 'Transactor — Standard',
    description: 'In period, total > due',
    state: {
      totalBalance: 415,
      dueBalance: 273.9,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 2 */ {
    name: 'Transactor — All six stages',
    description: 'Every stage reachable by drag, incl. below minimum',
    state: {
      // A €20 minimum is only draggable-past when it clears the wheel's snap
      // window (3% of total), so this preset keeps the total small.
      totalBalance: 120,
      dueBalance: 80,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 3 */ {
    name: 'Transactor — Standard (Small balance)',
    description: 'Small bill (≤ €20) plus new spending',
    state: {
      totalBalance: 60,
      dueBalance: 15,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 4 */ {
    name: 'Transactor — Due = Total',
    description: 'In period, no new spending',
    state: {
      totalBalance: 1200,
      dueBalance: 1200,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 5 */ {
    name: 'Transactor — Due = Total (Small balance)',
    description: '≤ €20 owed, no new spending',
    state: {
      totalBalance: 15,
      dueBalance: 15,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 6 */ {
    name: 'Transactor — Outside period',
    description: 'Bill paid, between billing cycles',
    state: {
      totalBalance: 800,
      dueBalance: 0,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: false,
      isCardBlocked: false,
    },
  },
  /* 7 */ {
    name: 'Transactor — Outside period (Small balance)',
    description: 'Small total, between billing cycles',
    state: {
      totalBalance: 15,
      dueBalance: 0,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: false,
      isCardBlocked: false,
    },
  },
  /* 8 */ {
    name: 'Revolver — Standard',
    description: 'In period, carrying interest',
    state: {
      totalBalance: 3000,
      dueBalance: 3000,
      outstandingInterest: 45,
      userType: 'revolver',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 9 */ {
    name: 'Revolver — Standard (Small balance)',
    description: '≤ €20 owed, carrying interest',
    state: {
      totalBalance: 15,
      dueBalance: 15,
      outstandingInterest: 0,
      userType: 'revolver',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 10 */ {
    name: 'Revolver — Outside period',
    description: 'Carrying interest, between billing cycles',
    state: {
      totalBalance: 3000,
      dueBalance: 3000,
      outstandingInterest: 45,
      userType: 'revolver',
      isInPaymentPeriod: false,
      isCardBlocked: false,
    },
  },
  /* 11 */ {
    name: 'Revolver — Outside period (Small balance)',
    description: 'Small total, carrying interest, between cycles',
    state: {
      totalBalance: 15,
      dueBalance: 15,
      outstandingInterest: 2,
      userType: 'revolver',
      isInPaymentPeriod: false,
      isCardBlocked: false,
    },
  },
  /* 12 */ {
    name: 'Zero balance',
    description: 'Nothing owed',
    state: {
      totalBalance: 0,
      dueBalance: 0,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  /* 13 */ {
    name: 'Card blocked',
    description: 'Missed minimum payment',
    state: {
      totalBalance: 5000,
      dueBalance: 5000,
      outstandingInterest: 120,
      userType: 'revolver',
      isInPaymentPeriod: true,
      isCardBlocked: true,
    },
  },
];
