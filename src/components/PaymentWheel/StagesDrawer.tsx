'use client';

import { motion, AnimatePresence } from 'motion/react';
import { COLORS } from '@/lib/constants';
import { ZoneInfo } from '@/types/payment';

interface StagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  zoneInfo: ZoneInfo;
  description: string;
}

export function StagesDrawer({
  isOpen,
  onClose,
  zoneInfo,
  description,
}: StagesDrawerProps) {
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
                {zoneInfo.title}
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

            {/* Body */}
            <div className="px-5 pb-8 pt-1">
              <p
                className="text-sm leading-relaxed"
                style={{ color: COLORS.textSecondary }}
              >
                {description}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
