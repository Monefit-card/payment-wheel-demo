'use client';

import { COLORS } from '@/lib/constants';
import { IconHome, IconReceipt } from './icons';
import { IconGift } from '@/components/Rewards/icons';

export type Tab = 'home' | 'bills' | 'rewards';

interface TabBarProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

/**
 * Floating Home / Bills / Rewards pill, shared by every tab. Overlays the
 * scroll area, so each tab's content pads its bottom for it.
 */
export function TabBar({ active, onNavigate }: TabBarProps) {
  const tabs = [
    { key: 'home' as const, label: 'Home', icon: (on: boolean) => <IconHome color={COLORS.textPrimary} size={24} filled={on} /> },
    { key: 'bills' as const, label: 'Bills', icon: () => <IconReceipt color={COLORS.textPrimary} size={24} /> },
    { key: 'rewards' as const, label: 'Rewards', icon: (on: boolean) => <IconGift color={COLORS.textPrimary} size={24} filled={on} /> },
  ];

  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[110px] flex justify-center items-end pb-3.5 pointer-events-none"
      style={{
        background: `linear-gradient(rgba(242,242,244,0), ${COLORS.screen} 60%)`,
        zIndex: 7,
      }}
    >
      <div
        className="h-[68px] rounded-[34px] flex items-center px-2 pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map(({ key, label, icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              onClick={on ? undefined : () => onNavigate(key)}
              aria-current={on ? 'page' : undefined}
              className="relative flex flex-col items-center gap-0.5 px-5 py-1"
              style={{ opacity: on ? 1 : 0.55 }}
            >
              {icon(on)}
              <span
                className="text-[11px]"
                style={{ color: COLORS.textPrimary, fontWeight: on ? 700 : 500 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
