import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { formatCoins } from '../utils/formatters';
import { X, Sparkles, ShieldAlert, Coins, CheckCircle, AlertTriangle } from 'lucide-react';
import CoinDisclaimer from './CoinDisclaimer';

export default function PredictionModal({ match, onClose, onSuccess }) {
  const { user, updateUserCoins } = useAuth();

  const [selectedTeam, setSelectedTeam] = useState(match?.team_a_name || '');
  const [stakedCoins, setStakedCoins] = useState(100);
  const [customStake, setCustomStake] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!match) return null;

  const quickCoinAmounts = [10, 25, 50, 100, 250];
  const multiplier = 1.9;
  const currentStake = customStake ? parseInt(customStake) || 0 : stakedCoins;
  const potentialWin = Math.round(currentStake * multiplier);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleSelectStake = (amount) => {
    setStakedCoins(amount);
    setCustomStake('');
    setError('');
  };

  const handleCustomStakeChange = (e) => {
    setCustomStake(e.target.value);
    setError('');
  };

  const handleProceedToConfirm = () => {
    if (!selectedTeam) {
      setError('Please select a team to win.');
      return;
    }
    if (currentStake <= 0) {
      setError('Please select or enter a valid coin amount.');
      return;
    }
    if (user && user.coin_balance < currentStake) {
      setError(`Insufficient balance! You have 🪙 ${formatCoins(user.coin_balance)} virtual coins.`);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await apiRequest('/predictions/submit', 'POST', {
        match_id: match.id,
        predicted_team: selectedTeam,
        coins_staked: currentStake
      });

      if (res.success) {
        triggerConfetti();
        updateUserCoins(res.newBalance);
        setSuccessData(res);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message);
        setShowConfirm(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit prediction.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-tadka-card border border-tadka-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-tadka-border/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!successData ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tadka-orange/20 border border-tadka-orange/40 text-tadka-orange text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Predict Match Winner</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                {match.team_a_name} <span className="text-tadka-orange">VS</span> {match.team_b_name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{match.league} • {match.venue}</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-xl mb-4 text-center">
                {error}
              </div>
            )}

            {!showConfirm ? (
              /* Step 1: Select Team & Coins */
              <div className="space-y-5">
                
                {/* Team Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Which team will win?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Team A Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedTeam(match.team_a_name)}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        selectedTeam === match.team_a_name
                          ? 'bg-gradient-to-b from-tadka-orange/20 to-tadka-card border-tadka-orange shadow-glow-orange text-white'
                          : 'bg-tadka-dark/80 border-tadka-border hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      <img
                        src={match.team_a_logo}
                        alt={match.team_a_name}
                        className="w-12 h-12 object-contain"
                      />
                      <span className="font-extrabold text-sm">{match.team_a_name}</span>
                      <span className="text-[10px] text-amber-400 font-semibold">1.9x Reward</span>
                    </button>

                    {/* Team B Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedTeam(match.team_b_name)}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        selectedTeam === match.team_b_name
                          ? 'bg-gradient-to-b from-tadka-orange/20 to-tadka-card border-tadka-orange shadow-glow-orange text-white'
                          : 'bg-tadka-dark/80 border-tadka-border hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      <img
                        src={match.team_b_logo}
                        alt={match.team_b_name}
                        className="w-12 h-12 object-contain"
                      />
                      <span className="font-extrabold text-sm">{match.team_b_name}</span>
                      <span className="text-[10px] text-amber-400 font-semibold">1.9x Reward</span>
                    </button>

                  </div>
                </div>

                {/* Virtual Coin Chips */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Virtual Coins to Predict:</span>
                    <span className="text-amber-400">Available: 🪙 {formatCoins(user?.coin_balance)}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {quickCoinAmounts.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleSelectStake(amount)}
                        className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                          !customStake && stakedCoins === amount
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-glow-yellow'
                            : 'bg-tadka-dark border-tadka-border hover:border-amber-400/50 text-slate-300'
                        }`}
                      >
                        🪙 {amount}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    placeholder="Or enter custom coin amount"
                    value={customStake}
                    onChange={handleCustomStakeChange}
                    className="w-full bg-tadka-dark border border-tadka-border focus:border-amber-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none font-semibold"
                  />
                </div>

                {/* Potential Reward Summary */}
                <div className="bg-tadka-dark/90 border border-tadka-border rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Potential Virtual Coin Payout:</span>
                    <span className="text-xl font-extrabold text-amber-300 flex items-center gap-1">
                      🪙 {formatCoins(potentialWin)} Coins
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    +{(potentialWin - currentStake)} Profit 🪙
                  </span>
                </div>

                {/* Action CTA */}
                <button
                  type="button"
                  onClick={handleProceedToConfirm}
                  className="w-full py-3.5 text-sm font-extrabold text-white bg-gradient-to-r from-tadka-orange via-tadka-orange-light to-tadka-flame rounded-2xl shadow-glow-orange hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                  <span>Review Prediction</span>
                </button>

                <CoinDisclaimer compact />
              </div>
            ) : (
              /* Step 2: Confirmation Modal Step */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
                  <Coins className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
                  <h3 className="font-extrabold text-lg text-white mb-1">Confirm Your Prediction</h3>
                  <p className="text-xs text-slate-300">
                    You are using <strong className="text-amber-300 font-extrabold">🪙 {formatCoins(currentStake)} virtual coins</strong> for this prediction on <strong className="text-white font-extrabold">{selectedTeam}</strong>.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-300 bg-tadka-dark p-3.5 rounded-xl border border-tadka-border">
                  <div className="flex justify-between">
                    <span>Selected Winner:</span>
                    <span className="font-bold text-white">{selectedTeam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coins Staked:</span>
                    <span className="font-bold text-amber-300">🪙 {formatCoins(currentStake)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential Payout:</span>
                    <span className="font-bold text-emerald-400">🪙 {formatCoins(potentialWin)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-tadka-border/60 text-[10px] text-slate-400">
                    <span>Game Mode:</span>
                    <span className="font-semibold text-amber-400">FREE-TO-PLAY Virtual Coins Only</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="py-3 text-xs font-bold text-slate-300 bg-tadka-dark border border-tadka-border hover:bg-tadka-border/50 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    disabled={submitting}
                    className="py-3 text-xs font-extrabold text-white bg-gradient-to-r from-tadka-orange to-tadka-flame rounded-xl shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Prediction'}
                  </button>
                </div>

                <CoinDisclaimer compact />
              </div>
            )}
          </>
        ) : (
          /* Step 3: Success Confirmation Screen */
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-green">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">Prediction Placed! 🎉</h3>
              <p className="text-xs text-slate-300 mt-1">
                You successfully predicted <strong className="text-amber-300">{selectedTeam}</strong> with 🪙 {formatCoins(currentStake)} virtual coins.
              </p>
            </div>

            <div className="bg-tadka-dark/90 border border-tadka-border rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Match:</span>
                <span className="font-bold text-white">{match.team_a_name} vs {match.team_b_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Potential Reward:</span>
                <span className="font-bold text-amber-300">🪙 {formatCoins(potentialWin)} Coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Updated Wallet Balance:</span>
                <span className="font-bold text-emerald-400">🪙 {formatCoins(successData.newBalance)} Coins</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-tadka-orange to-tadka-flame rounded-xl shadow-glow-orange hover:brightness-110 transition-all"
            >
              Done & Track Match
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
