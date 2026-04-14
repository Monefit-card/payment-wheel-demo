import { INTEREST_RATE } from './constants';
import { PaymentZone, ZoneInfo } from '@/types/payment';

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
  const now = new Date();
  const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const month = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  return new Date(year, month, 15);
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
  return `15 ${due.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}`;
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
  if (totalBalance <= 0) return 'at_due';

  const range = totalBalance;
  const snapRange = range * SNAP_THRESHOLD;

  if (Math.abs(amount - totalBalance) < snapRange || amount >= totalBalance) return 'at_total';
  if (Math.abs(amount - dueBalance) < snapRange) return 'at_due';
  if (Math.abs(amount - minimumPayment) < snapRange) return 'at_minimum';
  if (amount < minimumPayment) return 'below_minimum';
  if (amount < dueBalance) return 'between_min_due';
  return 'between_due_total';
}

export function getZoneInfo(zone: PaymentZone): ZoneInfo {
  switch (zone) {
    case 'below_minimum':
      return {
        zone,
        title: 'Reduce your bill',
        description: 'This will reduce your bill. Aim to pay at least the minimum before the due date.',
      };
    case 'at_minimum':
      return {
        zone,
        title: 'Minimum payment',
        description: 'This is the minimum amount due to keep your account in good standing. Pay more to reduce potential interest charges.',
      };
    case 'between_min_due':
      return {
        zone,
        title: 'Reduce interest',
        description: 'The more you pay off before the due date the lower your potential interest charges.',
      };
    case 'at_due':
      return {
        zone,
        title: 'Pay due balance',
        description: 'Paying your due balance is recommended to avoid interest charges.',
      };
    case 'between_due_total':
      return {
        zone,
        title: 'Pay more',
        description: 'This will free up your available credit and reduce the amount to pay next month.',
      };
    case 'at_total':
      return {
        zone,
        title: 'Pay full balance',
        description: 'Paying in full clears your balance and helps you stay ahead on your finances.',
      };
  }
}
