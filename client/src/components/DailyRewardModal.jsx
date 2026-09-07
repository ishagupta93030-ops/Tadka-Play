import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { formatCoins } from '../utils/formatters';
import { X, Gift, Flame, CheckCircle, Sparkles } from 'lucide-react';
import CoinDisclaimer from './CoinDisclaimer';

export default function DailyRewardModal({ isOpen, onClose, currentStreak = 1, canClaim = true }) {
  const { updateUserCoins } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimedData, setClaimedData] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const STREAK_REWARDS = [
    { day: 1, coins: 100, xp: 20 },
    { day: 2, coins: 150, xp: 40 },
    { day: 3, coins: 200, xp: 60 },
    { day: 4, coins: 250, xp: 80 },
    { day: 5, coins: 300, xp: 100 },
    { day: 6, coins: 400, xp: 120 },
    { day: 7, coins: 600, xp: 200, bonus: '🔥 Mega Bonus' }
  ];

  const handleClaim = async () => {
    setClaiming(true);
    setError('');

    try {
      const res = await apiRequest('/wallet/claim-daily', 'POST');
      if (res.success) {
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
        updateUserCoins(res.newBalance);
        setClaimedData(res);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to claim daily reward.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-tadka-card border border-tadka-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-tadka-border/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!claimedData ? (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-glow-yellow">
                <Gift className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Daily Login Streak</h2>
              <p className="text-xs text-slate-300 mt-1">Log in daily to unlock bigger virtual coin rewards!</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-xl mb-4 text-center">
                {error}
              </div>
            )}

            {/* 7-Day Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
              {STREAK_REWARDS.map((item) => {
                const isCurrent = item.day === currentStreak;
                const isPast = item.day < currentStreak;

                return (
                  <div
                    key={item.day}
                    className={`rounded-2xl p-2.5 flex flex-col items-center justify-between text-center border transition-all ${
                      isCurrent && canClaim
                        ? 'bg-gradient-to-b from-amber-500/30 to-tadka-card border-amber-400 shadow-glow-yellow scale-105 ring-2 ring-amber-400/50'
                        : isPast
                        ? 'bg-tadka-dark/40 border-tadka-border opacity-60'
                        : 'bg-tadka-dark/80 border-tadka-border'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400">Day {item.day}</span>
                    <div className="text-lg my-1">🪙</div>
                    <span className="text-xs font-extrabold text-amber-300">+{item.coins}</span>
                    {item.bonus && (
                      <span className="text-[9px] text-tadka-orange font-bold mt-0.5 line-clamp-1">{item.bonus}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {canClaim ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-3.5 text-sm font-extrabold text-white bg-gradient-to-r from-amber-500 via-tadka-orange to-tadka-flame rounded-2xl shadow-glow-orange hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                <span>{claiming ? 'Claiming...' : `Claim Day ${currentStreak} Free Coins 🪙`}</span>
              </button>
            ) : (
              <div className="bg-tadka-dark/80 border border-tadka-border rounded-2xl p-3.5 text-center text-xs text-slate-400">
                ✅ Daily reward claimed today! Come back tomorrow for your Day {((currentStreak % 7) + 1)} reward.
              </div>
            )}

            <div className="mt-4">
              <CoinDisclaimer compact />
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto shadow-glow-yellow">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">Daily Reward Claimed! 🎁</h3>
              <p className="text-xs text-slate-300 mt-1">
                You added <strong className="text-amber-300">🪙 {claimedData.coinsAdded} Virtual Coins</strong> and <strong className="text-tadka-orange font-bold">+{claimedData.xpAdded} XP</strong> to your account!
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-tadka-orange to-tadka-flame rounded-xl shadow-glow-orange hover:brightness-110 transition-all"
            >
              Great! Back to Games
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
