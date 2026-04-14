'use client';

import { motion } from 'motion/react';
import { PRESETS, COLORS } from '@/lib/constants';
import { AccountState } from '@/types/payment';

interface PresetButtonsProps {
  onApply: (state: AccountState) => void;
}

export function PresetButtons({ onApply }: PresetButtonsProps) {
  return (
    <div className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLORS.textMuted }}
      >
        Quick Presets
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {PRESETS.map((preset) => (
          <motion.button
            key={preset.name}
            className="text-left px-3 py-2.5 rounded-xl transition-colors"
            style={{
              background: COLORS.background,
              border: `1px solid ${COLORS.surfaceBorder}`,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onApply(preset.state)}
          >
            <div className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>
              {preset.name}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
              {preset.description}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
