import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCoins } from '../utils/formatters';
import { Shield, Plus, Edit, Trash2, Radio, CheckCircle, Search, Users, Trophy, Coins, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches', 'users'
  const [matches, setMatches] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Match Modal state
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchForm, setMatchForm] = useState({
    sport: 'cricket',
    team_a_name: '',
    team_a_logo: '',
    team_b_name: '',
    team_b_logo: '',
    match_time: '',
    status: 'UPCOMING',
    venue: '',
    league: ''
  });

  // Live Score Modal state
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveMatch, setLiveMatch] = useState(null);
  const [liveForm, setLiveForm] = useState({
    status: 'LIVE',
    score_team_a: '',
    score_team_b: '',
    match_minute: '',
    live_event_text: ''
  });

  // Declare Winner Modal state
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [winnerMatch, setWinnerMatch] = useState(null);
  const [selectedWinnerTeam, setSelectedWinnerTeam] = useState('');

  // Admin Coin Grant Modal state
  const [grantUser, setGrantUser] = useState(null);
  const [grantCoins, setGrantCoins] = useState(500);
  const [grantReason, setGrantReason] = useState('Community Reward');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats();
    fetchMatches();
    fetchUsers();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const data = await apiRequest('/admin/stats');
      if (data.success) setStats(data.stats);
    } catch (e) {}
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/matches');
      if (data.success) setMatches(data.matches);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiRequest(`/admin/users?search=${searchQuery}`);
      if (data.success) setUsersList(data.users);
    } catch (e) {}
  };

  // Match CRUD Operations
  const handleSaveMatch = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      let res;
      if (editingMatch) {
        res = await apiRequest(`/admin/matches/${editingMatch.id}`, 'PUT', matchForm);
      } else {
        res = await apiRequest('/admin/matches', 'POST', matchForm);
      }

      if (res.success) {
        setMessage(res.message);
        setIsMatchModalOpen(false);
        fetchMatches();
        fetchAdminStats();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMatch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;
    try {
      const res = await apiRequest(`/admin/matches/${id}`, 'DELETE');
      if (res.success) {
        fetchMatches();
        fetchAdminStats();
      }
    } catch (e) {}
  };

  // Live Score Update
  const handleUpdateLiveScore = async (e) => {
    e.preventDefault();
    if (!liveMatch) return;

    try {
      const res = await apiRequest(`/admin/matches/${liveMatch.id}/live-update`, 'POST', liveForm);
      if (res.success) {
        setMessage('Live score updated successfully!');
        setIsLiveModalOpen(false);
        fetchMatches();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Declare Winner & Settle Predictions
  const handleDeclareWinner = async (e) => {
    e.preventDefault();
    if (!winnerMatch || !selectedWinnerTeam) return;

    try {
      const res = await apiRequest(`/admin/matches/${winnerMatch.id}/declare-winner`, 'POST', {
        winner_team: selectedWinnerTeam
      });
      if (res.success) {
        setMessage(res.message);
        setIsWinnerModalOpen(false);
        fetchMatches();
        fetchAdminStats();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // User Suspension Toggle
  const handleToggleSuspend = async (userId) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/toggle-suspend`, 'POST');
      if (res.success) {
        fetchUsers();
        fetchAdminStats();
      }
    } catch (e) {}
  };

  // Admin Coin Adjustment Grant
  const handleGrantCoinsSubmit = async (e) => {
    e.preventDefault();
    if (!grantUser) return;

    try {
      const res = await apiRequest(`/admin/users/${grantUser.id}/adjust-coins`, 'POST', {
        amount: grantCoins,
        reason: grantReason
      });
      if (res.success) {
        setMessage(res.message);
        setGrantUser(null);
        fetchUsers();
        fetchAdminStats();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user || !user.is_admin) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center text-red-400 space-y-2 max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-300">You must be logged in as an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">Admin Control Center</h1>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-300">{user.role || 'ADMIN'}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage matches, update live scores, declare winners & control economy</p>
        </div>

        <button
          onClick={() => {
            setEditingMatch(null);
            setMatchForm({
              sport: 'cricket',
              team_a_name: '',
              team_a_logo: '',
              team_b_name: '',
              team_b_logo: '',
              match_time: new Date().toISOString().slice(0, 16),
              status: 'UPCOMING',
              venue: '',
              league: ''
            });
            setIsMatchModalOpen(true);
          }}
          className="px-5 py-3 text-xs font-extrabold text-white bg-gradient-to-r from-tadka-orange to-tadka-flame rounded-2xl shadow-glow-orange hover:brightness-110 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Match</span>
        </button>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-3 rounded-2xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Statistics Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-card rounded-2xl p-3.5 border border-tadka-border text-center">
            <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-semibold">Total Users</span>
            <span className="text-lg font-black text-white">{stats.totalUsers}</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-tadka-border text-center">
            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-semibold">Active Users</span>
            <span className="text-lg font-black text-emerald-400">{stats.activeUsers}</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-tadka-border text-center">
            <Trophy className="w-5 h-5 text-tadka-orange mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-semibold">Total Predictions</span>
            <span className="text-lg font-black text-white">{stats.totalPredictions}</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-tadka-border text-center">
            <Coins className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-semibold">Total Coins</span>
            <span className="text-lg font-black text-amber-300">🪙 {formatCoins(stats.totalCoinsInCirculation)}</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-tadka-border text-center">
            <Radio className="w-5 h-5 text-red-400 mx-auto mb-1 animate-pulse" />
            <span className="text-[10px] text-slate-400 block font-semibold">Live Matches</span>
            <span className="text-lg font-black text-red-400">{stats.liveMatches}</span>
          </div>

          <div className="glass-card rounded-2xl p-3.5 border border-tadka-border text-center">
            <RefreshCw className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 block font-semibold">Upcoming</span>
            <span className="text-lg font-black text-purple-300">{stats.upcomingMatches}</span>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl border border-tadka-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white">Account Roles</h2>
          <span className="text-[10px] text-slate-400">Role permissions are enforced by the backend</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 p-3">
            <p className="text-xs font-black text-slate-200">USER</p>
            <p className="mt-1 text-[10px] text-slate-400">Predictions, rewards, wallet and profile</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs font-black text-amber-300">MASTER</p>
            <p className="mt-1 text-[10px] text-slate-400">Matches, settlements and permitted user actions</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs font-black text-red-300">SUPER_MASTER</p>
            <p className="mt-1 text-[10px] text-slate-400">Full admin and MASTER account management</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-tadka-border/60 pb-3">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'matches'
              ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Match Management
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          User Management
        </button>
        {user.role === 'SUPER_MASTER' && (
          <button
            onClick={() => setActiveTab('masters')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'masters' ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-glow-orange' : 'text-slate-400 hover:text-white'
            }`}
          >
            Master Management
          </button>
        )}
      </div>

      {/* TAB 1: MATCH MANAGEMENT */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {matches.map((m) => (
              <div key={m.id} className="glass-card rounded-2xl p-4 border border-tadka-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-white">{m.team_a_name} vs {m.team_b_name}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      m.status === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      m.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {m.status}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase bg-tadka-dark px-2 py-0.5 rounded-full">{m.sport}</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Score: <span className="font-mono text-amber-300 font-bold">{m.score_team_a || '0'} - {m.score_team_b || '0'}</span> ({m.match_minute || 'Scheduled'})
                  </p>
                  <p className="text-[10px] text-slate-400">{m.league} • {m.venue}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setLiveMatch(m);
                      setLiveForm({
                        status: m.status,
                        score_team_a: m.score_team_a || '0',
                        score_team_b: m.score_team_b || '0',
                        match_minute: m.match_minute || '',
                        live_event_text: ''
                      });
                      setIsLiveModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-all flex items-center gap-1"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>Update Score & Feed</span>
                  </button>

                  {m.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setWinnerMatch(m);
                        setSelectedWinnerTeam(m.team_a_name);
                        setIsWinnerModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center gap-1"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Declare Winner</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingMatch(m);
                      setMatchForm({
                        sport: m.sport,
                        team_a_name: m.team_a_name,
                        team_a_logo: m.team_a_logo,
                        team_b_name: m.team_b_name,
                        team_b_logo: m.team_b_logo,
                        match_time: new Date(m.match_time).toISOString().slice(0, 16),
                        status: m.status,
                        venue: m.venue,
                        league: m.league
                      });
                      setIsMatchModalOpen(true);
                    }}
                    className="p-2 text-slate-300 bg-tadka-dark border border-tadka-border hover:text-white rounded-xl"
                    title="Edit Match"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteMatch(m.id)}
                    className="p-2 text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl"
                    title="Delete Match"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchUsers();
                }}
                className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            {usersList.map((u) => (
              <div key={u.id} className="glass-card rounded-2xl p-4 border border-tadka-border flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{u.name}</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">Lvl {u.level}</span>
                    {u.is_suspended ? (
                      <span className="text-[10px] font-extrabold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">SUSPENDED</span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-amber-300">🪙 {formatCoins(u.coin_balance)}</span>

                  <button
                    onClick={() => {
                      setGrantUser(u);
                      setGrantCoins(500);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-all"
                  >
                    + Grant Coins
                  </button>

                  <button
                    onClick={() => handleToggleSuspend(u.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      u.is_suspended
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {u.is_suspended ? 'Activate' : 'Suspend'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'masters' && user.role === 'SUPER_MASTER' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
            Only SUPER_MASTER can promote USER accounts to MASTER or demote MASTER accounts. SUPER_MASTER accounts cannot be changed here.
          </div>
          <div className="space-y-2">
            {usersList.filter(account => account.role !== 'SUPER_MASTER').map(account => (
              <div key={account.id} className="glass-card flex items-center justify-between gap-3 rounded-2xl border border-tadka-border p-4">
                <div>
                  <p className="text-sm font-extrabold text-white">{account.name}</p>
                  <p className="text-[11px] text-slate-400">{account.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={account.role || 'USER'}
                    onChange={async (event) => {
                      try {
                        await apiRequest(`/admin/users/${account.id}/role`, 'PATCH', { role: event.target.value });
                        fetchUsers();
                      } catch (err) { setError(err.message); }
                    }}
                    className="rounded-xl border border-tadka-border bg-tadka-dark px-2 py-1.5 text-xs font-bold text-amber-300 outline-none"
                    title="Change account role"
                  >
                    <option value="USER">USER</option>
                    <option value="MASTER">MASTER</option>
                    <option value="SUPER_MASTER" disabled>SUPER_MASTER (Protected)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD/EDIT MATCH */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-tadka-card border border-tadka-border rounded-3xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-tadka-border pb-3">
              <h3 className="font-extrabold text-lg text-white">{editingMatch ? 'Edit Match' : 'Add New Match'}</h3>
              <button onClick={() => setIsMatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sport</label>
                <select
                  value={matchForm.sport}
                  onChange={(e) => setMatchForm({ ...matchForm, sport: e.target.value })}
                  className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                >
                  <option value="cricket">Cricket 🏏</option>
                  <option value="football">Football ⚽</option>
                  <option value="tennis">Tennis 🎾</option>
                  <option value="basketball">Basketball 🏀</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Team A Name</label>
                  <input
                    type="text"
                    required
                    value={matchForm.team_a_name}
                    onChange={(e) => setMatchForm({ ...matchForm, team_a_name: e.target.value })}
                    className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Team B Name</label>
                  <input
                    type="text"
                    required
                    value={matchForm.team_b_name}
                    onChange={(e) => setMatchForm({ ...matchForm, team_b_name: e.target.value })}
                    className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Match Time & Date</label>
                <input
                  type="datetime-local"
                  required
                  value={matchForm.match_time}
                  onChange={(e) => setMatchForm({ ...matchForm, match_time: e.target.value })}
                  className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">League / Tournament</label>
                  <input
                    type="text"
                    value={matchForm.league}
                    onChange={(e) => setMatchForm({ ...matchForm, league: e.target.value })}
                    className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Venue</label>
                  <input
                    type="text"
                    value={matchForm.venue}
                    onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                    className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-tadka-orange to-tadka-flame rounded-xl"
              >
                Save Match
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE LIVE SCORE */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-tadka-card border border-tadka-border rounded-3xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-tadka-border pb-3">
              <h3 className="font-extrabold text-lg text-white">Live Score Simulator</h3>
              <button onClick={() => setIsLiveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLiveScore} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
                <select
                  value={liveForm.status}
                  onChange={(e) => setLiveForm({ ...liveForm, status: e.target.value })}
                  className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                >
                  <option value="LIVE">🔴 LIVE</option>
                  <option value="UPCOMING">⏱️ UPCOMING</option>
                  <option value="COMPLETED">✅ COMPLETED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{liveMatch?.team_a_name} Score</label>
                  <input
                    type="text"
                    value={liveForm.score_team_a}
                    onChange={(e) => setLiveForm({ ...liveForm, score_team_a: e.target.value })}
                    className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{liveMatch?.team_b_name} Score</label>
                  <input
                    type="text"
                    value={liveForm.score_team_b}
                    onChange={(e) => setLiveForm({ ...liveForm, score_team_b: e.target.value })}
                    className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Match Minute / Overs</label>
                <input
                  type="text"
                  placeholder="e.g. 18.4 Overs / 72' min"
                  value={liveForm.match_minute}
                  onChange={(e) => setLiveForm({ ...liveForm, match_minute: e.target.value })}
                  className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Add Commentary Event Ticker</label>
                <input
                  type="text"
                  placeholder="e.g. SIX! Huge hit over long-on!"
                  value={liveForm.live_event_text}
                  onChange={(e) => setLiveForm({ ...liveForm, live_event_text: e.target.value })}
                  className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-tadka-orange to-tadka-flame rounded-xl"
              >
                Update Live Feed
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DECLARE WINNER */}
      {isWinnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-tadka-card border border-tadka-border rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-tadka-border pb-3">
              <h3 className="font-extrabold text-lg text-white">Declare Match Winner</h3>
              <button onClick={() => setIsWinnerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclareWinner} className="space-y-4">
              <p className="text-xs text-slate-300">
                Select the winner of <strong className="text-white">{winnerMatch?.team_a_name} vs {winnerMatch?.team_b_name}</strong>.
                This will automatically settle all pending user predictions and credit winning payouts to their virtual coin wallets!
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedWinnerTeam(winnerMatch.team_a_name)}
                  className={`w-full p-3 rounded-xl border text-xs font-bold transition-all ${
                    selectedWinnerTeam === winnerMatch.team_a_name
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-tadka-dark border-tadka-border text-slate-300'
                  }`}
                >
                  🏆 Winner: {winnerMatch?.team_a_name}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWinnerTeam(winnerMatch.team_b_name)}
                  className={`w-full p-3 rounded-xl border text-xs font-bold transition-all ${
                    selectedWinnerTeam === winnerMatch.team_b_name
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-tadka-dark border-tadka-border text-slate-300'
                  }`}
                >
                  🏆 Winner: {winnerMatch?.team_b_name}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl"
              >
                Confirm Winner & Settle Payouts
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADMIN GRANT COINS */}
      {grantUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-tadka-card border border-tadka-border rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-tadka-border pb-3">
              <h3 className="font-extrabold text-lg text-white">Grant Virtual Coins</h3>
              <button onClick={() => setGrantUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantCoinsSubmit} className="space-y-3">
              <p className="text-xs text-slate-300">Grant virtual coins to <strong className="text-white">{grantUser.name}</strong> ({grantUser.email}).</p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Coin Amount</label>
                <input
                  type="number"
                  required
                  value={grantCoins}
                  onChange={(e) => setGrantCoins(e.target.value)}
                  className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full bg-tadka-dark border border-tadka-border text-white text-xs rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-tadka-orange to-tadka-flame rounded-xl"
              >
                Grant Coins
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
