import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { formatCoins, formatDate } from '../utils/formatters';
import CoinDisclaimer from '../components/CoinDisclaimer';
import { History, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

export default function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/predictions/my-predictions');
      if (data.success) {
        setPredictions(data.predictions);
      }
    } catch (err) {
      console.error('History error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPredictions = predictions.filter(prediction => {
    const matchesStatus = status === 'ALL' || prediction.outcome === status;
    const haystack = `${prediction.team_a_name} ${prediction.team_b_name} ${prediction.predicted_team} ${prediction.sport}`.toLowerCase();
    return matchesStatus && haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <span>📜 Prediction History</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Track all your submitted predictions and virtual coin payouts</p>
      </div>

      <CoinDisclaimer />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search matches or predictions" className="w-full rounded-xl border border-tadka-border bg-tadka-card py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-tadka-orange" />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)} className="rounded-xl border border-tadka-border bg-tadka-card px-3 text-sm text-white outline-none">
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {filteredPredictions.length > 0 ? (
        <div className="space-y-3">
          {filteredPredictions.map((pred) => {
            const isWon = pred.outcome === 'WON';
            const isLost = pred.outcome === 'LOST';
            const isPending = pred.outcome === 'PENDING';

            return (
              <div
                key={pred.id}
                className="glass-card rounded-2xl p-4 border border-tadka-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">
                      {pred.team_a_name || 'Team A'} vs {pred.team_b_name || 'Team B'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-tadka-dark px-2 py-0.5 rounded-full">
                      {pred.sport || 'Sports'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Predicted Winner: <strong className="text-amber-300 font-extrabold">{pred.predicted_team}</strong>
                  </p>

                  <span className="text-[10px] text-slate-400 block">{formatDate(pred.created_at)}</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-tadka-border/40">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">Staked: 🪙 {formatCoins(pred.coins_staked)}</span>
                    <span className="font-mono font-extrabold text-xs text-amber-300">
                      Potential: 🪙 {formatCoins(pred.potential_reward)}
                    </span>
                  </div>

                  {/* Status Badges */}
                  {isWon && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-xs flex items-center gap-1.5 shadow-glow-green">
                      <CheckCircle className="w-4 h-4" />
                      <span>WON (+🪙 {formatCoins(pred.coinsWon || pred.potential_reward)})</span>
                    </div>
                  )}

                  {isLost && (
                    <div className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>LOST (-🪙 {formatCoins(pred.coinsLost || pred.coins_staked)})</span>
                    </div>
                  )}

                  {isPending && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>PENDING</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-400 text-xs">
          No prediction history found. Select a live or upcoming match from Home to place your first prediction!
        </div>
      )}
    </div>
  );
}
