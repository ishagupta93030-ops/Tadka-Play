import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import MatchCard from '../components/MatchCard';
import PredictionModal from '../components/PredictionModal';
import { useAuth } from '../context/AuthContext';
import { Dices } from 'lucide-react';

export default function SportsPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePredictionMatch, setActivePredictionMatch] = useState(null);

  const activeCategory = category || 'all';

  useEffect(() => {
    fetchCategoryMatches();
  }, [activeCategory]);

  const fetchCategoryMatches = async () => {
    try {
      setLoading(true);
      const url = activeCategory === 'all' ? '/matches' : `/matches?sport=${activeCategory}`;
      const data = await apiRequest(url);
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error('Category matches error:', err);
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

  const sportsTabs = [
    { id: 'all', name: 'All Sports', icon: '🏆' },
    { id: 'cricket', name: 'Cricket', icon: '🏏' },
    { id: 'football', name: 'Football', icon: '⚽' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white capitalize flex items-center gap-2">
          <span>{sportsTabs.find(s => s.id === activeCategory)?.icon || '🏆'}</span>
          <span>{activeCategory === 'all' ? 'All Sports Predictions' : `${activeCategory} Matches`}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Select any upcoming or live match to submit your virtual coin prediction.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sportsTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(`/sports/${tab.id}`)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeCategory === tab.id
                ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange scale-105'
                : 'bg-tadka-card border border-tadka-border text-slate-300 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} onPredict={handlePredict} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Dices className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-base font-bold text-white">No matches found for this sport</p>
          <p className="text-xs">Try selecting another sport tab or check back later.</p>
        </div>
      )}

      {activePredictionMatch && (
        <PredictionModal
          match={activePredictionMatch}
          onClose={() => setActivePredictionMatch(null)}
          onSuccess={fetchCategoryMatches}
        />
      )}
    </div>
  );
}
