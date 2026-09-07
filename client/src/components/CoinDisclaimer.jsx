import React from 'react';
import { ShieldAlert, Coins } from 'lucide-react';

export default function CoinDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-amber-950/40 via-tadka-card to-amber-950/40 border border-amber-500/20 text-amber-300 text-xs px-3 py-1.5 rounded-full flex items-center justify-center gap-1.5 text-center">
        <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Virtual coins only. No real-money deposits, withdrawals or cash prizes.</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-amber-950/60 border border-amber-500/30 text-amber-200 text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-center shadow-lg my-2">
      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="font-medium">
        <strong>Free-to-Play Notice:</strong> Virtual coins only. No real-money deposits, withdrawals or cash prizes.
      </span>
    </div>
  );
}
