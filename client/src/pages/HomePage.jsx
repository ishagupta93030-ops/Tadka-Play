import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import PredictionModal from '../components/PredictionModal';
import CoinDisclaimer from '../components/CoinDisclaimer';
import { Flame, Sparkles, Trophy, ArrowRight, RefreshCw, Search, Bell, CalendarDays } from 'lucide-react';

export default function HomePage() {
  const { user, openAuthModal } = useAuth();
  const [matches, setMatches] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Prediction Modal state
  const [activeMatchForPrediction, setActiveMatchForPrediction] = useState(null);
  
  const [dailyUpdates, setDailyUpdates] = useState([]);

  useEffect(() => {
    fetchMatches();
    if (!user) {
      setDailyUpdates([]);
      return undefined;
    }

    fetchDailyUpdates();
    const refreshUpdates = window.setInterval(fetchDailyUpdates, 60000);
    const refreshMatches = window.setInterval(fetchMatches, 15000);
    return () => {
      window.clearInterval(refreshUpdates);
      window.clearInterval(refreshMatches);
    };
  }, [selectedSport, user]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const url = selectedSport === 'all' ? '/matches' : `/matches?sport=${selectedSport}`;
      const data = await apiRequest(url);
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error('Fetch matches error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyUpdates = async () => {
    try {
      const data = await apiRequest('/notifications');
      if (data.success) setDailyUpdates(data.notifications || []);
    } catch (e) {
      setDailyUpdates([]);
    }
  };

  const handlePredictClick = (match) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setActiveMatchForPrediction(match);
  };

  // Group matches by status
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const upcomingMatches = matches.filter(m => m.status === 'UPCOMING');
  const completedMatches = matches.filter(m => m.status === 'COMPLETED');
  const visibleMatches = matches.filter(match => {
    const query = search.trim().toLowerCase();
    return !query || [match.team_a_name, match.team_b_name, match.league, match.venue].some(value => String(value || '').toLowerCase().includes(query));
  });
  const visibleLiveMatches = visibleMatches.filter(m => m.status === 'LIVE');
  const visibleUpcomingMatches = visibleMatches.filter(m => m.status === 'UPCOMING');
  const visibleCompletedMatches = visibleMatches.filter(m => m.status === 'COMPLETED');
  const popularMatches = visibleMatches.slice(0, 4);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden glass-card p-6 sm:p-10 border border-orange-200/80 bg-gradient-to-br from-white via-orange-50/70 to-amber-50">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-200/35 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-tadka-orange/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold shadow-glow-yellow">
            <Flame className="w-4 h-4 text-tadka-orange fill-tadka-orange animate-bounce" />
            <span>FREE-TO-PLAY VIRTUAL SPORTS PREDICTION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Predict • Play • <br />
            <span className="gradient-text-orange">Win Virtual Coins</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            Test your sports intuition on Cricket, Football, Tennis & Basketball. The Master provides virtual coins for hosted games.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('live-matches-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 text-sm font-extrabold text-white bg-gradient-to-r from-tadka-orange via-tadka-orange-light to-tadka-flame rounded-2xl shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
              <span>Play Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

          <CoinDisclaimer />
        </div>
      </section>

      {/* Sports Navigation Filter Chips */}
      <section className="flex items-center justify-between gap-3 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Sports', icon: '🏆' },
            { id: 'cricket', label: 'Cricket', icon: '🏏' },
            { id: 'football', label: 'Football', icon: '⚽' },
            { id: 'tennis', label: 'Tennis', icon: '🎾' },
            { id: 'basketball', label: 'Basketball', icon: '🏀' }
          ].map(sport => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                selectedSport === sport.id
                  ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange scale-105'
                  : 'bg-tadka-card hover:bg-tadka-border/60 text-slate-300 border border-tadka-border'
              }`}
            >
              <span className="text-sm">{sport.icon}</span>
              <span>{sport.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={fetchMatches}
          className="p-2 rounded-xl bg-tadka-card border border-tadka-border text-slate-400 hover:text-white transition-colors"
          title="Refresh Matches"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </section>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search teams, players, leagues or venues"
          className="w-full rounded-xl border border-tadka-border bg-tadka-card py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-tadka-orange"
        />
      </div>

      {/* SECTION 1: 🔴 LIVE NOW */}
      <section id="live-matches-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>🔴 LIVE NOW</span>
              <span className="text-xs font-semibold text-slate-400">({visibleLiveMatches.length})</span>
            </h2>
          </div>
        </div>

        {visibleLiveMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleLiveMatches.map(match => (
              <MatchCard key={match.id} match={match} onPredict={handlePredictClick} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center text-slate-400 text-xs">
            No matches live right now. Check upcoming matches below to submit your predictions early!
          </div>
        )}
      </section>

      {/* SECTION 2: 🔥 Popular Matches */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>🔥 Popular Matches</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularMatches.map(match => (
            <MatchCard key={match.id} match={match} onPredict={handlePredictClick} />
          ))}
        </div>
      </section>

      {/* SECTION 3: ⏱️ Upcoming Matches */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>⏱️ Upcoming Matches</span>
          <span className="text-xs font-semibold text-slate-400">({upcomingMatches.length})</span>
        </h2>

        {upcomingMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleUpcomingMatches.map(match => (
              <MatchCard key={match.id} match={match} onPredict={handlePredictClick} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center text-slate-400 text-xs">
            No upcoming matches found for this filter.
          </div>
        )}
      </section>

      {user && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-400" /> Daily Updates
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live feed</span>
          </div>
          <div className="glass-card rounded-2xl border border-tadka-border p-4">
            {dailyUpdates.length > 0 ? (
              <div className="space-y-2">
                {dailyUpdates.slice(0, 5).map(update => (
                  <div key={update.id} className={`flex items-start gap-3 rounded-xl p-3 ${update.is_read ? 'bg-tadka-dark/40' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-200">{update.message}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{new Date(update.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-center text-xs text-slate-400">Your daily updates will appear here.</p>
            )}
          </div>
        </section>
      )}

      {/* SECTION 5: ✅ Recently Completed Matches */}
      {visibleCompletedMatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>✅ Recently Completed</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCompletedMatches.map(match => (
              <MatchCard key={match.id} match={match} onPredict={handlePredictClick} />
            ))}
          </div>
        </section>
      )}

      {/* Active Prediction Drawer/Modal */}
      {activeMatchForPrediction && (
        <PredictionModal
          match={activeMatchForPrediction}
          onClose={() => setActiveMatchForPrediction(null)}
          onSuccess={() => {
            fetchMatches();
          }}
        />
      )}

    </div>
  );
}
