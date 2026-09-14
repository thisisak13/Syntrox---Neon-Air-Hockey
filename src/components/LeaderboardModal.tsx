// Live Leaderboard Modal for SYNTROX Neon Air Hockey
import React, { useState } from 'react';
import { DifficultyMode } from '../types';
import { LeaderboardService } from '../services/leaderboardService';
import { soundManager } from '../audio/soundManager';
import { Trophy, X, Medal, ShieldCheck, Flame, Skull, Zap } from 'lucide-react';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<'ALL' | DifficultyMode>('ALL');
  const entries = LeaderboardService.getEntries(filter);

  const getDifficultyBadge = (diff: DifficultyMode) => {
    switch (diff) {
      case 'EASY':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            EASY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
            MED
          </span>
        );
      case 'HARD':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30">
            HARD
          </span>
        );
      case 'UNBEATABLE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/60 text-rose-400 border border-rose-500/40">
            UNBEAT
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal size={16} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
    if (rank === 2) return <Medal size={16} className="text-slate-300" />;
    if (rank === 3) return <Medal size={16} className="text-amber-600" />;
    return <span className="font-mono text-xs text-white/50 w-4 text-center">{rank}</span>;
  };

  return (
    <div
      id="modal-leaderboard"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0a0f1e]/95 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-xl sm:text-2xl font-bold text-white tracking-wide">
                LIVE LEADERBOARD
              </h2>
              <p className="text-xs text-white/50 font-mono tracking-wider uppercase">
                ARCADE HIGH SCORE RECORDS
              </p>
            </div>
          </div>

          <button
            id="btn-close-leaderboard"
            onClick={() => {
              soundManager.playButton();
              onClose();
            }}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 py-3 overflow-x-auto no-scrollbar">
          {(['ALL', 'EASY', 'MEDIUM', 'HARD', 'UNBEATABLE'] as const).map((mode) => (
            <button
              key={mode}
              id={`tab-filter-${mode.toLowerCase()}`}
              onClick={() => {
                soundManager.playButton();
                setFilter(mode);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer ${
                filter === mode
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 my-2">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-white/40 font-mono text-xs">
              NO MATCHES LOGGED FOR THIS FILTER YET
            </div>
          ) : (
            entries.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6">{getRankBadge(idx + 1)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-['Orbitron'] font-bold text-sm text-white tracking-wider">
                        {item.playerName}
                      </span>
                      {getDifficultyBadge(item.difficulty)}
                    </div>
                    <div className="text-[11px] text-white/40 font-mono flex items-center space-x-2 mt-0.5">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className={item.result === 'VICTORY' ? 'text-cyan-400' : 'text-rose-400'}>
                        {item.playerGoals} — {item.aiGoals} ({item.result})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-['Orbitron'] font-bold text-base sm:text-lg text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.3)]">
                    {item.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                    POINTS
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 text-center text-[11px] text-white/40 font-mono">
          SCORES DERIVED FROM GOALS, RALLIES, SAVES & DIFFICULTY
        </div>
      </div>
    </div>
  );
};
