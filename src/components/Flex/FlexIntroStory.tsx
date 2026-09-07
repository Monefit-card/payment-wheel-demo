'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { IconClose } from '@/components/ui/icons';
import { MerchantLogo } from '@/components/ui/MerchantLogo';
import { COLORS } from '@/lib/constants';

/**
 * First-time Flex explainer, told as a story.
 *
 * Three full-bleed slides on IG-story conventions: a segmented progress bar
 * that fills and auto-advances, tap-right / tap-left to navigate, X to
 * dismiss at any point.
 *
 * Each slide pairs a short claim with a small mockup of the real UI it
 * describes, so "what it is" and "how it works" are shown rather than merely
 * asserted.
 *
 * It does NOT fire on app entry — it opens the first time a first-time user
 * taps into Flex, not before they have even seen the home screen. Once shown,
 * later taps go straight into the flow. The caller owns that trigger via
 * `flexIntroSeen` / `markFlexIntroSeen`.
 */

interface StoryStep {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  Mock: () => React.JSX.Element;
}

const MOCK_WIDTH = 250;

const STORY_STEPS: StoryStep[] = [
  {
    id: 'what',
    eyebrow: 'FLEX',
    headline: 'Split any purchase into monthly instalments',
    body: 'Pick an eligible card purchase and spread the cost over time — no separate loan, no new card.',
    Mock: () => (
      <Card radius={24} className="px-[18px] py-4" style={{ width: MOCK_WIDTH }}>
        <div className="flex items-center gap-3">
          <MerchantLogo icon="apple" size={42} radius={12} />
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
              Apple Store
            </div>
            <div className="text-xs mt-px" style={{ color: COLORS.labelMuted }}>
              Today, 20:09
            </div>
          </div>
          <div className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
            €210
          </div>
        </div>
        <div className="mt-2.5">
          <span
            className="inline-block px-[11px] py-1.5 rounded-[9px] text-xs font-medium"
            style={{ background: '#EEEEF0', color: COLORS.textPrimary }}
          >
            Flex available
          </span>
        </div>
      </Card>
    ),
  },
  {
    id: 'choose',
    eyebrow: 'HOW IT WORKS',
    headline: 'Choose how many months to spread it over',
    body: 'See your monthly repayment and total interest upfront — from 3 up to 12 months, before you confirm anything.',
    Mock: () => (
      <Card radius={24} className="px-5 py-[22px]" style={{ width: MOCK_WIDTH }}>
        <div className="text-center mb-[18px]">
          <div className="text-xs mb-[5px]" style={{ color: COLORS.labelMuted }}>
            Monthly repayment
          </div>
          <div
            className="text-[30px] font-bold tracking-[-0.6px] tabular-nums"
            style={{ color: COLORS.textPrimary }}
          >
            €54.15
          </div>
        </div>
        <div className="flex justify-between text-[12.5px] mb-2.5">
          <span style={{ color: COLORS.labelMuted }}>Split in</span>
          <span className="font-bold" style={{ color: COLORS.textPrimary }}>
            4 instalments
          </span>
        </div>
        <div
          className="relative"
          style={{ height: 5, borderRadius: 3, background: 'rgba(19,20,23,0.1)' }}
        >
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{ width: '30%', borderRadius: 3, background: COLORS.ctaBackground }}
          />
          <div
            className="absolute"
            style={{
              left: '30%',
              top: '50%',
              width: 16,
              height: 16,
              borderRadius: 8,
              background: COLORS.ctaBackground,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </Card>
    ),
  },
  {
    id: 'stays',
    eyebrow: 'HOW IT WORKS',
    headline: 'Instalments join your monthly bill automatically',
    body: 'Nothing new to track — repayments are folded into your minimum monthly payment. Manage or cancel any plan, any time.',
    Mock: () => (
      <Card radius={24} className="px-5 py-1.5" style={{ width: MOCK_WIDTH }}>
        <div className="flex justify-between items-center py-3.5">
          <span className="text-[13.5px]" style={{ color: COLORS.labelMuted }}>
            Payment due
          </span>
          <span className="text-[15px] font-bold" style={{ color: COLORS.textPrimary }}>
            15 Feb
          </span>
        </div>
        <div style={{ height: 0.5, background: COLORS.hairline }} />
        <div className="flex justify-between items-center py-3.5">
          <span className="text-[13.5px]" style={{ color: COLORS.labelMuted }}>
            Flex
          </span>
          <span className="text-[15px] font-bold" style={{ color: COLORS.flex }}>
            + €53.24
          </span>
        </div>
      </Card>
    ),
  },
];

interface FlexIntroStoryProps {
  onDone: () => void;
  zIndex?: number;
}

export function FlexIntroStory({ onDone, zIndex = 60 }: FlexIntroStoryProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STORY_STEPS.length - 1;
  const advance = () => (isLast ? onDone() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const { eyebrow, headline, body, Mock } = STORY_STEPS[step];

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ zIndex, background: COLORS.ctaBackground }}
    >
      <style>{'@keyframes flexStoryFill { from { width: 0%; } to { width: 100%; } }'}</style>

      {/* Segmented progress — the active segment animates via a CSS keyframe
          and advances the story itself on animation end, so tap navigation and
          auto-advance share one code path. */}
      <div className="relative flex gap-1.5 px-4 pt-[58px]" style={{ zIndex: 5 }}>
        {STORY_STEPS.map((seg, i) => (
          <div
            key={seg.id}
            className="flex-1 overflow-hidden"
            style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.25)' }}
          >
            <div
              key={i === step ? `fill-${step}` : `static-${i}`}
              onAnimationEnd={i === step ? advance : undefined}
              style={{
                height: '100%',
                borderRadius: 2,
                background: COLORS.textWhite,
                width: i < step ? '100%' : i > step ? '0%' : undefined,
                animation: i === step ? 'flexStoryFill 4200ms linear forwards' : 'none',
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onDone}
        aria-label="Close"
        className="absolute flex items-center justify-center cursor-pointer"
        style={{
          top: 54,
          right: 14,
          width: 34,
          height: 34,
          borderRadius: 17,
          zIndex: 5,
          background: 'rgba(255,255,255,0.14)',
        }}
      >
        <IconClose size={11} color={COLORS.textWhite} />
      </button>

      {/* Tap zones — left third goes back, the rest advances. They sit beneath
          the content, which ignores pointer events so taps pass through. */}
      <div className="absolute inset-0 flex" style={{ zIndex: 1 }}>
        <button onClick={back} aria-label="Previous" className="w-[32%] cursor-pointer" />
        <button onClick={advance} aria-label="Next" className="flex-1 cursor-pointer" />
      </div>

      <div
        className="relative flex-1 flex flex-col items-center justify-center px-7 text-center pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <div
          className="text-[11px] font-bold tracking-[1.2px] mb-3.5"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {eyebrow}
        </div>
        <div
          className="text-[26px] font-bold tracking-[-0.5px] leading-[1.2] mb-3"
          style={{ color: COLORS.textWhite }}
        >
          {headline}
        </div>
        <div
          className="text-[14.5px] leading-[1.5] mb-[30px]"
          style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 280 }}
        >
          {body}
        </div>
        <Mock />
      </div>
    </div>
  );
}
