'use client';

import { useState } from 'react';
import { WheelSVG } from './WheelSVG';
import { StagesDrawer } from './StagesDrawer';
import {
  BrandMark,
  ChooseMethodSheet,
  DEFAULT_METHOD_ID,
  getMethodBrand,
  getMethodShortLabel,
} from '@/components/PaymentMethods/ChooseMethodSheet';
import { ProjectionBox } from '@/components/ui/ProjectionBox';
import { PaymentStateReturn } from '@/hooks/usePaymentState';
import { COLORS } from '@/lib/constants';
import { formatDueDateShort } from '@/lib/payment-math';
import { round2 } from '@/lib/flex-math';
import { motion } from 'motion/react';

interface PaymentWheelProps {
  state: PaymentStateReturn;
  onBack?: () => void;
  onPay?: () => void;
  /** Opens Flex from the drawer's Flex line. */
  onOpenFlex?: () => void;
}

export function PaymentWheel({ state, onBack, onPay, onOpenFlex }: PaymentWheelProps) {
  const {
    accountState,
    selectedAmount,
    setAmount,
    minimumPayment,
    creditMinimum,
    flexDueAmount,
    flexFutureAmount,
    settlementTotal,
    flexSpread,
    zoneInfo,
    zoneEducation,
    showInterest,
    interestProjection,
    flexInterestSaved,
    isZeroBalance,
    canPay,
  } = state;

  const dueDate = formatDueDateShort(); // "15 May"
  const dueMonthName = dueDate.split(' ')[1]; // "May"
  const isRevolver = accountState.userType === 'revolver';
  const hasFlex = flexFutureAmount > 0;
  /**
   * Interest the plans will still charge. A payment above the card balance is
   * spread across the future instalments, so this falls as the handle climbs
   * through them and reaches zero once every plan is settled.
   */
  const flexInterest = flexSpread ? flexSpread.interestAfter : flexInterestSaved;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [methodId, setMethodId] = useState(DEFAULT_METHOD_ID);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1">
      {/* Top bar — back button (left) + static title (centered) */}
      <div className="relative px-5 pt-2 pb-3">
        <button
          aria-label="Back"
          onClick={onBack}
          className="absolute left-5 top-1 w-11 h-11 flex items-center justify-center rounded-[15px]"
          style={{
            background: COLORS.surface,
            boxShadow: '0 1px 2px rgba(17,17,19,0.05), 0 2px 8px rgba(17,17,19,0.04)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M16 10H4.5M9 4.5L3.5 10 9 15.5"
              stroke={COLORS.textPrimary}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          onClick={() => setMethodSheetOpen(true)}
          aria-label="Change payment method"
          className="absolute right-5 top-1 h-11 px-2.5 flex items-center gap-1.5 rounded-[15px]"
          style={{
            background: COLORS.surface,
            boxShadow: '0 1px 2px rgba(17,17,19,0.05), 0 2px 8px rgba(17,17,19,0.04)',
          }}
        >
          <BrandMark brand={getMethodBrand(methodId)} width={26} />
          {getMethodShortLabel(methodId) && (
            <span
              className="text-[14px] tabular-nums"
              style={{ color: COLORS.textPrimary }}
            >
              {getMethodShortLabel(methodId)}
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3.5 5.5L7 9l3.5-3.5"
              stroke={COLORS.textSecondary}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="text-center px-28">
          <h1
            className="text-[21px] font-bold tracking-tight"
            style={{ color: COLORS.textPrimary }}
          >
            Repayment
          </h1>
        </div>
      </div>

      {/* Wheel */}
      <div className="mt-8 px-4">
        <WheelSVG
          accountState={accountState}
          selectedAmount={selectedAmount}
          minimumPayment={minimumPayment}
          creditMinimum={creditMinimum}
          isZeroBalance={isZeroBalance}
          zoneInfo={zoneInfo}
          accountTotalBalance={round2(accountState.totalBalance + flexFutureAmount)}
          settlementTotal={settlementTotal}
          balanceLabel={hasFlex ? 'Total balance' : 'Balance'}
          onAmountChange={setAmount}
          onInfoClick={() => setDrawerOpen(true)}
        />
      </div>

      {/* Interest projections — the card's, and the plans' */}
      {canPay && !isZeroBalance && !accountState.isCardBlocked && (
        <div className="px-5 mt-6 flex gap-3">
          <ProjectionBox
            label={
              isRevolver
                ? 'Card interest in 30 days'
                : `Card interest on 16 ${dueMonthName.slice(0, 3)}`
            }
            amount={showInterest ? interestProjection : 0}
          />

          {hasFlex && <ProjectionBox label="Flex interest" amount={flexInterest} />}
        </div>
      )}

      {/* Payment method + pay CTA — pinned to bottom */}
      {canPay && (
        <div className="mt-auto pt-8 pb-8 px-5">
          <motion.button
            className="w-full py-[15px] rounded-2xl text-[17px] font-semibold"
            style={{ background: COLORS.ctaBackground, color: COLORS.textWhite }}
            whileTap={{ scale: 0.97 }}
            onClick={onPay}
          >
            Pay €{selectedAmount.toFixed(2)}
          </motion.button>

          <button
            className="w-full text-center mt-4 text-[16px] font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            Other amount
          </button>
        </div>
      )}

      {/* Payment-method picker */}
      <ChooseMethodSheet
        isOpen={methodSheetOpen}
        selectedId={methodId}
        onSelect={(id) => {
          setMethodId(id);
          setMethodSheetOpen(false);
        }}
        onClose={() => setMethodSheetOpen(false)}
      />

      {/* Current-stage description drawer. `zoneEducation` already names the
          Flex slice in prose; the amount is passed separately so the drawer can
          also show it as a figure. */}
      <StagesDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        zoneInfo={zoneInfo}
        description={zoneEducation}
        flexDueAmount={flexDueAmount}
        onOpenFlex={onOpenFlex}
      />
    </div>
  );
}
