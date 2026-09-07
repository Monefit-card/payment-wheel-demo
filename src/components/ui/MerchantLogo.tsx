'use client';

import { COLORS } from '@/lib/constants';
import { merchantLogo } from '@/lib/merchants';

interface MerchantLogoProps {
  /** Merchant key from `Txn.icon` — resolved against `public/merchants/`. */
  icon: string;
  size?: number;
  /** Corner radius in px. Defaults to a squircle-ish 13. */
  radius?: number;
  className?: string;
}

/**
 * Merchant tile. A CSS background rather than an `<img>`: the logos are
 * decorative, differently proportioned, and always cover a fixed square.
 */
export function MerchantLogo({ icon, size = 44, radius = 13, className = '' }: MerchantLogoProps) {
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `url(${merchantLogo(icon)}) center / cover no-repeat, ${COLORS.surface}`,
        border: `0.5px solid ${COLORS.hairline}`,
      }}
    />
  );
}
