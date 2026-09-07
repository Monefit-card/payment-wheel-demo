'use client';

import { COLORS } from '@/lib/constants';

interface CardProps {
  children: React.ReactNode;
  /** Layout classes — padding, flex, spacing. Colours stay in `style`. */
  className?: string;
  style?: React.CSSProperties;
  /** Corner radius in px. 18 is the list-card default; 24 the Home-card one. */
  radius?: number;
}

/**
 * The white surface every ported screen is built from — rounded, hairline
 * shadow, no border. Layout comes from `className`; the card only owns its
 * background, radius and shadow.
 */
export function Card({ children, className = '', style, radius = 18 }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: COLORS.surface,
        borderRadius: radius,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
