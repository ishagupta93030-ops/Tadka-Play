import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCoins, formatDate } from '../utils/formatters';
import DailyRewardModal from '../components/DailyRewardModal';
import CoinDisclaimer from '../components/CoinDisclaimer';
import { Coins, Gift, History, ShieldAlert, Sparkles, ArrowDownRight, ArrowUpRight, Flame } from 'lucide-react';

export default function WalletPage() {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/wallet/details');
      if (data.success) {
        setWalletData(data);
      }
    } catch (err) {
      console.error('Wallet error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <span>🪙 Virtual Coin Wallet</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your virtual coins, daily login rewards & prediction history</p>
      </div>

      {/* Main Balance Display Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-tadka-card to-amber-900/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
              FREE Virtual Coins Balance
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white flex items-center gap-2">
              <span>🪙</span>
              <span className="gradient-text-gold">{formatCoins(user?.coin_balance)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Zero real monetary value • Strictly for fun & games</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsDailyModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-3.5 text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 via-tadka-orange to-tadka-flame rounded-2xl shadow-glow-yellow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4 text-yellow-200" />
              <span>Daily Free Coins 🎁</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-amber-500/20">
          <CoinDisclaimer />
        </div>
      </div>

      {/* Rules Notice Box (What Users CANNOT do) */}
      <div className="bg-tadka-dark/90 rounded-2xl p-5 border border-tadka-border space-y-3">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Virtual Coin Rules & Limitations</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <span>✅</span>
            <span>Earn coins via Signup, Daily Login & Predictions</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <span>✅</span>
            <span>Climb global player rankings & unlock badges</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            <span>🚫</span>
            <span>Cannot buy coins with real money</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            <span>🚫</span>
            <span>Cannot withdraw or convert coins into cash</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card rounded-3xl p-6 border border-tadka-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <span>Virtual Coin Transaction History</span>
          </h2>
          <span className="text-xs text-slate-400">Last 30 Records</span>
        </div>

        {walletData?.transactions && walletData.transactions.length > 0 ? (
          <div className="space-y-2">
            {walletData.transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="bg-tadka-dark/80 rounded-2xl p-3.5 border border-tadka-border/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isCredit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-white leading-tight">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(tx.created_at)} • Balance after: {formatCoins(tx.balance_after)}</p>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-extrabold text-sm ${
                      isCredit ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isCredit ? '+' : ''}{tx.amount} 🪙
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transactions found yet. Submit predictions or claim daily bonuses to build your history!
          </div>
        )}
      </div>

      <DailyRewardModal
        isOpen={isDailyModalOpen}
        onClose={() => {
          setIsDailyModalOpen(false);
          fetchWallet();
        }}
        currentStreak={walletData?.dailyReward?.streakCount || 1}
        canClaim={walletData?.dailyReward?.canClaim || false}
      />

    </div>
  );
}
