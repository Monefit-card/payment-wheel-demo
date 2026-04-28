import { INTEREST_RATE } from './constants';
import { PaymentZone, ZoneInfo, UserType } from '@/types/payment';

export function calculateMinimumPayment(
  dueBalance: number,
  outstandingInterest: number
): number {
  if (dueBalance <= 0) return 0;
  if (dueBalance <= 20) return dueBalance;
  const calculated = dueBalance * 0.05 + outstandingInterest;
  return Math.round(Math.max(20, calculated) * 100) / 100;
}

export function calculateInterestProjection(
  remainingBalance: number,
  days: number = 30,
  annualRate: number = INTEREST_RATE
): number {
  if (remainingBalance <= 0) return 0;
  const dailyRate = annualRate / 365;
  return Math.round(remainingBalance * dailyRate * days * 100) / 100;
}

export function getDueDate(): Date {
  // Billing period runs 16th → 15th. Due date = 15th of the period's closing
  // month: on/before the 15th it's this month's 15th, otherwise next month's.
  const now = new Date();
  const day = now.getDate();
  if (day <= 15) {
    return new Date(now.getFullYear(), now.getMonth(), 15);
  }
  const rollsYear = now.getMonth() === 11;
  return new Date(
    rollsYear ? now.getFullYear() + 1 : now.getFullYear(),
    rollsYear ? 0 : now.getMonth() + 1,
    15,
  );
}

export function getDueMonth(): Date {
  // The bill is named after the earlier month of the 16th→15th period:
  // on/before the 15th, that's the previous month; otherwise the current one.
  const now = new Date();
  const offset = now.getDate() <= 15 ? -1 : 0;
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

export function formatDueDate(): string {
  const due = getDueDate();
  return due.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDueDateShort(): string {
  const due = getDueDate();
  return `15 ${due.toLocaleDateString('en-GB', { month: 'long' })}`;
}

export function formatDueMonth(): string {
  return getDueMonth().toLocaleDateString('en-GB', { month: 'long' });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const SNAP_THRESHOLD = 0.02;

export function getPaymentZone(
  amount: number,
  minimumPayment: number,
  dueBalance: number,
  totalBalance: number
): PaymentZone {
  if (totalBalance <= 0) return 'at_zero';

  const range = totalBalance;
  const snapRange = range * SNAP_THRESHOLD;
  const dueIsTotal =
    dueBalance > 0 &&
    (Math.abs(dueBalance - totalBalance) < snapRange || dueBalance >= totalBalance);
  const minIsDue =
    minimumPayment > 0 &&
    dueBalance > 0 &&
    Math.abs(minimumPayment - dueBalance) < snapRange;

  // Top of wheel. When due = total there's no "beyond due" range — the top
  // anchor reads as `at_due` (the bill), not `at_total`.
  if (Math.abs(amount - totalBalance) < snapRange || amount >= totalBalance) {
    return dueIsTotal ? 'at_due' : 'at_total';
  }

  // Small balance: min and due collapse into one anchor. The merged point is
  // labelled `at_due` (it's the bill), and the range below it is `below_minimum`
  // — there's no separate at_minimum or between_min_due.
  if (minIsDue) {
    if (Math.abs(amount - dueBalance) < snapRange) return 'at_due';
    return amount < dueBalance ? 'below_minimum' : 'between_due_total';
  }

  // Standard case: separate min and due anchors. Closest-wins between them.
  const minDist = minimumPayment > 0 ? Math.abs(amount - minimumPayment) : Infinity;
  const dueDist = dueBalance > 0 ? Math.abs(amount - dueBalance) : Infinity;
  const minInRange = minDist < snapRange;
  const dueInRange = dueDist < snapRange;

  if (minInRange && (!dueInRange || minDist <= dueDist)) return 'at_minimum';
  if (dueInRange) return 'at_due';

  if (minimumPayment > 0 && amount < minimumPayment) return 'below_minimum';
  if (amount < dueBalance) return 'between_min_due';
  return 'between_due_total';
}

/* ── Zone copy ──────────────────────────────────────────────────────────── */

interface ZoneInfoOpts {
  /** true when dueBalance === totalBalance (revolvers, or transactors whose due = total) */
  dueEqualsTotal?: boolean;
  /** true when minimumPayment === dueBalance (small-balance case, balance ≤ €20) */
  minEqualsDue?: boolean;
  userType?: UserType;
}

export function getZoneInfo(zone: PaymentZone, opts?: ZoneInfoOpts): ZoneInfo {
  const { dueEqualsTotal = false, minEqualsDue = false, userType } = opts ?? {};
  const dueDate = formatDueDateShort(); // "15 May"
  const dueMonth = formatDueMonth();    // "April"

  switch (zone) {
    case 'at_zero':
      return {
        zone,
        title: 'All clear',
        description: 'Nothing owed.',
      };

    case 'below_minimum':
      return {
        zone,
        title: 'Below minimum',
        description: `Pay a little more by ${dueDate} to keep your account active.`,
      };

    case 'at_minimum':
      return {
        zone,
        title: 'Minimum payment',
        description: `Pay this by ${dueDate} to keep your account active. Pay more to reduce your interest charges.`,
      };

    case 'between_min_due':
      return {
        zone,
        title: 'Partial payment',
        description: `Pay this by ${dueDate} to cover more of your ${dueMonth} balance and reduce your interest charges.`,
      };

    case 'at_due': {
      // Revolver where due = total (and not the small-balance merged case):
      // emphasise stopping interest.
      if (dueEqualsTotal && !minEqualsDue && userType === 'revolver') {
        return {
          zone,
          title: 'Total balance',
          description: 'Pay this to clear your balance and stop interest from accruing.',
        };
      }
      // Default — paying the bill in full clears interest. Covers:
      //   • standard transactor at the due point
      //   • transactor due = total
      //   • small balance (min = due, with or without due = total)
      return {
        zone,
        title: `${dueMonth} balance`,
        description: `Pay this by ${dueDate} to cover your ${dueMonth} balance and avoid any interest.`,
      };
    }

    case 'between_due_total':
      return {
        zone,
        title: 'Early payment',
        description: "Pay this to free up available credit and reduce next month's bill.",
      };

    case 'at_total':
      return {
        zone,
        title: 'Total balance',
        description: 'Pay this to clear your full balance and stay ahead on your finances.',
      };
  }
}
