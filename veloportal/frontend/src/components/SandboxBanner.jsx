import React, { useEffect, useState } from 'react';
import api from '../api/client';

// The project's own test/demo phone number (also the seeded rider@veloportal.app
// account's phone) — useful to quick-fill for UI testing, but note this does
// NOT receive a real sandbox STK prompt (see explanation below).
const MY_TEST_NUMBER = '0713048056';

/**
 * Shown above any M-Pesa payment form. Daraja's SANDBOX environment only
 * delivers a real STK push prompt to Safaricom's published test number (or
 * numbers explicitly registered as test credentials in the Daraja portal) —
 * a real personal phone number will NOT receive anything in sandbox mode,
 * even though the request itself succeeds. This is the #1 cause of "I got a
 * receipt but no prompt on my phone." Dismissible once you've read it —
 * closing it doesn't change the underlying Safaricom limitation, it just
 * gets it out of your way after the first read.
 */
export default function SandboxBanner({ onUseTestNumber }) {
  const [config, setConfig] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get('/payments/mpesa/config').then(r => setConfig(r.data)).catch(() => {});
  }, []);

  if (!config?.isSandbox || dismissed) return null;

  return (
    <div className="relative rounded-xl border border-amber/40 bg-amber/10 p-4 pr-9 text-sm dark:border-amber/30 dark:bg-amber/10">
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-ink-400 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10">
        ✕
      </button>
      <p className="font-semibold text-amber-dark">🧪 Sandbox mode — read this before paying</p>
      <p className="mt-1 text-ink-500 dark:text-white/70">
        This app is using M-Pesa's <strong>test environment</strong>. Safaricom only sends a real
        STK push prompt to their published test number — a real personal phone (including{' '}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">{MY_TEST_NUMBER}</code>) won't
        receive anything here, even though the request succeeds.
      </p>
      {onUseTestNumber && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => onUseTestNumber(config.sandboxTestMsisdn)}
            className="btn-tab !px-3 !py-1.5 text-xs bg-amber text-forest-dark font-semibold">
            ✅ Use Safaricom test number {config.sandboxTestMsisdn} (gets a real prompt in Daraja's simulator)
          </button>
          <button type="button" onClick={() => onUseTestNumber(MY_TEST_NUMBER)}
            className="btn-tab !px-3 !py-1.5 text-xs bg-white text-ink-500 dark:bg-white/10 dark:text-white/70">
            Use {MY_TEST_NUMBER} anyway (for UI testing only — no phone prompt)
          </button>
        </div>
      )}
    </div>
  );
}
