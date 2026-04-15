'use client';

import { WheelSVG } from './WheelSVG';
import { PaymentStateReturn } from '@/hooks/usePaymentState';
import { COLORS } from '@/lib/constants';
import { formatDueDateShort } from '@/lib/payment-math';
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

  const dueMonth = formatDueDateShort();
  const isAtZero = selectedAmount <= 0;
  const isRevolver = accountState.userType === 'revolver';

  // Title logic: at 0 show default, otherwise show zone title
  const title = isAtZero || isZeroBalance
    ? 'Choose amount'
    : accountState.isCardBlocked
    ? 'Card blocked'
    : zoneInfo.title;

  // Subtitle logic: at 0 show due date, otherwise show zone description
  const subtitle = isAtZero || isZeroBalance
    ? `Pay by 11:59PM on ${dueMonth}`
    : accountState.isCardBlocked
    ? 'Pay the minimum amount to unblock your card and restore access.'
    : zoneInfo.description;

  return (
    <div className="w-full max-w-md mx-auto">

      {/* 1. Title + subtitle (fused) */}
      <div className="text-center px-5 relative">
        <button
          className="absolute top-0 right-5 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: COLORS.textSecondary }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={isAtZero ? 'default' : accountState.isCardBlocked ? 'blocked' : zone}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <h1
              className="text-xl font-bold"
              style={{ color: accountState.isCardBlocked && !isAtZero ? COLORS.textDanger : COLORS.textPrimary }}
            >
              {title}
            </h1>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textSecondary }}>
              {subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 2. Wheel */}
      <div className="mt-2">
        <WheelSVG
          accountState={accountState}
          selectedAmount={selectedAmount}
          minimumPayment={minimumPayment}
          isZeroBalance={isZeroBalance}
          onAmountChange={setAmount}
        />
      </div>

      {/* 3. Interest projection — under wheel */}
      {canPay && !isZeroBalance && (
        <div className="px-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={showInterest ? 'interest' : 'no-interest'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <div className="text-xs tabular-nums text-center" style={{ color: COLORS.textSecondary }}>
                {showInterest && interestProjection > 0
                  ? isRevolver
                    ? `Interest projection: €${interestProjection.toFixed(2)} over next 30 days`
                    : `Interest projection: €${interestProjection.toFixed(2)} on 16 ${dueMonth.split(' ')[1]}`
                  : 'No interest charges'
                }
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* 4. Pay button */}
      {canPay && (
        <div className="mt-2 px-5">
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

          {/* 5. Other amount */}
          <button
            className="w-full text-center mt-3 text-sm font-medium"
            style={{ color: COLORS.textSecondary }}
          >
            Other amount
          </button>
        </div>
      )}
    </div>
  );
}
