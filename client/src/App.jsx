import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import AuthModal from './components/AuthModal';
import CoinDisclaimer from './components/CoinDisclaimer';

// Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LiveMatchesPage = lazy(() => import('./pages/LiveMatchesPage'));
const SportsPage = lazy(() => import('./pages/SportsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const MatchDetailPage = lazy(() => import('./pages/MatchDetailPage'));

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="light-theme min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-tadka-orange selection:text-white">
          
          <div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-400">Loading TadkaPlay...</div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                <Route path="/live" element={<LiveMatchesPage />} />
                <Route path="/sports/:category?" element={<SportsPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/predictions" element={<HistoryPage />} />
                <Route path="/coin-history" element={<WalletPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/match/:id" element={<MatchDetailPage />} />
                </Routes>
              </Suspense>
            </main>
          </div>

          {/* Footer Disclaimer */}
          <footer className="border-t border-tadka-border/70 bg-white/80 py-6 mb-16 md:mb-0">
            <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
              <div className="max-w-xl mx-auto">
                <CoinDisclaimer />
              </div>
              <p className="text-[11px] text-slate-400">
                © 2026 TadkaPlay. All rights reserved. Free-to-Play Virtual Coin Sports Prediction Platform. Zero Monetary Value.
              </p>
            </div>
          </footer>

          <MobileBottomNav />
          <AuthModal />
        </div>
      </Router>
    </AuthProvider>
  );
}
