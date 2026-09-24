'use client';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { COLORS } from '@/lib/constants';
import { CASHBACK_RULES, MAX_CYCLE_CASHBACK, SMARTSAVER_PROFILE } from '@/lib/smartsaver';
import { SmartSaverStatus } from '@/hooks/useSmartSaver';
import { eur, eurWhole } from './format';
import { SMART_SURFACE, SmartCardArt, SmartSurfaceLayers } from './SmartArt';
import { SmartSaverMark } from './icons';

const PCT = `${Math.round(CASHBACK_RULES.maxRate * 100)}%`;

/** The three facts a customer needs before they opt in — shared with the confirmation. */
export const HOW_IT_WORKS = [
  {
    title: 'Spend as usual',
    body: `Up to ${PCT} back on your first ${eurWhole(CASHBACK_RULES.cycleSpendCap)} of card spend each month.`,
  },
  {
    title: 'Paid in every day',
    body: 'Yesterday’s cashback lands in your Cashback Vault each morning.',
  },
  {
    title: `Locked for ${CASHBACK_RULES.lockMonths} months`,
    body: `The vault unlocks ${CASHBACK_RULES.lockMonths} months after it opens. Then it’s yours to withdraw or keep saving.`,
  },
];

export function HowItWorksList({ dark = false }: { dark?: boolean }) {
  return (
    <ol className="m-0 p-0 list-none">
      {HOW_IT_WORKS.map((step, i) => (
        <li key={step.title} className="flex gap-3.5 py-3">
          <span
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold tabular-nums"
            style={{
              background: dark ? 'rgba(255,255,255,0.1)' : COLORS.screenSunken,
              color: dark ? COLORS.textWhite : COLORS.textPrimary,
            }}
          >
            {i + 1}
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ color: dark ? COLORS.textWhite : COLORS.textPrimary }}>
              {step.title}
            </div>
            <div
              className="text-[13.5px] leading-[1.45] mt-0.5"
              style={{ color: dark ? 'rgba(255,255,255,0.62)' : COLORS.labelMuted }}
            >
              {step.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

interface RewardsOfferProps {
  status: Exclude<SmartSaverStatus, 'linked'>;
  /** Card spend in the last full billing month — sizes the estimate. */
  lastMonthSpend: number;
  /** Log in to the matched account. */
  onLinkMatched: () => void;
  /** Log in to some other SmartSaver account. */
  onLoginOther: () => void;
  /** Open a new SmartSaver account from here. */
  onOpenAccount: () => void;
}

/** Rewards before linking — the offer, the mechanics, and one way forward. */
export function RewardsOffer({
  status,
  lastMonthSpend,
  onLinkMatched,
  onLoginOther,
  onOpenAccount,
}: RewardsOfferProps) {
  const monthly = Math.min(lastMonthSpend, CASHBACK_RULES.cycleSpendCap) * CASHBACK_RULES.maxRate;

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[28px] px-6 pt-6 pb-7 text-white" style={SMART_SURFACE}>
        <SmartSurfaceLayers />
        <div className="relative">
          <div className="font-mono text-[11px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            SMART CARD
          </div>
          <h2 className="mt-3 text-[28px] font-semibold leading-[1.08] tracking-[-0.03em]">
            Earn up to {PCT} cashback,{' '}
            <span
              style={{
                background: `linear-gradient(100deg, #fff 10%, ${COLORS.smartAccent} 55%, ${COLORS.smartGain})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              straight into savings.
            </span>
          </h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.45]" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Your Monefit card pays cashback into SmartSaver. No monthly fee.
          </p>
          <div className="mt-6 flex justify-center">
            <SmartCardArt width={236} tilt />
          </div>
        </div>
      </div>

      {/* Mechanics */}
      <Card radius={24} className="mt-4 px-5 pt-4 pb-2">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: COLORS.textSecondary }}>
          How it works
        </div>
        <HowItWorksList />
      </Card>

      {/* What it's worth to them */}
      {monthly > 0 && (
        <Card radius={24} className="mt-4 px-5 py-4 flex items-center justify-between gap-4">
          <div className="text-[13.5px] leading-[1.45]" style={{ color: COLORS.labelMuted }}>
            At last month’s spend of {eurWhole(lastMonthSpend)}, you’d earn about
          </div>
          <div className="text-right shrink-0">
            <div className="text-[22px] font-bold tabular-nums" style={{ color: COLORS.cashbackText }}>
              {eur(monthly * 12)}
            </div>
            <div className="text-[12px]" style={{ color: COLORS.labelMuted }}>
              a year
            </div>
          </div>
        </Card>
      )}

      {/* The way forward depends on whether they already save with us */}
      <Card radius={24} className="mt-4 px-5 pt-5 pb-4">
        {status === 'email_match' ? (
          <>
            <div className="flex items-center gap-3.5">
              <SmartSaverMark size={44} />
              <div className="min-w-0">
                <div className="text-[15.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
                  We found your SmartSaver account
                </div>
                <div className="text-[13px] mt-0.5 truncate" style={{ color: COLORS.labelMuted }}>
                  {SMARTSAVER_PROFILE.maskedEmail}
                </div>
              </div>
            </div>
            <p className="text-[13.5px] leading-[1.45] mt-3.5 mb-4" style={{ color: COLORS.labelMuted }}>
              Log in once to link it to your card. We’ll open a Cashback Vault inside it — your other vaults stay as they are.
            </p>
            <PrimaryButton onClick={onLinkMatched}>Link SmartSaver</PrimaryButton>
            <button
              onClick={onLoginOther}
              className="w-full mt-1 py-3 text-[14px] font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              Use a different SmartSaver account
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3.5">
              <SmartSaverMark size={44} />
              <div className="min-w-0">
                <div className="text-[15.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
                  Cashback is paid into SmartSaver
                </div>
                <div className="text-[13px] mt-0.5" style={{ color: COLORS.labelMuted }}>
                  Monefit’s savings account
                </div>
              </div>
            </div>
            <p className="text-[13.5px] leading-[1.45] mt-3.5 mb-4" style={{ color: COLORS.labelMuted }}>
              Open one in about a minute. We’ll use the details you verified for your card, so there’s nothing to upload.
            </p>
            <PrimaryButton onClick={onOpenAccount}>Open SmartSaver</PrimaryButton>
            <button
              onClick={onLoginOther}
              className="w-full mt-1 py-3 text-[14px] font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              I already have SmartSaver
            </button>
          </>
        )}
      </Card>

      <p className="text-[12px] leading-[1.5] mt-4 mx-2" style={{ color: COLORS.textMuted }}>
        Cashback starts with purchases made after you link — earlier purchases don’t earn. Capped at{' '}
        {eur(MAX_CYCLE_CASHBACK)} a month. Rates and rules may change; see the Smart Card terms.
      </p>
    </>
  );
}
