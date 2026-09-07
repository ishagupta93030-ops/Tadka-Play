import React, { useState } from 'react';
import { Gift, LogIn, Sparkles, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const rewards = [100, 250, 500, 1000, 2500, 5000, 10000, 50000];

export default function LuckyWheel() {
  const { user, openAuthModal, updateUserCoins } = useAuth();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const spin = async () => {
    if (!user) return openAuthModal('login');
    if (spinning) return;
    setSpinning(true);
    setError('');
    setResult(null);
    try {
      const data = await apiRequest('/wallet/spin-wheel', 'POST');
      const rewardIndex = rewards.indexOf(data.reward);
      setRotation(previous => previous + 1440 + (360 - rewardIndex * 45));
      window.setTimeout(() => {
        setResult(data);
        updateUserCoins(data.newBalance);
        setSpinning(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
      setSpinning(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-24 right-3 z-[60] flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-slate-950 px-4 py-3 text-amber-300 shadow-[0_8px_30px_rgba(245,158,11,0.35)] transition hover:-translate-y-1 hover:bg-slate-800 md:bottom-6" title="Open lucky wheel">
        <Gift className="h-5 w-5" />
        <span className="text-xs font-extrabold uppercase tracking-wide">Lucky Spin</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={() => !spinning && setOpen(false)}>
          <section className="relative w-full max-w-sm rounded-3xl border border-amber-300/40 bg-slate-900 p-6 text-center shadow-2xl" onClick={event => event.stopPropagation()}>
            <button onClick={() => setOpen(false)} disabled={spinning} className="absolute right-4 top-4 text-slate-400 hover:text-white" title="Close lucky wheel"><X className="h-5 w-5" /></button>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Daily luck drop</p>
            <h2 className="mt-2 text-2xl font-black text-white">Spin for virtual coins</h2>
            <div className="relative mx-auto my-6 h-56 w-56">
              <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-2xl text-amber-300">▼</span>
              <div className="h-full w-full rounded-full border-8 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.35)] transition-transform duration-[1500ms] ease-out" style={{ transform: `rotate(${rotation}deg)`, background: 'conic-gradient(#f97316 0deg 45deg, #fbbf24 45deg 90deg, #ea580c 90deg 135deg, #fde68a 135deg 180deg, #f97316 180deg 225deg, #fbbf24 225deg 270deg, #ea580c 270deg 315deg, #fde68a 315deg 360deg)' }}>
                <div className="flex h-full items-center justify-center rounded-full"><Sparkles className="h-10 w-10 text-white" /></div>
              </div>
            </div>
            {result && <p className="mb-3 text-lg font-extrabold text-amber-300">You won {result.reward.toLocaleString()} virtual coins!</p>}
            {error && <p className="mb-3 text-xs text-red-300">{error}</p>}
            <button onClick={spin} disabled={spinning} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 font-extrabold text-white disabled:cursor-wait disabled:opacity-60">{spinning ? 'Spinning...' : user ? 'Spin the wheel' : <><LogIn className="mr-2 inline h-4 w-4" />Log in to spin</>}</button>
            <p className="mt-3 text-[11px] text-slate-400">One spin every 24 hours. Maximum reward: 50,000 virtual coins.</p>
          </section>
        </div>
      )}
    </>
  );
}
