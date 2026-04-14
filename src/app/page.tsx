'use client';

import { PaymentWheel } from '@/components/PaymentWheel/PaymentWheel';
import { AdminPanel } from '@/components/AdminPanel/AdminPanel';
import { usePaymentState } from '@/hooks/usePaymentState';

export default function Home() {
  const paymentState = usePaymentState();

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-start pt-10 pb-6 px-4"
      style={{ background: '#f5f5f7' }}
    >
      <div
        className="w-full max-w-md rounded-3xl py-6 pb-8"
        style={{
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
        }}
      >
        <PaymentWheel state={paymentState} />
      </div>

      <AdminPanel
        accountState={paymentState.accountState}
        onAccountStateChange={paymentState.setAccountState}
        onApplyPreset={paymentState.applyPreset}
      />
    </main>
  );
}
