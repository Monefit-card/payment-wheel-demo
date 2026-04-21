import { AccountState, Preset } from '@/types/payment';

export const COLORS = {
  background: '#f5f5f7',
  surface: '#ffffff',
  surfaceBorder: '#e5e7eb',
  surfaceHover: '#f0f0f2',

  // Arc gradient stops
  arcOrange: '#f97316',
  arcRed: '#ef4444',
  arcGreen: '#22c55e',
  arcBlue: '#3b82f6',
  arcIndigo: '#6366f1',
  arcTrack: '#e8e8ee',
  arcBlocked: '#ef4444',

  // Text
  textPrimary: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInterest: '#f97316',
  textNoInterest: '#22c55e',
  textDanger: '#ef4444',
  textWhite: '#ffffff',
};

export const WHEEL = {
  cx: 160,
  cy: 160,
  radius: 115,
  strokeWidth: 28,
  trackStrokeWidth: 28,
  markerRadius: 16,
  checkmarkRadius: 16,
  gapDegrees: 0,
  get startAngle() { return 0; },   // 12 o'clock (top)
  get endAngle() { return 360; },   // full 360 back to top
  get totalArcDegrees() { return 360; },
  viewBox: '0 0 320 320',
  textRadius: 82, // inner radius for curved text
  outerTextRadius: 152, // outer radius for "BALANCE" text
};

export const ANIMATION = {
  arcSpring: { type: 'spring' as const, stiffness: 120, damping: 20 },
  numberSpring: { type: 'spring' as const, stiffness: 80, damping: 25 },
  fadeIn: { duration: 0.2, ease: 'easeOut' as const },
};

export const INTEREST_RATE = 0.1999;

export const PRESETS: Preset[] = [
  {
    name: 'Transactor — Normal',
    description: 'In period, total > due',
    state: {
      totalBalance: 295,
      dueBalance: 205,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  {
    name: 'Transactor — Due = Total',
    description: 'In period, no new transactions',
    state: {
      totalBalance: 1200,
      dueBalance: 1200,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  {
    name: 'Transactor — Outside',
    description: 'Outside payment period',
    state: {
      totalBalance: 800,
      dueBalance: 0,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: false,
      isCardBlocked: false,
    },
  },
  {
    name: 'Revolver — Normal',
    description: 'In period, interest accruing',
    state: {
      totalBalance: 3000,
      dueBalance: 3000,
      outstandingInterest: 45,
      userType: 'revolver',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  {
    name: 'Revolver — Outside',
    description: 'Outside payment period',
    state: {
      totalBalance: 3000,
      dueBalance: 3000,
      outstandingInterest: 45,
      userType: 'revolver',
      isInPaymentPeriod: false,
      isCardBlocked: false,
    },
  },
  {
    name: 'Zero Balance',
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
  /* ── Small balance (due ≤ €20 → min = due) ── */
  {
    name: 'Small Balance · T · Due = Total',
    description: 'Below €20, no new purchases',
    state: {
      totalBalance: 15,
      dueBalance: 15,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  {
    name: 'Small Balance · T · Total > Due',
    description: 'Due €15, total €60 (new purchases)',
    state: {
      totalBalance: 60,
      dueBalance: 15,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },
  {
    name: 'Small Balance · T · Outside',
    description: 'Total €15, nothing due yet',
    state: {
      totalBalance: 15,
      dueBalance: 0,
      outstandingInterest: 0,
      userType: 'transactor',
      isInPaymentPeriod: false,
      isCardBlocked: false,
    },
  },
  {
    name: 'Small Balance · Revolver',
    description: 'Below €20, interest accruing',
    state: {
      totalBalance: 15,
      dueBalance: 15,
      outstandingInterest: 0,
      userType: 'revolver',
      isInPaymentPeriod: true,
      isCardBlocked: false,
    },
  },

  {
    name: 'Card Blocked',
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
