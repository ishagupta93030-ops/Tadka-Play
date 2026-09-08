import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCountdown, formatDate } from '../utils/formatters';
import { MapPin, Trophy, Sparkles, Radio } from 'lucide-react';

export default function MatchCard({ match, onPredict }) {
  const [countdownText, setCountdownText] = useState('');

  useEffect(() => {
    if (match.status === 'UPCOMING') {
      const update = () => {
        const res = getCountdown(match.match_time);
        setCountdownText(res.text);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [match]);

  const sportIcons = {
    cricket: '🏏',
    football: '⚽',
    tennis: '🎾',
    basketball: '🏀'
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden border border-tadka-border/80 group">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-tadka-border/40 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <span className="text-sm">{sportIcons[match.sport] || '🏆'}</span>
          <span className="capitalize text-slate-300">{match.sport}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-medium truncate max-w-[120px]">{match.league}</span>
        </div>

        {/* Status Badges */}
        {match.status === 'LIVE' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE</span>
          </div>
        )}

        {match.status === 'UPCOMING' && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium text-[11px]">
            <span>⏱️</span>
            <span className="font-mono">{countdownText || formatDate(match.match_time)}</span>
          </div>
        )}

        {match.status === 'COMPLETED' && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
            <span>✅ Ended</span>
          </div>
        )}
      </div>

      {/* Main Teams Matchup Section */}
      <div className="py-4 grid grid-cols-7 items-center text-center gap-1">
        
        {/* Team A */}
        <div className="col-span-3 flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-tadka-dark/80 p-2 border border-tadka-border flex items-center justify-center shadow-inner group-hover:border-tadka-orange/50 transition-colors">
            <img
              src={match.team_a_logo}
              alt={match.team_a_name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://img.icons8.com/color/96/shield.png';
              }}
            />
          </div>
          <span className="font-extrabold text-sm sm:text-base text-white line-clamp-1">
            {match.team_a_name}
          </span>
          {match.status === 'LIVE' && (
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              {match.score_team_a || '0'}
            </span>
          )}
        </div>

        {/* VS / Score Divider */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-tadka-dark border border-tadka-border flex items-center justify-center font-extrabold text-xs text-tadka-orange shadow-md">
            VS
          </div>
          {match.status === 'COMPLETED' && match.winner_team && (
            <span className="text-[10px] text-emerald-400 font-bold mt-1 text-center line-clamp-1">
              🏆 {match.winner_team} Won
            </span>
          )}
        </div>

        {/* Team B */}
        <div className="col-span-3 flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-tadka-dark/80 p-2 border border-tadka-border flex items-center justify-center shadow-inner group-hover:border-tadka-orange/50 transition-colors">
            <img
              src={match.team_b_logo}
              alt={match.team_b_name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://img.icons8.com/color/96/shield.png';
              }}
            />
          </div>
          <span className="font-extrabold text-sm sm:text-base text-white line-clamp-1">
            {match.team_b_name}
          </span>
          {match.status === 'LIVE' && (
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              {match.score_team_b || '0'}
            </span>
          )}
        </div>
      </div>

      {/* Live Commentary Summary (if live) */}
      {match.status === 'LIVE' && match.match_minute && (
        <div className="bg-red-950/30 border border-red-500/30 text-red-300 text-xs px-3 py-1.5 rounded-xl mb-3 text-center flex items-center justify-center gap-1.5 font-medium">
          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="truncate">{match.match_minute}</span>
        </div>
      )}

      {/* Venue & Action Button */}
      <div className="pt-2 border-t border-tadka-border/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{match.venue}</span>
        </div>

        {match.status === 'LIVE' ? (
          <button
            onClick={() => onPredict(match)}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-tadka-orange via-tadka-orange-light to-tadka-flame rounded-xl shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
            <span>Predict Now</span>
          </button>
        ) : match.status === 'UPCOMING' ? (
          <span className="px-3 py-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            Waiting for Master
          </span>
        ) : (
          <Link
            to={`/match/${match.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-tadka-card hover:bg-tadka-border border border-tadka-border rounded-xl transition-all"
          >
            View Result
          </Link>
        )}
      </div>
    </div>
  );
}
