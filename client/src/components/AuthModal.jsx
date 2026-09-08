import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Flame, Mail, Lock, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import CoinDisclaimer from './CoinDisclaimer';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalTab, setAuthModalTab, login, register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [existingAccount, setExistingAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setExistingAccount(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExistingAccount(false);
    setSubmitting(true);

    try {
      if (authModalTab === 'login') {
        const res = await login(formData.email, formData.password);
        if (!res.success) setError(res.message);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setSubmitting(false);
          return;
        }
        const res = await register(formData.name, formData.email, formData.password, formData.confirmPassword);
        if (!res.success) {
          setError(res.message);
          setExistingAccount(res.message?.toLowerCase().includes('already exists'));
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-tadka-card border border-tadka-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-tadka-border/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-tadka-flame via-tadka-orange to-tadka-yellow p-0.5 shadow-glow-orange mb-3">
            <div className="w-full h-full bg-[#0A0D14] rounded-[14px] flex items-center justify-center">
              <Flame className="w-7 h-7 text-tadka-orange fill-tadka-orange animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome to <span className="gradient-text-orange">TadkaPlay</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Free-to-Play Virtual Sports Prediction Game</p>
        </div>

        {/* Login / Register Tab Buttons */}
        <div className="grid grid-cols-2 gap-2 bg-tadka-dark/80 p-1.5 rounded-2xl border border-tadka-border mb-6">
          <button
            onClick={() => { setAuthModalTab('login'); setError(''); setExistingAccount(false); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              authModalTab === 'login'
                ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setAuthModalTab('register'); setError(''); setExistingAccount(false); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              authModalTab === 'register'
                ? 'bg-gradient-to-r from-tadka-orange to-tadka-flame text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Register</span>
            <span className="text-[10px] bg-amber-400/30 text-amber-300 px-1.5 py-0.5 rounded-full font-extrabold">
              +1,000,000 🪙
            </span>
          </button>
        </div>

        {/* Registration Welcome Bonus Highlight Banner */}
        {authModalTab === 'register' && (
          <div className="bg-gradient-to-r from-amber-500/20 via-tadka-card to-amber-500/20 border border-amber-500/40 rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
              🪙
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">Virtual coins are provided by the Master</p>
              <p className="text-[11px] text-amber-200/80">Claim your starting balance immediately upon registration.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-xl mb-4 text-center">
            <p>{error}</p>
            {existingAccount && (
              <button
                type="button"
                onClick={() => { setAuthModalTab('login'); setError(''); setExistingAccount(false); }}
                className="mt-2 font-extrabold text-amber-300 underline underline-offset-2 hover:text-amber-200"
              >
                Log in with this email instead
              </button>
            )}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {authModalTab === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-tadka-dark border border-tadka-border focus:border-tadka-orange text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-tadka-dark border border-tadka-border focus:border-tadka-orange text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-tadka-dark border border-tadka-border focus:border-tadka-orange text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-colors"
              />
            </div>
          </div>

          {authModalTab === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-tadka-dark border border-tadka-border focus:border-tadka-orange text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 text-xs font-bold text-white bg-gradient-to-r from-tadka-orange via-tadka-orange-light to-tadka-flame rounded-xl shadow-glow-orange hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Processing...</span>
            ) : authModalTab === 'login' ? (
              <span>Log In to TadkaPlay</span>
            ) : (
              <span>Create Free Account & Claim 1,000,000 🪙</span>
            )}
          </button>
        </form>

        {/* Disclaimer Footer */}
        <div className="mt-6 pt-4 border-t border-tadka-border/60">
          <CoinDisclaimer compact />
        </div>

      </div>
    </div>
  );
}
