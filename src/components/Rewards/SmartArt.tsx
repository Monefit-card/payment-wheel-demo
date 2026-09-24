'use client';

import { COLORS } from '@/lib/constants';
import { CASHBACK_RULES } from '@/lib/smartsaver';

/**
 * The Smart Card surface from the deck: near-black, fine concentric rings
 * from the bottom-right corner, and a soft iridescent bloom under them.
 * Shared by the card art and the vault hero so the two read as one product.
 */
export const SMART_SURFACE: React.CSSProperties = {
  background: 'linear-gradient(145deg, #1b1e24 0%, #0a0b0d 55%, #131519 100%)',
  boxShadow: '0 24px 48px -24px rgba(90,120,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)',
};

export function SmartSurfaceLayers() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-radial-gradient(circle at 105% 115%, rgba(255,255,255,0.07) 0 1px, transparent 1.2px 8px)',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: '-20%',
          background: 'conic-gradient(from 210deg at 78% 88%, #9ab8ff, #c9a8ff, #ffb3c8, #a6ecd0, #9ab8ff)',
          mixBlendMode: 'soft-light',
          opacity: 0.6,
          maskImage: 'radial-gradient(circle at 90% 100%, #000 0, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at 90% 100%, #000 0, transparent 70%)',
        }}
      />
    </>
  );
}

/** The Smart Card itself, at any width (credit-card aspect ratio). */
export function SmartCardArt({ width = 260, tilt = false }: { width?: number; tilt?: boolean }) {
  const pct = Math.round(CASHBACK_RULES.maxRate * 100);
  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        ...SMART_SURFACE,
        width,
        aspectRatio: '1.586',
        borderRadius: width * 0.06,
        transform: tilt ? 'perspective(900px) rotateX(8deg) rotateY(-14deg)' : undefined,
      }}
    >
      <SmartSurfaceLayers />
      <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: `${width * 0.07}px ${width * 0.075}px` }}>
        <div className="flex justify-between items-center">
          <span className="font-semibold tracking-[-0.04em]" style={{ fontSize: width * 0.075 }}>
            monefit<span style={{ color: COLORS.smartAccent }}>.</span>
          </span>
          <span className="font-mono tracking-[0.22em]" style={{ fontSize: Math.max(8, width * 0.03), color: 'rgba(255,255,255,0.55)' }}>
            SMART
          </span>
        </div>
        <div
          aria-hidden
          style={{
            width: '15%',
            aspectRatio: '1.3',
            borderRadius: 5,
            background: 'linear-gradient(135deg, #d9dde4, #8d939c 60%, #c9ced6)',
            opacity: 0.9,
          }}
        />
        <div className="flex justify-between items-end">
          <span className="font-mono tracking-[0.14em]" style={{ fontSize: Math.max(8, width * 0.034), color: 'rgba(255,255,255,0.7)' }}>
            CASHBACK → SAVINGS
          </span>
          <span className="font-light leading-none tracking-[-0.04em]" style={{ fontSize: width * 0.12 }}>
            {pct}
            <span style={{ fontSize: '0.4em', color: 'rgba(255,255,255,0.55)', marginLeft: 3 }}>%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
