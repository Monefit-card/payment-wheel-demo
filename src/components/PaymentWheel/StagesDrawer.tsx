'use client';

import { motion, AnimatePresence } from 'motion/react';
import { COLORS } from '@/lib/constants';
import { getZoneInfo } from '@/lib/payment-math';
import { AccountState, PaymentZone, ZoneInfo } from '@/types/payment';

interface StagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  accountState: AccountState;
  minimumPayment: number;
}

/** All zones the user could land on for the given account state. Mirrors the
 *  routing in `getPaymentZone` so the drawer reads as the wheel's legend. */
function getActiveZones(
  accountState: AccountState,
  minimumPayment: number,
): PaymentZone[] {
  const { totalBalance, dueBalance } = accountState;
  if (totalBalance <= 0) return ['at_zero'];

  const minIsDue =
    minimumPayment > 0 &&
    dueBalance > 0 &&
    Math.abs(minimumPayment - dueBalance) < totalBalance * 0.02;
  const dueIsTotal =
    dueBalance > 0 &&
    Math.abs(dueBalance - totalBalance) < totalBalance * 0.02;

  const zones: PaymentZone[] = [];

  // Below the bill
  if (dueBalance > 0) {
    if (minimumPayment > 0 && !minIsDue) {
      zones.push('below_minimum', 'at_minimum', 'between_min_due');
    } else if (minIsDue) {
      zones.push('below_minimum');
    }
    zones.push('at_due');
  }

  // Above the bill
  if (!dueIsTotal && totalBalance > dueBalance) {
    if (dueBalance > 0) zones.push('between_due_total');
    zones.push('at_total');
  }

  return zones;
}

export function StagesDrawer({
  isOpen,
  onClose,
  accountState,
  minimumPayment,
}: StagesDrawerProps) {
  const zones = getActiveZones(accountState, minimumPayment);

  const dueEqualsTotal =
    accountState.totalBalance > 0 &&
    Math.abs(accountState.dueBalance - accountState.totalBalance) < 0.01;
  const minEqualsDue =
    accountState.totalBalance > 0 &&
    minimumPayment > 0 &&
    Math.abs(minimumPayment - accountState.dueBalance) < 0.01;

  const items: ZoneInfo[] = zones.map((z) =>
    getZoneInfo(z, {
      dueEqualsTotal,
      minEqualsDue,
      userType: accountState.userType,
    }),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 inset-x-0 mx-auto z-50 rounded-t-3xl max-w-md overflow-hidden"
            style={{ background: '#ffffff' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: COLORS.surfaceBorder }}
              />
            </div>

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between">
              <div className="w-8" />
              <h2
                className="text-base font-bold"
                style={{ color: COLORS.textPrimary }}
              >
                Payment stages
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: COLORS.background }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke={COLORS.textSecondary}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Stage list */}
            <div className="px-5 pb-8 pt-1 space-y-4">
              {items.map((item) => (
                <div key={item.zone}>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {item.title}
                  </div>
                  <div
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
