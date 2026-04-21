'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentWheel } from '@/components/PaymentWheel/PaymentWheel';
import { AdminPanel } from '@/components/AdminPanel/AdminPanel';
import { PaymentConfirmation } from '@/components/Confirmation/PaymentConfirmation';
import { usePaymentState } from '@/hooks/usePaymentState';

type Screen = 'wheel' | 'confirm';

export default function Home() {
  const paymentState = usePaymentState();
  const [screen, setScreen] = useState<Screen>('wheel');

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-start pt-10 pb-6 px-4"
      style={{ background: '#f5f5f7' }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {screen === 'wheel' ? (
            <motion.div
              key="wheel"
              className="py-6 pb-8"
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
              className="py-6 pb-8"
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

      <AdminPanel
        accountState={paymentState.accountState}
        onAccountStateChange={paymentState.setAccountState}
        onApplyPreset={paymentState.applyPreset}
      />
    </main>
  );
}
