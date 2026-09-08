/**
 * Intercom messenger — the support channel behind the help control.
 *
 * The widget is loaded by `<IntercomScript />` in the root layout, and only
 * when `NEXT_PUBLIC_INTERCOM_APP_ID` is set. Without an app id (the default in
 * this demo) `openIntercom()` reports false, so callers can fall back to
 * something visible rather than a control that does nothing.
 */

type IntercomCommand = (command: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    Intercom?: IntercomCommand;
    intercomSettings?: Record<string, unknown>;
  }
}

/** Set at build time; empty when the messenger isn't configured. */
export const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? '';

/**
 * Open the messenger. Returns false when it isn't available — no app id, or
 * the widget hasn't loaded yet — which is the caller's cue to show its own
 * help affordance instead.
 */
export function openIntercom(): boolean {
  if (typeof window === 'undefined' || typeof window.Intercom !== 'function') {
    return false;
  }
  window.Intercom('show');
  return true;
}
