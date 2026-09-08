import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import PredictionModal from '../components/PredictionModal';
import CoinDisclaimer from '../components/CoinDisclaimer';
import { ArrowLeft, Sparkles, MapPin, Trophy, Radio, ShieldAlert } from 'lucide-react';

export default function MatchDetailPage() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();

  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);

  useEffect(() => {
    fetchMatchDetail();
  }, [id]);

  const fetchMatchDetail = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/matches/${id}`);
      if (data.success) {
        setMatchData(data.match);
      }
    } catch (err) {
      console.error('Match detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsPredictModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs">
        Loading match details...
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs space-y-3">
        <p>Match not found.</p>
        <Link to="/" className="text-tadka-orange font-bold hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Matches</span>
      </Link>

      {/* Match Header Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-tadka-border space-y-6 bg-gradient-to-b from-tadka-card to-tadka-dark relative overflow-hidden">
        
        <div className="flex items-center justify-between text-xs border-b border-tadka-border/60 pb-3">
          <span className="font-extrabold text-slate-300 uppercase tracking-wider">{matchData.sport} • {matchData.league}</span>
          
          {matchData.status === 'LIVE' && (
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-extrabold text-xs flex items-center gap-1.5 border border-red-500/40">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE</span>
            </span>
          )}
          {matchData.status === 'UPCOMING' && (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/30">
              ⏱️ Upcoming
            </span>
          )}
          {matchData.status === 'COMPLETED' && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              ✅ Match Ended
            </span>
          )}
        </div>

        {/* Teams Matchup */}
        <div className="grid grid-cols-5 items-center text-center py-4">
          <div className="col-span-2 flex flex-col items-center gap-2">
            <img src={matchData.team_a_logo} alt={matchData.team_a_name} className="w-20 h-20 object-contain" />
            <span className="font-black text-lg text-white">{matchData.team_a_name}</span>
            {matchData.status !== 'UPCOMING' && (
              <span className="font-mono text-xl font-black text-amber-300 bg-amber-500/10 px-4 py-1 rounded-xl">
                {matchData.score_team_a || '0'}
              </span>
            )}
          </div>

          <div className="col-span-1 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-tadka-dark border border-tadka-border flex items-center justify-center font-black text-xs text-tadka-orange">
              VS
            </div>
            {matchData.winner_team && (
              <span className="text-xs text-emerald-400 font-bold mt-2">
                🏆 Winner: {matchData.winner_team}
              </span>
            )}
          </div>

          <div className="col-span-2 flex flex-col items-center gap-2">
            <img src={matchData.team_b_logo} alt={matchData.team_b_name} className="w-20 h-20 object-contain" />
            <span className="font-black text-lg text-white">{matchData.team_b_name}</span>
            {matchData.status !== 'UPCOMING' && (
              <span className="font-mono text-xl font-black text-amber-300 bg-amber-500/10 px-4 py-1 rounded-xl">
                {matchData.score_team_b || '0'}
              </span>
            )}
          </div>
        </div>

        {/* Venue & Date */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-3 border-t border-tadka-border/60">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{matchData.venue}</span>
          </div>
          <span>•</span>
          <span>{formatDate(matchData.match_time)}</span>
        </div>

        {/* Action Predict CTA */}
        {matchData.status === 'LIVE' && (
          <button
            onClick={handlePredict}
            className="w-full py-4 text-sm font-extrabold text-white bg-gradient-to-r from-tadka-orange via-tadka-orange-light to-tadka-flame rounded-2xl shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-200" />
            <span>Submit Virtual Coin Prediction</span>
          </button>
        )}
        {matchData.status === 'UPCOMING' && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-xs font-semibold text-amber-200">
            The Master must host this event before predictions open.
          </div>
        )}

      </div>

      <CoinDisclaimer />

      {/* Commentary & Event Feed */}
      {matchData.live_events && matchData.live_events.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-tadka-border space-y-3">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Live Match Event Feed (Simulated Demo Data)</span>
          </h3>

          <div className="space-y-2">
            {matchData.live_events.map((ev, idx) => (
              <div key={idx} className="bg-tadka-dark/80 rounded-xl p-3 border border-tadka-border/60 text-xs flex items-start gap-3">
                <span className="font-mono font-bold text-amber-400 shrink-0">{ev.time}</span>
                <span className="text-slate-200">{ev.event}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPredictModalOpen && (
        <PredictionModal
          match={matchData}
          onClose={() => setIsPredictModalOpen(false)}
          onSuccess={fetchMatchDetail}
        />
      )}

    </div>
  );
}
