'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS } from '@/lib/constants';
import { SavedMethod, MethodType } from './ManagePaymentMethods';

declare global {
  interface Window {
    Frames: {
      init: (config: object) => void;
      isCardValid: () => boolean;
      submitCard: () => void;
      addEventHandler: (event: string, handler: (e?: any) => void) => void;
      Events: Record<string, string>;
    };
  }
}

const CKO_PUBLIC_KEY = 'pk_test_6e40a700-d563-43cd-89d0-f9bb17d35e73';

interface AddMethodSheetProps {
  /** IDs of wallet methods already saved, to show linked state */
  linkedWalletIds: Set<string>;
  onClose: () => void;
  onAdded: (method: SavedMethod) => void;
}

export function AddMethodSheet({ linkedWalletIds, onClose, onAdded }: AddMethodSheetProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'wallets'>('card');
  const [cardValid, setCardValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!scriptReady || initialized.current || activeTab !== 'card') return;
    if (typeof window === 'undefined' || !window.Frames) return;
    try {
      window.Frames.init({
        publicKey: CKO_PUBLIC_KEY,
        style: {
          base: {
            color: COLORS.textPrimary,
            fontSize: '15px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSmoothing: 'antialiased',
          },
          placeholder: { base: { color: COLORS.textMuted, fontSize: '15px' } },
        },
      });
      window.Frames.addEventHandler(
        window.Frames.Events.CARD_VALIDATION_CHANGED,
        () => setCardValid(window.Frames.isCardValid()),
      );
      window.Frames.addEventHandler(window.Frames.Events.CARD_TOKENIZED, (e) => {
        setIsProcessing(false);
        const scheme = (e?.scheme ?? 'visa').toLowerCase();
        const type: MethodType =
          scheme.includes('mastercard') ? 'mastercard'
          : scheme.includes('amex') ? 'amex'
          : 'visa';
        onAdded({
          id: `card-${Date.now()}`,
          type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          sublabel: `•••• ${e?.last4 ?? '----'}  ·  Added just now`,
        });
        onClose();
      });
      window.Frames.addEventHandler(
        window.Frames.Events.CARD_TOKENIZATION_FAILED,
        () => setIsProcessing(false),
      );
      initialized.current = true;
    } catch { /* demo env */ }
  }, [scriptReady, activeTab, onAdded, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!window?.Frames || !cardValid) return;
    setIsProcessing(true);
    window.Frames.submitCard();
  };

  const handleAddWallet = (type: 'apple_pay' | 'google_pay') => {
    if (linkedWalletIds.has(type)) { onClose(); return; }
    onAdded({ id: type, type, label: type === 'apple_pay' ? 'Apple Pay' : 'Google Pay' });
    onClose();
  };

  const walletLinked = (type: 'apple_pay' | 'google_pay') => linkedWalletIds.has(type);

  return (
    <>
      <Script
        src="https://cdn.checkout.com/js/framesv2.min.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 inset-x-0 mx-auto z-50 rounded-t-3xl max-w-md overflow-hidden"
        style={{ background: '#ffffff' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: COLORS.surfaceBorder }} />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="w-8" />
          <h2 className="text-base font-bold" style={{ color: COLORS.textPrimary }}>
            Add payment method
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: COLORS.background }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke={COLORS.textSecondary} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="px-5 mb-5">
          <div className="flex rounded-xl p-1 gap-1" style={{ background: COLORS.background }}>
            {(['card', 'wallets'] as const).map((tab) => (
              <button
                key={tab}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: activeTab === tab ? '#ffffff' : 'transparent',
                  color: activeTab === tab ? COLORS.textPrimary : COLORS.textSecondary,
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'card' ? 'Debit / Credit card' : 'Digital wallets'}
              </button>
            ))}
          </div>
        </div>

        {/* Card form */}
        {activeTab === 'card' && (
          <form onSubmit={handleSubmit} className="px-5 pb-8">
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>
                Card number
              </label>
              <div className="card-number-frame rounded-xl px-3.5"
                style={{ height: '48px', border: `1.5px solid ${COLORS.surfaceBorder}`, background: '#ffffff' }} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>
                  Expiry
                </label>
                <div className="expiry-date-frame rounded-xl px-3.5"
                  style={{ height: '48px', border: `1.5px solid ${COLORS.surfaceBorder}`, background: '#ffffff' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>
                  Security code
                </label>
                <div className="cvv-frame rounded-xl px-3.5"
                  style={{ height: '48px', border: `1.5px solid ${COLORS.surfaceBorder}`, background: '#ffffff' }} />
              </div>
            </div>
            <motion.button
              type="submit"
              className="w-full py-3.5 rounded-xl text-base font-semibold"
              style={{
                background: cardValid ? '#1a1a2e' : COLORS.surfaceBorder,
                color: cardValid ? '#ffffff' : COLORS.textMuted,
                cursor: cardValid ? 'pointer' : 'not-allowed',
              }}
              whileTap={cardValid ? { scale: 0.97 } : undefined}
              disabled={!cardValid || isProcessing}
            >
              {isProcessing ? 'Adding card…' : 'Add card'}
            </motion.button>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="4" width="12" height="9" rx="1.5" stroke={COLORS.textMuted} strokeWidth="1.2" />
                <path d="M4 4V3a3 3 0 016 0v1" stroke={COLORS.textMuted} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                Secured by <span className="font-semibold" style={{ color: COLORS.textSecondary }}>Checkout.com</span>
              </span>
            </div>
          </form>
        )}

        {/* Digital wallets */}
        {activeTab === 'wallets' && (
          <div className="px-5 pb-8 space-y-3">
            <motion.button
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-base font-semibold"
              style={walletLinked('apple_pay')
                ? { background: '#f5f5f7', color: COLORS.textMuted, cursor: 'default' }
                : { background: '#000000', color: '#ffffff' }}
              whileTap={walletLinked('apple_pay') ? undefined : { scale: 0.97 }}
              onClick={() => handleAddWallet('apple_pay')}
              disabled={walletLinked('apple_pay')}
            >
              {walletLinked('apple_pay') ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke={COLORS.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Apple Pay linked
                </>
              ) : (
                <>
                  <svg width="18" height="22" viewBox="0 0 18 22" fill="white">
                    <path d="M14.98 11.49c-.02-2.15 1.76-3.19 1.84-3.24-1-1.47-2.56-1.67-3.12-1.69-1.33-.13-2.6.78-3.27.78-.67 0-1.7-.76-2.8-.74-1.44.02-2.77.84-3.51 2.13-1.5 2.6-.38 6.45 1.07 8.56.71 1.03 1.56 2.19 2.67 2.15 1.07-.04 1.48-.69 2.78-.69 1.3 0 1.67.69 2.8.67 1.15-.02 1.89-1.05 2.59-2.09.82-1.2 1.16-2.36 1.18-2.42-.03-.01-2.22-.85-2.23-3.42zM12.89 4.77c.59-.72.99-1.72.88-2.72-.85.03-1.88.57-2.49 1.27-.55.63-1.02 1.65-.89 2.62.94.07 1.89-.47 2.5-1.17z" />
                  </svg>
                  Pay with Apple Pay
                </>
              )}
            </motion.button>

            <motion.button
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-base font-semibold"
              style={walletLinked('google_pay')
                ? { background: '#f5f5f7', color: COLORS.textMuted, cursor: 'default', border: 'none' }
                : { background: '#ffffff', color: '#1a1a2e', border: `1.5px solid ${COLORS.surfaceBorder}` }}
              whileTap={walletLinked('google_pay') ? undefined : { scale: 0.97 }}
              onClick={() => handleAddWallet('google_pay')}
              disabled={walletLinked('google_pay')}
            >
              {walletLinked('google_pay') ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke={COLORS.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Google Pay linked
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                  </svg>
                  Pay with Google Pay
                </>
              )}
            </motion.button>

            <div className="pt-2 flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="4" width="12" height="9" rx="1.5" stroke={COLORS.textMuted} strokeWidth="1.2" />
                <path d="M4 4V3a3 3 0 016 0v1" stroke={COLORS.textMuted} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                Secured by <span className="font-semibold" style={{ color: COLORS.textSecondary }}>Checkout.com</span>
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
