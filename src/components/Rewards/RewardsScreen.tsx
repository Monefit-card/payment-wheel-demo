'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Tab, TabBar } from '@/components/ui/TabBar';
import { NAV_BUTTON_STYLE } from '@/components/ui/FullScreenOverlay';
import { IconGear } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { formatLongDate } from '@/lib/smartsaver';
import { SmartSaverState } from '@/hooks/useSmartSaver';
import { RewardsOffer } from './RewardsOffer';
import { VaultDashboard } from './VaultDashboard';

interface RewardsScreenProps {
  ss: SmartSaverState;
  onNavigate: (tab: Tab) => void;
  /** Open the SmartSaver login. */
  onLink: () => void;
}

/** The Rewards tab — the Smart Card offer before linking, the Cashback Vault after. */
export function RewardsScreen({ ss, onNavigate, onLink }: RewardsScreenProps) {
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const { ledger, linkedAt } = ss;

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* Keyed on status so linking lands at the top of the vault, not
          wherever the offer was scrolled to. */}
      <div key={ss.status} className="no-scrollbar flex-1 overflow-y-auto px-4 pb-[120px]">
        {/* A tab (L1) never carries a title — only its controls. */}
        {ledger ? (
          <div className="flex justify-end pt-3 pb-4 px-1">
            <button
              onClick={() => setUnlinkOpen(true)}
              aria-label="Cashback settings"
              className="w-[42px] h-[42px] rounded-[16px] flex items-center justify-center"
              style={NAV_BUTTON_STYLE}
            >
              <IconGear size={19} />
            </button>
          </div>
        ) : (
          <div className="pt-3" />
        )}

        {ledger && linkedAt ? (
          <VaultDashboard ledger={ledger} vaults={ss.otherVaults} txns={ss.otherTxns} now={ss.now} />
        ) : (
          <RewardsOffer onLink={onLink} />
        )}
      </div>

      <TabBar active="rewards" onNavigate={onNavigate} />

      {ledger && (
        <Sheet isOpen={unlinkOpen} onClose={() => setUnlinkOpen(false)} title="Unlink SmartSaver?" zIndex={40}>
          <p className="text-[14px] leading-[1.5] mt-0 mb-5 text-center" style={{ color: COLORS.labelMuted }}>
            Purchases stop earning. Your vault stays locked until {formatLongDate(ledger.unlocksOn)}.
          </p>
          <button
            onClick={() => {
              ss.unlink();
              setUnlinkOpen(false);
            }}
            className="w-full py-4 rounded-2xl text-base font-semibold"
            style={{ background: COLORS.dangerSoft, color: COLORS.dangerText }}
          >
            Unlink
          </button>
          <div className="mt-2.5">
            <PrimaryButton variant="light" onClick={() => setUnlinkOpen(false)}>
              Cancel
            </PrimaryButton>
          </div>
        </Sheet>
      )}
    </div>
  );
}
