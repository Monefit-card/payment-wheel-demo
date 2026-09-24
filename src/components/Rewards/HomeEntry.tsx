'use client';

import { motion } from 'motion/react';
import { ChevronRight } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { CashbackLedger, CASHBACK_RULES } from '@/lib/smartsaver';
import { eur } from './format';
import { SMART_SURFACE, SmartCardArt, SmartSurfaceLayers } from './SmartArt';
import { IconVault } from './icons';

/** Home promo slide for customers who haven't linked yet. Opens Rewards. */
export function SmartCardBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="relative w-full h-full overflow-hidden rounded-[24px] text-left text-white"
      style={SMART_SURFACE}
    >
      <SmartSurfaceLayers />
      <div className="relative pl-5 pr-[118px] py-6">
        <div className="text-[19px] font-bold leading-tight">
          {Math.round(CASHBACK_RULES.maxRate * 100)}% cashback into savings
        </div>
      </div>
      <div className="absolute -right-6 bottom-4 pointer-events-none" style={{ transform: 'rotate(-12deg)' }}>
        <SmartCardArt width={130} />
      </div>
    </motion.button>
  );
}

/** Home widget once linked — the vault balance. */
export function VaultWidget({ ledger, onOpen }: { ledger: CashbackLedger; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full mt-4 flex items-center gap-3.5 px-5 py-4 rounded-[24px] text-left"
      style={{ background: COLORS.surface, boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.04)' }}
    >
      <div
        className="relative overflow-hidden shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center"
        style={SMART_SURFACE}
      >
        <SmartSurfaceLayers />
        <span className="relative">
          <IconVault size={20} color="#fff" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap" style={{ color: COLORS.textSecondary }}>
          Cashback Vault
        </span>
        <div className="text-[22px] font-bold tabular-nums leading-tight" style={{ color: COLORS.textPrimary }}>
          {eur(ledger.vaultBalance)}
        </div>
      </div>
      <ChevronRight size={18} color={COLORS.textPrimary} />
    </button>
  );
}
