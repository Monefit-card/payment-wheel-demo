'use client';

import { COLORS } from '@/lib/constants';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** 'dark' is the default CTA; 'light' is the secondary, outlined form. */
  variant?: 'dark' | 'light';
  type?: 'button' | 'submit';
  className?: string;
}

/**
 * Full-width CTA — the prototype's `FlexBtn`. Lives in an overlay's footer or
 * at the end of a sheet.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  variant = 'dark',
  type = 'button',
  className = '',
}: PrimaryButtonProps) {
  const light = variant === 'light';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl text-base font-semibold ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      } ${className}`}
      style={{
        background: disabled
          ? COLORS.buttonDisabled
          : light
            ? COLORS.surface
            : COLORS.ctaBackground,
        color: light ? COLORS.textPrimary : COLORS.textWhite,
        border: light ? `0.5px solid ${COLORS.hairline}` : 'none',
      }}
    >
      {children}
    </button>
  );
}
