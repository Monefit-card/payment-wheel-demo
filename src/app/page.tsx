'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentWheel } from '@/components/PaymentWheel/PaymentWheel';
import { AdminPanel } from '@/components/AdminPanel/AdminPanel';
import { PaymentConfirmation } from '@/components/Confirmation/PaymentConfirmation';
import { usePaymentState } from '@/hooks/usePaymentState';

type Screen = 'wheel' | 'confirm';

function StatusBar() {
  return (
    <div className="relative h-11 flex items-center justify-between px-7 select-none">
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: '#1a1a2e' }}
      >
        9:41
      </span>

      {/* Dynamic island */}
      <div
        className="absolute left-1/2 top-2 -translate-x-1/2 w-[110px] h-[30px] rounded-full"
        style={{ background: '#000' }}
      />

      <div className="flex items-center gap-1.5" style={{ color: '#1a1a2e' }}>
        {/* Signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
          <rect x="9" y="3" width="3" height="8" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
        </svg>
        {/* Wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path
            d="M7.5 9.5a1 1 0 100-2 1 1 0 000 2z"
            fill="currentColor"
          />
          <path
            d="M2.5 5.5a7 7 0 0110 0M4.5 7.3a4.4 4.4 0 016 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {/* Battery */}
        <svg width="25" height="11" viewBox="0 0 25 11" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="21"
            height="10"
            rx="2.5"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect x="2" y="2" width="18" height="7" rx="1.2" fill="currentColor" />
          <rect
            x="22.5"
            y="3.5"
            width="1.5"
            height="4"
            rx="0.5"
            fill="currentColor"
            fillOpacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
}

export default function Home() {
  const paymentState = usePaymentState();
  const [screen, setScreen] = useState<Screen>('wheel');

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-start py-6 px-4"
      style={{ background: '#f5f5f7' }}
    >
      <div
        className="w-full max-w-[390px] rounded-[44px] overflow-hidden flex flex-col"
        style={{
          background: '#ffffff',
          minHeight: '780px',
          boxShadow:
            '0 1px 3px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
        }}
      >
        <StatusBar />

        <div className="flex-1 flex flex-col pb-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {screen === 'wheel' ? (
              <motion.div
                key="wheel"
                className="flex-1 flex flex-col"
                initial={{ x: '-24px', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-24px', opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              >
                <PaymentWheel
                  state={paymentState}
                  onPay={() => setScreen('confirm')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                className="flex-1 flex flex-col pt-2"
                initial={{ x: '24px', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '24px', opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              >
                <PaymentConfirmation
                  amount={paymentState.selectedAmount}
                  onBack={() => setScreen('wheel')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AdminPanel
        accountState={paymentState.accountState}
        onAccountStateChange={paymentState.setAccountState}
        onApplyPreset={paymentState.applyPreset}
      />
    </main>
  );
}
