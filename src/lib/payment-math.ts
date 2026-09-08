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

/** "May 15" — the header's month-first form. */
export function formatDueDateMonthDay(): string {
  const due = getDueDate();
  return `${due.toLocaleDateString('en-GB', { month: 'long' })} 15`;
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

/**
 * `€415.00` — symbol first, dot decimal. This is the form the screens are
 * drawn in, so it's what UI should call; `formatCurrency` above is the de-DE
 * locale form (`415,00 €`), which none of the designs show.
 */
export function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

const SNAP_THRESHOLD = 0.02;

export function getPaymentZone(
  amount: number,
  minimumPayment: number,
  dueBalance: number,
  totalBalance: number,
  /**
   * The credit-line slice of the minimum, when the minimum is shown split
   * (see `splitMinimum` in `usePaymentState`). Zero means no split anchor.
   */
  creditMinimum: number = 0
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

  // The credit/instalment split inside the minimum. Only a distinct anchor
  // while it clears the minimum's own snap window — otherwise the two dots
  // would fight over the same stretch of arc.
  const creditSplit = creditMinimum > 0 && creditMinimum < minimumPayment - snapRange;
  const creditDist = creditSplit ? Math.abs(amount - creditMinimum) : Infinity;
  if (creditDist < snapRange && creditDist <= minDist && creditDist <= dueDist) {
    return 'at_credit_minimum';
  }

  if (minInRange && (!dueInRange || minDist <= dueDist)) return 'at_minimum';
  if (dueInRange) return 'at_due';

  // Between the two halves of the minimum: the credit portion is covered and
  // the due instalments are being paid into. Only below the credit minimum is
  // the payment short of everything.
  if (creditSplit && amount > creditMinimum && amount < minimumPayment) {
    return 'between_credit_min_min';
  }

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
  /**
   * Due Flex instalments folded into the wheel's figures. Only the drawer copy
   * uses it: `getZoneEducation` appends a sentence naming the amount, since a
   * minimum that quietly contains instalments is otherwise unexplainable.
   */
  flexDue?: number;
  /**
   * Instalments scheduled beyond this period. They're payable in Flex, not in
   * the wheel, which is why the wheel's total sits below the total balance.
   */
  flexFuture?: number;
  /** Interest forgiven by settling the plans early. */
  flexInterestSaved?: number;
  /**
   * The live reduce-exposure outcome for a payment sitting above the card
   * balance — `spreadAcrossPlans()`. Only the future-instalment stage reads
   * it, to name what the payment is doing to the schedule.
   */
  flexSpread?: {
    /** Plans the payment is split between. */
    plans: number;
    /** Upcoming instalments it lands on, across all of them. */
    instalments: number;
    monthlyBefore: number;
    monthlyAfter: number;
    saved: number;
  };
}

export function getZoneInfo(zone: PaymentZone, opts?: ZoneInfoOpts): ZoneInfo {
  const {
    dueEqualsTotal = false,
    minEqualsDue = false,
    userType,
    flexFuture = 0,
  } = opts ?? {};
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

    // Deliberately titled as below_minimum is: this stop covers the credit
    // line's own minimum, but the minimum payment is the whole of it. Naming
    // it "credit minimum" would read as a minimum the customer can settle at.
    case 'at_credit_minimum':
      return {
        zone,
        title: 'Below minimum',
        description: `This covers your credit line, but not the Flex instalments due by ${dueDate}. Pay a little more to meet your minimum.`,
      };

    case 'between_credit_min_min':
      return {
        zone,
        title: 'Due instalments',
        description: `Your credit line is covered and this is going to the Flex instalments due by ${dueDate}. Cover them all to meet your minimum.`,
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
          title: 'Total payment',
          description: 'Pay this to clear your balance and stop interest from accruing.',
        };
      }
      // Default — paying the bill in full clears interest. Covers:
      //   • standard transactor at the due point
      //   • transactor due = total
      //   • small balance (min = due, with or without due = total)
      return {
        zone,
        title: `${dueMonth} payment`,
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
      // 'Card payment' only earns its name when there is a settlement step
      // above it. With no future instalments, the card balance IS the total.
      return flexFuture > 0
        ? {
            zone,
            title: 'Card payment',
            description: 'Pay this to clear your card balance and stay ahead on your finances.',
          }
        : {
            zone,
            title: 'Total payment',
            description: 'Pay this to clear your full balance and stay ahead on your finances.',
          };

    case 'between_total_settlement':
      return {
        zone,
        title: 'Future instalments',
        description:
          'Pay ahead on the instalments still to come. Each one gets smaller — your plans keep the same dates and the same number of payments.',
      };

    case 'at_settlement':
      return {
        zone,
        title: 'Total payment',
        description: 'Pay this to clear your card and settle every Flex plan.',
      };
  }
}

/* ── Drawer / educational copy ──────────────────────────────────────────── */

/**
 * Long-form explanation of a stage, used in the info drawer. Date-free —
 * focuses on what each stage *means* rather than what to do this period.
 */
/**
 * The Flex sentence, shown only on the minimum-payment stage — that's the one
 * figure a user can't reconcile without being told.
 */
function flexEducationClause(zone: PaymentZone, flexDue: number): string {
  if (flexDue <= 0 || zone !== 'at_minimum') return '';
  return ' Your minimum includes Flex instalments due this period.';
}

export function getZoneEducation(zone: PaymentZone, opts?: ZoneInfoOpts): string {
  const {
    dueEqualsTotal = false,
    minEqualsDue = false,
    userType,
    flexDue = 0,
    flexFuture = 0,
    flexInterestSaved = 0,
  } = opts ?? {};
  const flexClause = flexEducationClause(zone, flexDue);

  switch (zone) {
    case 'at_zero':
      return "Your balance is fully paid off — nothing is owed right now." + flexClause;

    case 'below_minimum':
      return "This is less than the minimum payment required to keep your account in good standing. Falling short risks late fees and can get your card blocked." + flexClause;

    case 'at_credit_minimum':
      return `Enough for your credit line's own minimum, but not for your minimum payment — that also includes the ${formatEuro(flexDue)} of Flex instalments due this period. Anything short of both counts as a missed minimum, which risks late fees and can get your card blocked.`;

    case 'between_credit_min_min':
      return `Your credit line's minimum is covered and this is going toward the ${formatEuro(flexDue)} of Flex instalments due this period. It comes off all of them in the same proportion, so none is settled until they all are — and until then this is still below your minimum payment.`;

    case 'at_minimum':
      return "The smallest amount you can pay this period to keep your card active. Anything left unpaid rolls forward and starts accruing interest until it's cleared." + flexClause;

    case 'between_min_due':
      return "More than the minimum, but less than your full bill. Whatever you don't cover will roll forward to next period and start accruing interest." + flexClause;

    case 'at_due': {
      if (minEqualsDue && dueEqualsTotal) {
        return "Pays off everything you owe. Because the balance is small, the minimum, the bill, and the total are all the same amount." + flexClause;
      }
      if (dueEqualsTotal && userType === 'revolver') {
        return "Pays off everything you owe, including any balance you've been carrying. This stops interest from accruing on your account." + flexClause;
      }
      return "Your bill for this period — everything you've spent since your last statement. Paying it in full clears the bill and avoids any interest." + flexClause;
    }

    case 'between_due_total':
      return "More than your bill — you're paying ahead. This frees up available credit and reduces what you'll owe next period." + flexClause;

    case 'at_total':
      if (flexFuture > 0) {
        return 'Clears your card. Your Flex plans continue on their schedule.';
      }
      return "Clears everything you owe — this period's bill plus anything carried forward. You'll start the next period with a clean slate." + flexClause;

    case 'between_total_settlement': {
      // Above the card balance the payment is split between every plan and
      // spread across the instalments each has left — never applied to one of
      // them — so what it buys is a smaller monthly commitment on an unchanged
      // schedule, not a shorter plan.
      const spread = opts?.flexSpread;
      if (!spread || spread.instalments === 0) {
        return "You're paying ahead on the Flex instalments still to come, beyond the one already on this period's bill.";
      }
      const across =
        spread.plans > 1
          ? `split between your ${spread.plans} Flex plans in proportion to what each has left, then spread across the ${spread.instalments} instalments still to come`
          : `spread across the ${spread.instalments} instalment${spread.instalments === 1 ? '' : 's'} still to come on your Flex plan`;
      const saved =
        spread.saved > 0 ? ` That forgives ${formatEuro(spread.saved)} of interest you'd have paid.` : '';
      return `Anything above your card balance is ${across}. Nothing is settled outright — every instalment simply gets smaller, from ${formatEuro(spread.monthlyBefore)} to ${formatEuro(spread.monthlyAfter)} a month, on the same dates and the same number of payments.${saved}`;
    }

    case 'at_settlement':
      return flexInterestSaved > 0
        ? `Clears your card and settles every Flex plan, saving ${formatEuro(flexInterestSaved)} in interest.`
        : 'Clears your card and settles every Flex plan.';
  }
}
