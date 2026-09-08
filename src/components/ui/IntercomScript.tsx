import Script from 'next/script';
import { INTERCOM_APP_ID } from '@/lib/intercom';

/**
 * Loads the Intercom messenger for the whole app.
 *
 * `lazyOnload` — support chat is never on the critical path, so it waits for
 * idle time rather than competing with the screens for hydration. Renders
 * nothing when `NEXT_PUBLIC_INTERCOM_APP_ID` is unset, which is how the demo
 * runs by default; the help control then falls back to its own sheet.
 */
export function IntercomScript() {
  if (!INTERCOM_APP_ID) return null;

  return (
    <Script id="intercom-widget" strategy="lazyOnload">
      {`
        window.intercomSettings = { app_id: ${JSON.stringify(INTERCOM_APP_ID)} };
        (function(){
          var w = window, ic = w.Intercom;
          if (typeof ic === 'function') { ic('reattach_activator'); ic('update', w.intercomSettings); return; }
          var d = document;
          var i = function(){ i.c(arguments); };
          i.q = []; i.c = function(args){ i.q.push(args); };
          w.Intercom = i;
          var s = d.createElement('script');
          s.async = true;
          s.src = 'https://widget.intercom.io/widget/' + ${JSON.stringify(INTERCOM_APP_ID)};
          d.head.appendChild(s);
        })();
      `}
    </Script>
  );
}
