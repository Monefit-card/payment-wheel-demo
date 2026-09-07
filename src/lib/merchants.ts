/**
 * Merchant logo lookup. The tiles live in `public/merchants/` and are served
 * from `/merchants/<file>`; each merchant is referenced by a short `icon` key
 * on `Txn`. Extensions differ per asset, so the mapping is explicit rather
 * than a single template string.
 */

/** Icon keys shipped as SVG. */
const SVG_LOGOS = ['hugo', 'apple', 'kaup24', 'uspolo'];

/** Every icon key with an asset in `public/merchants/`. */
export const MERCHANT_ICONS = [
  'amazon',
  'apple',
  'bolt',
  'hugo',
  'kaup24',
  'nike',
  'uspolo',
] as const;

export type MerchantIcon = (typeof MERCHANT_ICONS)[number];

/** `/merchants/nike.jpg` for `'nike'`. Unknown keys fall through to `.png`. */
export function merchantLogo(icon: string): string {
  if (icon === 'nike') return '/merchants/nike.jpg';
  if (SVG_LOGOS.includes(icon)) return `/merchants/${icon}.svg`;
  return `/merchants/${icon}.png`;
}
