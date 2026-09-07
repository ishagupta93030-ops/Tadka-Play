import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCoins } from '../utils/formatters';
import { Flame, Coins, User, LogOut, Shield, History } from 'lucide-react';
import CoinDisclaimer from './CoinDisclaimer';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, openAuthModal, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-tadka-border/70 transition-all shadow-[0_8px_24px_-22px_rgba(15,23,42,0.45)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-tadka-flame via-tadka-orange to-tadka-yellow p-0.5 shadow-glow-orange group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-tadka-orange fill-tadka-orange animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 flex items-center gap-1">
                Tadka<span className="gradient-text-orange">Play</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 font-semibold tracking-wider uppercase">Free Sports Prediction</span>
            </div>
          </Link>

          {/* Desktop Sports Quick Filter Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-full border border-tadka-border shadow-sm">
            {[
              { path: '/', label: 'Home', icon: '🏠' },
              { path: '/sports/cricket', label: 'Cricket', icon: '🏏' },
              { path: '/sports/football', label: 'Football', icon: '⚽' },
              { path: '/sports/tennis', label: 'Tennis', icon: '🎾' },
              { path: '/sports/basketball', label: 'Basketball', icon: '🏀' },
              { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' }
            ].map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                {/* Virtual Coin Balance Widget */}
                <Link
                  to="/wallet"
                  className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-full text-amber-700 transition-all shadow-glow-yellow group"
                  title="Virtual Wallet Balance"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    🪙
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider leading-none">Coins</span>
                    <span className="font-extrabold text-sm sm:text-base text-amber-700 leading-tight">
                      {formatCoins(user.coin_balance)}
                    </span>
                  </div>
                </Link>

                {/* Profile / Admin Menu */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-full border border-tadka-border hover:border-tadka-orange transition-all focus:outline-none"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-tadka-orange"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white border border-tadka-border rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-tadka-border/60">
                        <p className="font-bold text-sm text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="bg-tadka-orange/20 text-tadka-orange border border-tadka-orange/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Lvl {user.level || 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            user.role === 'SUPER_MASTER'
                              ? 'bg-red-500/15 text-red-300 border-red-500/30'
                              : user.role === 'MASTER'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                          }`}>
                            {user.role || 'USER'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">XP: {user.xp || 0}</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-tadka-orange" />
                          <span>My Account</span>
                        </Link>
                        <Link
                          to="/wallet"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>Virtual Coin Wallet</span>
                        </Link>
                        <Link
                          to="/history"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <History className="w-4 h-4 text-blue-400" />
                          <span>Prediction History</span>
                        </Link>

                        {user.role === 'MASTER' || user.role === 'SUPER_MASTER' || user.is_admin ? (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 rounded-xl font-bold transition-colors"
                          >
                            <Shield className="w-4 h-4 text-amber-400" />
                            <span>Admin Dashboard</span>
                          </Link>
                        ) : null}
                      </div>

                      <div className="pt-1 border-t border-tadka-border/60">
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-tadka-border rounded-xl transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-tadka-orange via-tadka-orange-light to-tadka-flame rounded-xl shadow-glow-orange hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <span>Register</span>
                    <span className="bg-amber-400/30 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full hidden sm:inline-block">
                    +1,000,000 🪙
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
