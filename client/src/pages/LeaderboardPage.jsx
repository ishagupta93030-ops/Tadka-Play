import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { formatCoins } from '../utils/formatters';
import CoinDisclaimer from '../components/CoinDisclaimer';
import { Trophy, Award, Crown, Sparkles } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState('all-time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/leaderboard?timeframe=${timeframe}`);
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const remainingList = leaderboard.slice(3);

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>🏆 Global Leaderboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Top predictor champions by virtual coin holdings & win rates</p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-tadka-dark/80 p-1.5 rounded-2xl border border-tadka-border">
          <button
            onClick={() => setTimeframe('all-time')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              timeframe === 'all-time'
                ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              timeframe === 'monthly' ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              timeframe === 'weekly'
                ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      <CoinDisclaimer />

      {/* TOP 3 PODIUM DISPLAY */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end pt-6 pb-4">
          
          {/* 2nd Place (Silver) */}
          <div className="glass-card rounded-3xl p-4 text-center border border-slate-400/40 relative flex flex-col items-center gap-2">
            <span className="text-2xl">🥈</span>
            <div className="relative">
              <img
                src={topThree[1].avatar}
                alt={topThree[1].name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-300"
              />
              <span className="absolute -bottom-1 -right-1 bg-slate-300 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                #2
              </span>
            </div>
            <p className="font-extrabold text-sm text-white truncate max-w-full">{topThree[1].name}</p>
            <span className="text-xs font-extrabold text-amber-300">🪙 {formatCoins(topThree[1].coin_balance)}</span>
            <span className="text-[10px] text-slate-400">Win Rate: {topThree[1].winRate}%</span>
          </div>

          {/* 1st Place (Gold Winner - Taller) */}
          <div className="glass-card rounded-3xl p-5 text-center border-2 border-amber-400 relative flex flex-col items-center gap-2 shadow-glow-yellow scale-105 bg-gradient-to-b from-amber-500/20 to-tadka-card">
            <Crown className="w-8 h-8 text-amber-400 animate-bounce -mt-3" />
            <div className="relative">
              <img
                src={topThree[0].avatar}
                alt={topThree[0].name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-amber-400"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                🥇 #1
              </span>
            </div>
            <p className="font-extrabold text-base text-white truncate max-w-full">{topThree[0].name}</p>
            <span className="text-sm font-black text-amber-300">🪙 {formatCoins(topThree[0].coin_balance)}</span>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Win Rate: {topThree[0].winRate}%
            </span>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="glass-card rounded-3xl p-4 text-center border border-amber-700/40 relative flex flex-col items-center gap-2">
            <span className="text-2xl">🥉</span>
            <div className="relative">
              <img
                src={topThree[2].avatar}
                alt={topThree[2].name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-700"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-700 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                #3
              </span>
            </div>
            <p className="font-extrabold text-sm text-white truncate max-w-full">{topThree[2].name}</p>
            <span className="text-xs font-extrabold text-amber-300">🪙 {formatCoins(topThree[2].coin_balance)}</span>
            <span className="text-[10px] text-slate-400">Win Rate: {topThree[2].winRate}%</span>
          </div>

        </div>
      )}

      {/* Rankings Table */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-tadka-border space-y-3">
        <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-2">
          Rankings Table
        </h2>

        <div className="space-y-2">
          {leaderboard.map((player) => (
            <div
              key={player.id}
              className="bg-tadka-dark/80 rounded-2xl p-3 sm:p-4 border border-tadka-border/60 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center font-extrabold text-sm text-slate-400">
                  #{player.rank}
                </span>

                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover border border-tadka-border shrink-0"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{player.name}</span>
                    <span className="bg-tadka-orange/20 text-tadka-orange text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Lvl {player.level}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Win Streak: 🔥 {player.win_streak}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-extrabold text-sm text-amber-300 block">
                  🪙 {formatCoins(timeframe === 'all-time' ? player.coin_balance : player.score)}
                </span>
                <span className="text-[11px] text-slate-400">Wins: {player.wins} • Rate: {player.winRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
