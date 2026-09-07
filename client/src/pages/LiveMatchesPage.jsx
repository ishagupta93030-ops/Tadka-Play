import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import MatchCard from '../components/MatchCard';
import PredictionModal from '../components/PredictionModal';
import CoinDisclaimer from '../components/CoinDisclaimer';
import { Radio, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LiveMatchesPage() {
  const { user, openAuthModal } = useAuth();
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePredictionMatch, setActivePredictionMatch] = useState(null);

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 5000); // refresh score every 5 sec
    return () => clearInterval(interval);
  }, []);

  const fetchLiveMatches = async () => {
    try {
      const data = await apiRequest('/matches?status=LIVE');
      if (data.success) {
        setLiveMatches(data.matches);
      }
    } catch (err) {
      console.error('Fetch live error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = (match) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setActivePredictionMatch(match);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">🔴 LIVE Matches</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time match scores, commentary & in-play prediction</p>
        </div>

        <button
          onClick={fetchLiveMatches}
          className="p-2.5 rounded-xl bg-tadka-card border border-tadka-border text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mandatory Demo Data Notice */}
      <div className="bg-gradient-to-r from-red-950/60 via-tadka-card to-red-950/60 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-300 text-xs">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <strong className="text-white block font-bold">DEMO LIVE DATA NOTICE:</strong>
          Live scores and event feeds are simulated demo data for game testing purposes. Virtual coins only.
        </div>
      </div>

      {/* Matches Grid */}
      {liveMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveMatches.map((match) => (
            <div key={match.id} className="glass-card rounded-3xl p-6 border border-tadka-border space-y-4">
              
              <div className="flex items-center justify-between border-b border-tadka-border/60 pb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{match.sport} • {match.league}</span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-extrabold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>{match.match_minute || 'LIVE'}</span>
                </div>
              </div>

              {/* Match Score Display */}
              <div className="grid grid-cols-5 items-center text-center py-2">
                <div className="col-span-2 flex flex-col items-center gap-2">
                  <img src={match.team_a_logo} alt={match.team_a_name} className="w-16 h-16 object-contain" />
                  <span className="font-extrabold text-base text-white">{match.team_a_name}</span>
                  <span className="font-mono text-lg font-black text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl">
                    {match.score_team_a || '0'}
                  </span>
                </div>

                <div className="col-span-1 text-slate-500 font-bold text-sm">VS</div>

                <div className="col-span-2 flex flex-col items-center gap-2">
                  <img src={match.team_b_logo} alt={match.team_b_name} className="w-16 h-16 object-contain" />
                  <span className="font-extrabold text-base text-white">{match.team_b_name}</span>
                  <span className="font-mono text-lg font-black text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl">
                    {match.score_team_b || '0'}
                  </span>
                </div>
              </div>

              {/* Live Events Commentary Ticker */}
              {match.live_events && match.live_events.length > 0 && (
                <div className="bg-tadka-dark/90 rounded-2xl p-3.5 border border-tadka-border space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recent Commentary:</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {match.live_events.map((ev, i) => (
                      <div key={i} className="text-xs text-slate-200 flex items-start gap-2">
                        <span className="font-mono font-bold text-amber-400 shrink-0">{ev.time}</span>
                        <span>{ev.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Predict CTA */}
              <button
                onClick={() => handlePredict(match)}
                className="w-full py-3.5 text-xs font-extrabold text-white bg-gradient-to-r from-tadka-orange via-tadka-orange-light to-tadka-flame rounded-2xl shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                <span>Predict Live Winner</span>
              </button>

            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <p className="text-base font-bold text-white">No Live Matches at this moment</p>
          <p className="text-xs">Upcoming matches will appear here automatically as soon as they start.</p>
        </div>
      )}

      {activePredictionMatch && (
        <PredictionModal
          match={activePredictionMatch}
          onClose={() => setActivePredictionMatch(null)}
          onSuccess={fetchLiveMatches}
        />
      )}

    </div>
  );
}
