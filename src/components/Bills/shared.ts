/**
 * Bills-local palette.
 *
 * The shared `COLORS` palette covers the surfaces and semantic colours every
 * screen uses; these are the handful the Bills design adds on top — the
 * bill-state tag colours and the slightly darker body grey its rows read in.
 *
 * Money is formatted with `formatEuro` from `@/lib/payment-math` (`€415.00`),
 * not `formatCurrency` — that is the de-DE form (`415,00 €`), which none of
 * these designs show.
 */
export const BILLS_COLORS = {
  /** Row labels and section titles — darker than `COLORS.labelMuted`. */
  rowLabel: '#515151',
  dueSoft: 'rgba(83,81,215,0.2)',
  dueText: '#3633A8',
  rolledSoft: 'rgba(245,158,11,0.18)',
  rolledText: '#8B4A00',
  /** Body copy inside the blocked banner — deeper than `COLORS.dangerText`. */
  bannerBody: '#7A0E18',
  /** Explainer body copy. */
  sheetBody: '#404040',
} as const;
