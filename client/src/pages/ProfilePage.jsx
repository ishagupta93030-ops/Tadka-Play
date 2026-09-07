import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { formatCoins } from '../utils/formatters';
import CoinDisclaimer from '../components/CoinDisclaimer';
import { User, Coins, Award, Target, Flame, CheckCircle, ShieldCheck, Pencil, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, openAuthModal } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', avatar: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', avatar: user.avatar || '' });
    fetchAchievements();
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await apiRequest('/auth/me', 'PATCH', form);
      updateUser(data.user);
      setEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/achievements');
      if (data.success) {
        setAchievements(data.achievements);
      }
    } catch (err) {
      console.error('Fetch achievements error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="glass-card rounded-3xl p-12 text-center text-slate-300"><p>Please log in to view your profile.</p><button onClick={() => openAuthModal('login')} className="mt-4 rounded-xl bg-tadka-orange px-4 py-2 text-xs font-bold text-white">Log In</button></div>;

  const currentLevel = user.level || 1;
  const currentXP = user.xp || 0;
  const nextLevelXP = currentLevel * 300;
  const xpPercent = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);

  const stats = user.stats || { totalPredictions: 0, correctPredictions: 0, accuracy: 0 };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* Profile Top Banner Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-tadka-border relative overflow-hidden bg-gradient-to-r from-tadka-card via-tadka-dark to-[#1C1226]">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-tadka-orange shadow-glow-orange"
            />
            <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-tadka-orange to-tadka-flame text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md">
              Lvl {currentLevel}
            </span>
          </div>

          {/* User Details */}
          <div className="space-y-2 text-center sm:text-left flex-1">
            {editing ? (
              <form onSubmit={saveProfile} className="space-y-2 text-left">
                <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-tadka-border bg-tadka-dark px-3 py-2 text-sm text-white" placeholder="Display name" />
                <input value={form.avatar} onChange={event => setForm({ ...form, avatar: event.target.value })} className="w-full rounded-xl border border-tadka-border bg-tadka-dark px-3 py-2 text-sm text-white" placeholder="Avatar URL" />
                <div className="flex gap-2"><button className="flex items-center gap-1 rounded-xl bg-tadka-orange px-3 py-2 text-xs font-bold text-white"><Save className="h-3.5 w-3.5" />Save</button><button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-xl border border-tadka-border px-3 py-2 text-xs text-slate-300"><X className="h-3.5 w-3.5" />Cancel</button></div>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 sm:justify-start"><h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1><button onClick={() => setEditing(true)} title="Edit profile" className="rounded-lg p-1 text-slate-400 hover:text-white"><Pencil className="h-4 w-4" /></button></div>
            )}
            {message && <p className="text-xs text-emerald-400">{message}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                user.role === 'SUPER_MASTER'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : user.role === 'MASTER'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
              }`}>
                <ShieldCheck className="w-3 h-3" /> {user.role || 'USER'}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">{user.email}</p>

            {/* Level XP Progress Bar */}
            <div className="pt-2 max-w-md">
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Level {currentLevel} Progress</span>
                <span className="text-amber-400">{currentXP} / {nextLevelXP} XP ({xpPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-tadka-dark rounded-full overflow-hidden border border-tadka-border">
                <div
                  className="h-full bg-gradient-to-r from-tadka-orange via-tadka-yellow to-amber-400 rounded-full transition-all duration-500 shadow-glow-orange"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-extrabold text-white">Account Role</h2>
          <p className="text-xs text-slate-400">Your access level and available account permissions</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { role: 'USER', title: 'User Card', description: 'Predictions, rewards, wallet and profile', colors: 'border-slate-500/40 bg-slate-500/10 text-slate-200' },
            { role: 'MASTER', title: 'Master Card', description: 'Matches, settlements and permitted user actions', colors: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
            { role: 'SUPER_MASTER', title: 'Super Card', description: 'Full admin and master account management', colors: 'border-red-500/40 bg-red-500/10 text-red-300' }
          ].map(accountRole => (
            <div key={accountRole.role} className={`rounded-2xl border p-4 transition-all ${accountRole.colors} ${user.role === accountRole.role ? 'ring-2 ring-tadka-orange/70' : 'opacity-60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black">{accountRole.title}</span>
                {user.role === accountRole.role && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">ACTIVE</span>}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{accountRole.description}</p>
            </div>
          ))}
        </div>
      </section>

      <CoinDisclaimer />

      {/* Prediction Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card rounded-2xl p-4 text-center border border-tadka-border">
          <Coins className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <span className="text-[11px] text-slate-400 font-semibold block">Virtual Coins</span>
          <span className="text-xl font-black text-amber-300">🪙 {formatCoins(user.coin_balance)}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 text-center border border-tadka-border">
          <Target className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <span className="text-[11px] text-slate-400 font-semibold block">Total Predictions</span>
          <span className="text-xl font-black text-white">{stats.totalPredictions}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 text-center border border-tadka-border">
          <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <span className="text-[11px] text-slate-400 font-semibold block">Correct Predictions</span>
          <span className="text-xl font-black text-emerald-400">{stats.correctPredictions}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 text-center border border-tadka-border">
          <Flame className="w-6 h-6 text-tadka-orange mx-auto mb-1" />
          <span className="text-[11px] text-slate-400 font-semibold block">Prediction Accuracy</span>
          <span className="text-xl font-black text-tadka-orange">{stats.accuracy}%</span>
        </div>

        <div className="glass-card rounded-2xl p-4 text-center border border-tadka-border">
          <Coins className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <span className="text-[11px] text-slate-400 font-semibold block">Coins Earned</span>
          <span className="text-xl font-black text-emerald-400">{formatCoins(stats.totalCoinsEarned || 0)}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 text-center border border-tadka-border">
          <Target className="w-6 h-6 text-red-400 mx-auto mb-1" />
          <span className="text-[11px] text-slate-400 font-semibold block">Coins Used</span>
          <span className="text-xl font-black text-red-400">{formatCoins(stats.totalCoinsUsed || 0)}</span>
        </div>
      </div>

      {/* Achievement Badges Section */}
      <div className="glass-card rounded-3xl p-6 border border-tadka-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Achievement Badges & XP</span>
          </h2>
          <span className="text-xs text-slate-400">
            {achievements.filter(a => a.isUnlocked).length} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-2xl p-4 border flex items-center gap-3 transition-all ${
                ach.isUnlocked
                  ? 'bg-gradient-to-r from-amber-500/10 via-tadka-card to-tadka-dark border-amber-500/40 shadow-glow-yellow'
                  : 'bg-tadka-dark/60 border-tadka-border/60 opacity-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-tadka-dark border border-tadka-border flex items-center justify-center text-2xl shrink-0">
                {ach.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-white">{ach.name}</h3>
                  {ach.isUnlocked && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Unlocked ✅
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{ach.description}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold">
                  <span className="text-amber-300">+{ach.coin_reward} 🪙</span>
                  <span className="text-tadka-orange">+{ach.xp_reward} XP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
