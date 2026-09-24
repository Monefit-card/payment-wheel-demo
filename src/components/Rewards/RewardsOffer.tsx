'use client';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { CASHBACK_RULES } from '@/lib/smartsaver';
import { eurWhole } from './format';
import { SMART_SURFACE, SmartCardArt, SmartSurfaceLayers } from './SmartArt';

const PCT = `${Math.round(CASHBACK_RULES.maxRate * 100)}%`;

/** The offer in three lines — the only place the mechanics are spelled out. */
const FACTS = [
  `${PCT} back on your first ${eurWhole(CASHBACK_RULES.cycleSpendCap)} each month`,
  'Paid into a Cashback Vault daily',
  `Locked for ${CASHBACK_RULES.lockMonths} months`,
];

/**
 * Rewards before linking — the offer and one button. Whether they already
 * have SmartSaver is settled in the login, which also offers sign-up.
 */
export function RewardsOffer({ onLink }: { onLink: () => void }) {
  return (
    <>
      <div className="relative overflow-hidden rounded-[28px] px-6 pt-6 pb-5 text-white" style={SMART_SURFACE}>
        <SmartSurfaceLayers />
        <div className="relative">
          <h2 className="m-0 text-[28px] font-semibold leading-[1.08] tracking-[-0.03em]">
            {PCT} cashback,
            <br />
            straight into savings
          </h2>
          <div className="mt-6 mb-5 flex justify-center">
            <SmartCardArt width={236} tilt />
          </div>
          <ul className="m-0 p-0 list-none">
            {FACTS.map((f, i) => (
              <li
                key={f}
                className="py-3 text-[14.5px]"
                style={{
                  borderTop: i ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <PrimaryButton onClick={onLink}>Link SmartSaver</PrimaryButton>
      </div>
    </>
  );
}
