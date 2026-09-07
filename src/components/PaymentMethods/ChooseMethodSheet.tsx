'use client';

import { COLORS } from '@/lib/constants';

/**
 * Brands this sheet can render a mark for. Deliberately narrower than the
 * `MethodType` the confirmation screen uses — these marks are drawn at sheet
 * scale and the union stays total, so adding a brand forces adding its mark.
 */
export type MethodBrand = 'apple_pay' | 'mastercard';

export interface PaymentMethod {
  id: string;
  brand: MethodBrand;
  label: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'apple-pay', brand: 'apple_pay', label: 'Apple Pay' },
  { id: 'wise-4321', brand: 'mastercard', label: 'Wise **4321' },
  { id: 'lhv-4069', brand: 'mastercard', label: 'LHV **4069' },
];

export const DEFAULT_METHOD_ID = 'lhv-4069';

export function getMethodLabel(id: string): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? '';
}

/**
 * Compact form for the header control: the card's last four, or nothing for
 * wallets whose mark already names them.
 */
export function getMethodShortLabel(id: string): string {
  const match = /\*\*(\d{4})/.exec(getMethodLabel(id));
  return match ? match[1] : '';
}

export function getMethodBrand(id: string): MethodBrand {
  return PAYMENT_METHODS.find((m) => m.id === id)?.brand ?? 'mastercard';
}

/* ── Brand marks ── */

interface MarkSize {
  width: number;
  height: number;
}

/** Apple Pay badge — black glyph on white, hairline bordered. */
function ApplePayMark({ width, height }: MarkSize) {
  return (
    <svg width={width} height={height} viewBox="0 0 42 27" fill="none">
      <rect
        x="0.6"
        y="0.6"
        width="40.8"
        height="25.8"
        rx="4.4"
        fill="#ffffff"
        stroke="#c7c7cc"
        strokeWidth="1.2"
      />
      {/* Apple glyph */}
      <g fill={COLORS.textPrimary} transform="translate(-5.4 -2.75) scale(1.3)">
        <path d="M13.9 9.2c-.35.42-.9.74-1.36.7-.06-.46.17-.95.49-1.26.35-.36.94-.63 1.42-.65.05.48-.15.96-.55 1.21z" />
        <path d="M14.5 10.2c-.75-.04-1.39.42-1.75.42-.36 0-.9-.4-1.49-.39-.76.01-1.47.44-1.86 1.12-.79 1.37-.21 3.4.56 4.52.38.55.83 1.16 1.42 1.14.56-.02.78-.36 1.47-.36s.88.37 1.48.36c.61-.01 1-.56 1.38-1.11.43-.63.6-1.24.61-1.27-.01-.01-1.18-.46-1.19-1.81-.01-1.13.92-1.67.96-1.7-.53-.77-1.34-.86-1.62-.87z" />
      </g>
      <text
        x="17.6"
        y="18.2"
        fill={COLORS.textPrimary}
        fontSize="11.5"
        fontWeight="600"
        fontFamily="-apple-system, Helvetica, Arial, sans-serif"
        letterSpacing="-0.1"
      >
        Pay
      </text>
    </svg>
  );
}

/** Mastercard — the two interlocking circles. */
function MastercardMark({ width, height }: MarkSize) {
  return (
    <svg width={width} height={height} viewBox="0 0 42 27" fill="none">
      <circle cx="16.6" cy="13.5" r="8.4" fill="#eb001b" />
      <circle cx="25.4" cy="13.5" r="8.4" fill="#f79e1b" />
      <path
        d="M21 6.6a8.4 8.4 0 000 13.8 8.4 8.4 0 000-13.8z"
        fill="#ff5f00"
      />
    </svg>
  );
}

export function BrandMark({
  brand,
  width = 42,
}: {
  brand: MethodBrand;
  width?: number;
}) {
  const size = { width, height: Math.round((width * 27) / 42) };
  return brand === 'apple_pay' ? (
    <ApplePayMark {...size} />
  ) : (
    <MastercardMark {...size} />
  );
}

/* ── Selection control ── */

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: selected ? COLORS.ctaBackground : 'transparent',
        border: selected ? 'none' : `1.8px solid ${COLORS.textPrimary}`,
      }}
    >
      {selected && (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M3.4 7.9l2.7 2.7 5.5-6"
            stroke={COLORS.textWhite}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

/* ── Sheet ── */

interface ChooseMethodSheetProps {
  isOpen: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onAddNew?: () => void;
  onClose: () => void;
}

/**
 * Payment-method picker. Kept mounted and driven by CSS transitions rather than
 * an animated mount, matching StagesDrawer: a dropped frame callback
 * (backgrounded tab) would otherwise leave the sheet parked mid-slide.
 */
export function ChooseMethodSheet({
  isOpen,
  selectedId,
  onSelect,
  onAddNew,
  onClose,
}: ChooseMethodSheetProps) {
  return (
    <div
      className={`absolute inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop — dims and blurs the screen behind the sheet */}
      <div
        onClick={onClose}
        className="absolute"
        style={{
          // Overshoots the top so the status-bar strip dims too — the phone
          // frame's overflow-hidden clips the excess.
          top: -200,
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(20,20,22,0.42)',
          backdropFilter: 'blur(9px)',
          WebkitBackdropFilter: 'blur(9px)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.24s ease',
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose payment method"
        className="absolute bottom-0 inset-x-0 rounded-t-[26px] overflow-hidden"
        style={{
          background: COLORS.surface,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: '#d6d6db' }}
          />
        </div>

        {/* Header — centred title, close control on the right */}
        <div className="relative px-5 pt-6 pb-4">
          <h2
            className="text-[20px] font-bold text-center px-12"
            style={{ color: COLORS.textPrimary }}
          >
            Choose payment method
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-4 w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.surfaceBorder}`,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M1 1l11 11M12 1L1 12"
                stroke={COLORS.textPrimary}
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Methods */}
        <div className="px-4 pt-6">
          <div
            className="rounded-[20px] px-4 py-1"
            style={{ border: `1px solid ${COLORS.surfaceBorder}` }}
            role="radiogroup"
            aria-label="Saved payment methods"
          >
            {PAYMENT_METHODS.map((method) => {
              const isSelected = method.id === selectedId;

              return (
                <button
                  key={method.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(method.id)}
                  className="w-full flex items-center gap-4 py-3.5"
                >
                  <BrandMark brand={method.brand} />

                  <span
                    className="flex-1 min-w-0 text-left text-[16px] font-semibold truncate"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {method.label}
                  </span>

                  <SelectionDot selected={isSelected} />
                </button>
              );
            })}

            <button
              onClick={onAddNew}
              className="w-full flex items-center justify-center gap-2 py-4"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M7.5 1.6v11.8M1.6 7.5h11.8"
                  stroke={COLORS.textPrimary}
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="text-[16px] font-semibold"
                style={{ color: COLORS.textPrimary }}
              >
                Add new
              </span>
            </button>
          </div>
        </div>

        <div className="pb-10" />
      </div>
    </div>
  );
}
