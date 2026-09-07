import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Radio, Trophy, User, Dices } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { user, openAuthModal } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/live', label: 'Live', icon: Radio, badge: '🔴' },
    { path: '/sports/all', label: 'Sports', icon: Dices },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { 
      path: user ? '/profile' : '#', 
      label: 'Account', 
      icon: User,
      onClick: (e) => {
        if (!user) {
          e.preventDefault();
          openAuthModal('login');
        }
      }
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-tadka-border/80 px-2 py-1.5 shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-tadka-orange font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-tadka-orange' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 text-[10px] animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-tadka-orange rounded-full mt-0.5 shadow-glow-orange" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
