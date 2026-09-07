'use client';

import { COLORS } from '@/lib/constants';
import { formatEuro } from '@/lib/payment-math';
import { ZoneInfo } from '@/types/payment';

interface StagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  zoneInfo: ZoneInfo;
  description: string;
  /**
   * Due Flex instalments inside the minimum. Shown as a figure on the minimum
   * stages — the full minimum, the credit-line part the split anchor marks
   * off, and the instalment stretch between them.
   */
  flexDueAmount?: number;
  /**
   * Opens Flex. When supplied, the Flex line becomes the way through to the
   * plans — the figure that raises the question is the answer's affordance, so
   * the wheel screen itself gains nothing.
   */
  onOpenFlex?: () => void;
}

/**
 * Stage explainer sheet. Kept mounted and driven by CSS transitions rather than
 * an animated mount: a dropped frame callback (backgrounded tab) would
 * otherwise leave the sheet parked mid-slide, same reason the screen
 * transitions in page.tsx avoid it.
 */
export function StagesDrawer({
  isOpen,
  onClose,
  zoneInfo,
  description,
  flexDueAmount = 0,
  onOpenFlex,
}: StagesDrawerProps) {
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
        className="absolute bottom-0 inset-x-0 rounded-t-[26px] overflow-hidden"
        style={{
          background: COLORS.surface,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5">
          <div className="w-9 h-1 rounded-full" style={{ background: '#d6d6db' }} />
        </div>

        {/* Header — centred title, close control on the right */}
        <div className="relative px-5 pt-6 pb-4">
          <h2
            className="text-[20px] font-bold text-center px-12"
            style={{ color: COLORS.textPrimary }}
          >
            {zoneInfo.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-4 w-10 h-10 flex items-center justify-center rounded-full"
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

        {/* Body */}
        <div className="px-6">
          <p
            className="text-[16px] leading-[1.45] text-center"
            style={{ color: '#3a3a3c' }}
          >
            {description}
          </p>

          {flexDueAmount > 0 &&
            (zoneInfo.zone === 'at_minimum' ||
              zoneInfo.zone === 'at_credit_minimum' ||
              zoneInfo.zone === 'between_credit_min_min') && (
            <button
              type="button"
              disabled={!onOpenFlex}
              onClick={() => {
                onClose();
                onOpenFlex?.();
              }}
              className="mt-4 w-full flex items-center justify-between rounded-2xl px-4 py-3 disabled:cursor-default active:scale-[0.99] transition-transform"
              style={{ background: COLORS.flexSoft }}
            >
              <span
                className="text-[14px] font-semibold"
                style={{ color: COLORS.flexText }}
              >
                Flex instalments due
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="text-[15px] font-bold tabular-nums"
                  style={{ color: COLORS.flexText }}
                >
                  {formatEuro(flexDueAmount)}
                </span>
                {onOpenFlex && (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                    <path
                      d="M5.5 3.5L10 7.5l-4.5 4"
                      stroke={COLORS.flexText}
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          )}
        </div>

        {/* Dismiss */}
        <div className="px-5 pt-7 pb-8">
          <button
            onClick={onClose}
            className="w-full py-[15px] rounded-2xl text-[17px] font-semibold active:scale-[0.98] transition-transform"
            style={{ background: COLORS.ctaBackground, color: COLORS.textWhite }}
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
}
