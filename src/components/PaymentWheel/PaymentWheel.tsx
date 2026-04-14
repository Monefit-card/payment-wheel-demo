'use client';

import { WheelSVG } from './WheelSVG';
import { PaymentStateReturn } from '@/hooks/usePaymentState';
import { COLORS } from '@/lib/constants';
import { formatDueDateShort } from '@/lib/payment-math';
import { getArcColor, amountToRatio } from '@/lib/arc-geometry';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentWheelProps {
  state: PaymentStateReturn;
}

export function PaymentWheel({ state }: PaymentWheelProps) {
  const {
    accountState,
    selectedAmount,
    setAmount,
    minimumPayment,
    zone,
    zoneInfo,
    showInterest,
    interestProjection,
    isZeroBalance,
    canPay,
  } = state;

  const totalBalance = accountState.totalBalance;
  const dueBalance = accountState.dueBalance;

  const minRatio = totalBalance > 0 ? amountToRatio(minimumPayment, 0, totalBalance) : 0;
  const dueRatio = totalBalance > 0 ? amountToRatio(dueBalance, 0, totalBalance) : 0;
  const selectedRatio = totalBalance > 0 ? amountToRatio(selectedAmount, 0, totalBalance) : 0;
  const buttonColor = getArcColor(selectedRatio, minRatio, dueRatio);

  const dueMonth = formatDueDateShort();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header — centered */}
      <div className="text-center px-5 mb-1 relative">
        <h1 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          {accountState.isCardBlocked ? 'Card Blocked' : 'Choose amount'}
        </h1>
        {accountState.isInPaymentPeriod && (
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Make payment by 11:59PM {dueMonth}
          </p>
        )}
        <button
          className="absolute top-0 right-5 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: COLORS.textSecondary }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Wheel */}
      <WheelSVG
        accountState={accountState}
        selectedAmount={selectedAmount}
        minimumPayment={minimumPayment}
        isZeroBalance={isZeroBalance}
        onAmountChange={setAmount}
      />

      {/* Contextual title + description + interest */}
      {canPay && accountState.isInPaymentPeriod && !accountState.isCardBlocked && (
        <div className="text-center px-6 mt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={zone}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="text-base font-bold" style={{ color: COLORS.textPrimary }}>
                {zoneInfo.title}
              </h2>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textSecondary }}>
                {zoneInfo.description}
              </p>
              {showInterest && interestProjection > 0 && (
                <p className="text-sm font-semibold mt-1.5 tabular-nums" style={{ color: COLORS.textInterest }}>
                  €{interestProjection.toFixed(2)} interest charge on {dueMonth}
                </p>
              )}
              {!showInterest && selectedAmount > 0 && (
                <p className="text-xs font-medium mt-1.5" style={{ color: COLORS.textNoInterest }}>
                  No interest charges
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Card blocked message */}
      {accountState.isCardBlocked && (
        <div className="text-center px-6 mt-1">
          <h2 className="text-base font-bold" style={{ color: COLORS.textDanger }}>
            Card blocked
          </h2>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Pay the minimum amount to unblock your card and restore access.
            {showInterest && interestProjection > 0 && ` €${interestProjection.toFixed(2)} interest will be charged on ${dueMonth}.`}
          </p>
        </div>
      )}

      {/* Outside payment period */}
      {!accountState.isInPaymentPeriod && canPay && (
        <div className="text-center px-6 mt-1">
          <h2 className="text-base font-bold" style={{ color: COLORS.textPrimary }}>
            No payment due
          </h2>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Your next payment is due on {dueMonth}.
          </p>
        </div>
      )}

      {/* Pay button */}
      {canPay && accountState.isInPaymentPeriod && (
        <div className="mt-5 px-5">
          <motion.button
            className="w-full py-3.5 rounded-xl text-base font-semibold"
            style={{
              background: '#1a1a2e',
              color: '#fff',
            }}
            whileTap={{ scale: 0.97 }}
          >
            Pay €{selectedAmount.toFixed(2)}
          </motion.button>
          <button
            className="w-full text-center mt-3 text-sm font-medium"
            style={{ color: COLORS.textSecondary }}
          >
            Other amount
          </button>
        </div>
      )}

      {/* Outside period: voluntary pay */}
      {!accountState.isInPaymentPeriod && canPay && (
        <div className="mt-5 px-5">
          <button
            className="w-full py-3.5 rounded-xl text-sm font-medium"
            style={{
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.surfaceBorder}`,
            }}
          >
            Make a voluntary payment
          </button>
        </div>
      )}
    </div>
  );
}
