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
  /* 1 */ {
    name: 'Transactor — Standard',
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
  /* 2 */ {
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
  /* 3 */ {
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
  /* 4 */ {
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
  /* 5 */ {
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
  /* 6 */ {
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
  /* 7 */ {
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
  /* 8 */ {
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
  /* 9 */ {
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
  /* 10 */ {
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
  /* 11 */ {
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
  /* 12 */ {
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
