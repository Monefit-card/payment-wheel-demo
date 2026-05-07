'use client';

import { useState } from 'react';
import { WheelSVG } from './WheelSVG';
import { StagesDrawer } from './StagesDrawer';
import { PaymentStateReturn } from '@/hooks/usePaymentState';
import { COLORS } from '@/lib/constants';
import { formatDueDateShort } from '@/lib/payment-math';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentWheelProps {
  state: PaymentStateReturn;
  onPay?: () => void;
}

export function PaymentWheel({ state, onPay }: PaymentWheelProps) {
  const {
    accountState,
    selectedAmount,
    setAmount,
    minimumPayment,
    zoneInfo,
    showInterest,
    interestProjection,
    isZeroBalance,
    canPay,
  } = state;

  const dueDate = formatDueDateShort(); // "15 May"
  const dueMonthName = dueDate.split(' ')[1]; // "May"
  const isRevolver = accountState.userType === 'revolver';

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col">
      {/* Top bar — back button (left) + static title (centered) */}
      <div className="relative px-5 pt-2 pb-3">
        <button
          aria-label="Back"
          className="absolute left-5 top-2 w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{
            background: '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 3L5 9l6 6"
              stroke={COLORS.textPrimary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="text-center px-12">
          <h1
            className="text-xl font-bold"
            style={{ color: COLORS.textPrimary }}
          >
            Credit card repayment
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: COLORS.textSecondary }}
          >
            Pay by 11:59PM {dueDate}
          </p>
        </div>
      </div>

      {/* Wheel */}
      <div className="mt-4">
        <WheelSVG
          accountState={accountState}
          selectedAmount={selectedAmount}
          minimumPayment={minimumPayment}
          isZeroBalance={isZeroBalance}
          zoneInfo={zoneInfo}
          onAmountChange={setAmount}
          onInfoClick={() => setDrawerOpen(true)}
        />
      </div>

      {/* Interest projection */}
      {canPay && !isZeroBalance && !accountState.isCardBlocked && (
        <div className="px-5 mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={showInterest ? 'interest' : 'no-interest'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="text-sm font-semibold tabular-nums text-center"
                style={{ color: COLORS.textPrimary }}
              >
                {showInterest && interestProjection > 0
                  ? isRevolver
                    ? `Interest projection: €${interestProjection.toFixed(2)} over next 30 days`
                    : `Interest projection: €${interestProjection.toFixed(2)} on 16 ${dueMonthName}`
                  : 'No interest charges'}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Pay button + Other amount */}
      {canPay && (
        <div className="mt-8 px-5">
          <motion.button
            className="w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: '#1a1a2e', color: '#fff' }}
            whileTap={{ scale: 0.97 }}
            onClick={onPay}
          >
            Pay €{selectedAmount.toFixed(2)}
          </motion.button>

          <button
            className="w-full text-center mt-3 text-sm font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            Other amount
          </button>
        </div>
      )}

      {/* Stage descriptions drawer */}
      <StagesDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        accountState={accountState}
        minimumPayment={minimumPayment}
      />
    </div>
  );
}
