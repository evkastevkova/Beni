import React, {useState} from 'react';
import {Download, Smartphone, WifiOff, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC = () => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98] whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4 shrink-0" />
        Nainštalovať na tablet
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-800/20 bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-white active:scale-[0.98] whitespace-nowrap shrink-0"
      >
        <Smartphone className="h-4 w-4 shrink-0 text-emerald-700" />
        Appka pre tablet / Android
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-emerald-900/15 bg-[#FAF7F0] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 id="pwa-guide-title" className="font-display text-xl font-bold text-emerald-950">
                Inštalácia na tablet alebo Android
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-emerald-900 hover:bg-emerald-900/10"
                aria-label="Zavrieť"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-emerald-900">
                <li>1. V prehliadači Safari ťukni na tlačidlo <strong>Zdieľať</strong> (štvorček so šípkou hore).</li>
                <li>2. Posuň ponuku nadol a vyber <strong>Pridať na plochu</strong>.</li>
                <li>3. Potvrď tlačidlom <strong>Pridať</strong> a hra sa spustí na celú obrazovku ako aplikácia.</li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-emerald-900">
                <li>1. Otvor túto hru v prehliadači <strong>Chrome</strong> na tablete alebo telefóne s Androidom.</li>
                <li>2. Ťukni na ponuku prehliadača (tri bodky vpravo hore) a vyber <strong>Nainštalovať aplikáciu</strong> alebo <strong>Pridať na plochu</strong>.</li>
                <li>3. Po pridaní funguje Bystrík a Čarovný Les aj bez internetu ako samostatná tabletová hra.</li>
              </ol>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Režim bez internetu · Uložený postup funguje</span>
    </div>
  );
};
