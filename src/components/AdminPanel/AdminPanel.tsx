'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminControls } from './AdminControls';
import { PresetButtons } from './PresetButtons';
import { COLORS } from '@/lib/constants';
import { AccountState } from '@/types/payment';

interface AdminPanelProps {
  accountState: AccountState;
  onAccountStateChange: (state: AccountState) => void;
  onApplyPreset: (state: AccountState) => void;
}

export function AdminPanel({
  accountState,
  onAccountStateChange,
  onApplyPreset,
}: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: '#ffffff',
          border: `1px solid ${COLORS.surfaceBorder}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
            stroke={COLORS.textSecondary}
            strokeWidth="1.5"
          />
          <path
            d="M14.7 11.1a1.2 1.2 0 00.24 1.32l.04.04a1.457 1.457 0 11-2.06 2.06l-.04-.04a1.2 1.2 0 00-1.32-.24 1.2 1.2 0 00-.73 1.1v.11a1.455 1.455 0 11-2.91 0v-.06a1.2 1.2 0 00-.78-1.1 1.2 1.2 0 00-1.32.24l-.04.04a1.457 1.457 0 11-2.06-2.06l.04-.04a1.2 1.2 0 00.24-1.32 1.2 1.2 0 00-1.1-.73h-.11a1.455 1.455 0 110-2.91h.06a1.2 1.2 0 001.1-.78 1.2 1.2 0 00-.24-1.32l-.04-.04a1.457 1.457 0 112.06-2.06l.04.04a1.2 1.2 0 001.32.24h.06a1.2 1.2 0 00.73-1.1v-.11a1.455 1.455 0 112.91 0v.06a1.2 1.2 0 00.73 1.1 1.2 1.2 0 001.32-.24l.04-.04a1.457 1.457 0 112.06 2.06l-.04.04a1.2 1.2 0 00-.24 1.32v.06a1.2 1.2 0 001.1.73h.11a1.455 1.455 0 110 2.91h-.06a1.2 1.2 0 00-1.1.73z"
            stroke={COLORS.textSecondary}
            strokeWidth="1.5"
          />
        </svg>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
            style={{
              width: 'min(320px, 85vw)',
              background: '#ffffff',
              borderLeft: `1px solid ${COLORS.surfaceBorder}`,
              boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>
                  Admin Panel
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: COLORS.background }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke={COLORS.textSecondary} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <PresetButtons onApply={onApplyPreset} />

              <div className="h-px" style={{ background: COLORS.surfaceBorder }} />

              <AdminControls state={accountState} onChange={onAccountStateChange} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
