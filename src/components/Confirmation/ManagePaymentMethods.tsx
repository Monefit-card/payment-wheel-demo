/**
 * Shared payment-method types and brand icon.
 * Imported by PaymentConfirmation and AddMethodSheet.
 */

/* ── Types ── */
export type MethodType = 'visa' | 'mastercard' | 'amex' | 'apple_pay' | 'google_pay';

export interface SavedMethod {
  id: string;
  type: MethodType;
  label: string;
  sublabel?: string;
}

/* ── Brand icon ── */
export function BrandIcon({ type }: { type: MethodType }) {
  switch (type) {
    case 'visa':
      return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
          <rect width="36" height="22" rx="3" fill="#1A1F71" />
          <text x="5" y="15.5" fill="white" fontSize="10.5" fontWeight="bold"
            fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="0.5">
            VISA
          </text>
        </svg>
      );
    case 'mastercard':
      return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
          <circle cx="13" cy="11" r="9" fill="#EB001B" />
          <circle cx="23" cy="11" r="9" fill="#F79E1B" fillOpacity="0.9" />
          <path d="M18 3.83a9 9 0 010 14.34A9 9 0 0118 3.83z" fill="#FF5F00" />
        </svg>
      );
    case 'amex':
      return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
          <rect width="36" height="22" rx="3" fill="#2E77BC" />
          <text x="4" y="15" fill="white" fontSize="8.5" fontWeight="bold"
            fontFamily="Arial, sans-serif" letterSpacing="0.3">
            AMEX
          </text>
        </svg>
      );
    case 'apple_pay':
      return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
          <rect width="36" height="22" rx="3" fill="#000" />
          <text x="5" y="14.5" fill="white" fontSize="7.5" fontWeight="500"
            fontFamily="-apple-system, sans-serif" letterSpacing="0.2">
            Apple Pay
          </text>
        </svg>
      );
    case 'google_pay':
      return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
          <rect width="36" height="22" rx="3" fill="#fff" stroke="#E5E7EB" />
          <text x="5" y="14.5" fill="#1a1a2e" fontSize="7.5" fontWeight="500"
            fontFamily="sans-serif">
            G Pay
          </text>
        </svg>
      );
    default:
      return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
          <rect width="36" height="22" rx="3" fill="#e5e7eb" />
        </svg>
      );
  }
}
