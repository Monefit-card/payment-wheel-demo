'use client';

import { COLORS } from '@/lib/constants';

interface IconProps {
  size?: number;
  color?: string;
}

/** Rewards tab glyph — a gift box. `filled` is the active state. */
export function IconGift({
  size = 24,
  color = COLORS.textPrimary,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="8" width="17" height="4" rx="1.2" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.6" />
      <rect x="5" y="12" width="14" height="8.5" rx="1.6" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.6" />
      <path d="M12 8v12.5" stroke={filled ? COLORS.textWhite : color} strokeWidth="1.6" />
      <path
        d="M12 8C10.5 5 7.5 4.5 7.5 6.5S10.5 8 12 8zm0 0c1.5-3 4.5-3.5 4.5-1.5S13.5 8 12 8z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLock({ size = 14, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke={color} strokeWidth="1.9" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** Vault door — the Cashback Vault's mark. */
export function IconVault({ size = 22, color = COLORS.textPrimary }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3.5" width="18" height="16" rx="3" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="11.5" r="4" stroke={color} strokeWidth="1.6" />
      <path d="M12 7.5v1.6M12 13.9v1.6M8 11.5h1.6M14.4 11.5H16" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6.5 19.5v1.5M17.5 19.5v1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Coin with a return arrow — "cashback". */
export function IconCashback({ size = 14, color = COLORS.cashback }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M9 10.5l3-3 3 3M12 7.5v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** SmartSaver's app mark — a stand-in, not the real logo. */
export function SmartSaverMark({ size = 40 }: { size?: number }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: 'linear-gradient(145deg, #1f3b8f 0%, #3f34c9 60%, #6c8dff 100%)',
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M4 16l5-5 4 4 7-8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h5v5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
