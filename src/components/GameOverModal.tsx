// Game Over & Match Result Screen for SYNTROX Neon Air Hockey
import React, { useEffect, useState } from 'react';
import { DifficultyMode, MatchStats, LeaderboardEntry } from '../types';
import { soundManager } from '../audio/soundManager';
import { LeaderboardService } from '../services/leaderboardService';
import { Trophy, RotateCcw, Sliders, Home, Award, Zap, Timer, Flame } from 'lucide-react';

interface GameOverModalProps {
  winner: 'PLAYER' | 'AI';
  difficulty: DifficultyMode;
  stats: MatchStats;
  playerName: string;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
  onMainMenu: () => void;
  onViewLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  difficulty,
  stats,
  playerName,
  onPlayAgain,
  onChangeDifficulty,
  onMainMenu,
  onViewLeaderboard,
}) => {
  const isPlayerWinner = winner === 'PLAYER';
  const userDisplayName = playerName?.trim() ? playerName.trim().toUpperCase() : 'PLAYER';
  const winnerTitle = isPlayerWinner ? `${userDisplayName} WINS` : 'SYNTROX AI WINS';
  const [submittedEntry, setSubmittedEntry] = useState<{ entry: LeaderboardEntry; rank: number } | null>(null);

  // Trigger sounds and submit to leaderboard on mount
  useEffect(() => {
    if (isPlayerWinner) {
      soundManager.playVictory();
    } else {
      soundManager.playDefeat();
    }

    // Submit completed match score
    const result = LeaderboardService.submitMatch(playerName, difficulty, stats);
    setSubmittedEntry(result);
  }, [isPlayerWinner, playerName, difficulty, stats]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const achievements = LeaderboardService.evaluateAchievements(difficulty, stats);

  return (
    <div
      id="modal-gameover"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto select-none"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1d]/95 p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center my-auto">
        {/* Winner Banner */}
        <div className="mb-4">
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase mb-2 ${
              isPlayerWinner
                ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-rose-950/80 border border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(255,0,85,0.4)]'
            }`}
          >
            <Trophy size={14} className={isPlayerWinner ? 'text-cyan-400' : 'text-rose-400'} />
            <span>MATCH CONCLUSION</span>
          </div>

          <h2
            className={`font-['Orbitron'] text-3xl sm:text-4xl font-black tracking-tight ${
              isPlayerWinner
                ? 'text-[#00f0ff] drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]'
                : 'text-[#ff0055] drop-shadow-[0_0_20px_rgba(255,0,85,0.8)]'
            }`}
          >
            {winnerTitle}
          </h2>

          <p className="text-white/50 text-xs font-mono tracking-widest mt-1 uppercase">
            MODE: {difficulty} {difficulty === 'UNBEATABLE' && '• CHALLENGE'}
          </p>
        </div>

        {/* Permanent Final Score Board */}
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 mb-4 flex items-center justify-around font-['Orbitron']">
          <div className="flex flex-col items-center">
            <span className="text-xs text-cyan-400 font-bold tracking-wider mb-1 truncate max-w-[120px]">
              {userDisplayName}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">
              {stats.playerScore}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-white/40 font-mono tracking-widest uppercase">FINAL</span>
            <span className="text-2xl text-white/30 font-bold my-1">—</span>
            <span className="text-[10px] text-white/40 font-mono">FIRST TO 7</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-rose-400 font-bold tracking-wider mb-1">SYNTROX AI</span>
            <span className="text-4xl sm:text-5xl font-black text-[#ff0055] drop-shadow-[0_0_15px_rgba(255,0,85,0.6)]">
              {stats.aiScore}
            </span>
          </div>
        </div>

        {/* Performance Points and Rank */}
        {submittedEntry && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-cyan-950/30 via-purple-950/30 to-black border border-cyan-500/20 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-white/50 font-mono tracking-wider uppercase block">
                PERFORMANCE SCORE
              </span>
              <span className="font-['Orbitron'] text-xl font-black text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]">
                {submittedEntry.entry.score.toLocaleString()} PTS
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-white/50 font-mono tracking-wider uppercase block">
                GLOBAL RANK
              </span>
              <span className="font-['Orbitron'] text-lg font-bold text-cyan-300">
                #{submittedEntry.rank}
              </span>
            </div>
          </div>
        )}

        {/* Match Statistics Grid */}
        <div className="grid grid-cols-2 gap-2 text-left mb-4 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center space-x-2">
            <Timer size={15} className="text-cyan-400 shrink-0" />
            <div>
              <div className="text-white/40 text-[10px]">DURATION</div>
              <div className="text-white font-bold">{formatDuration(stats.matchDuration)}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center space-x-2">
            <Zap size={15} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-white/40 text-[10px]">MAX PUCK SPEED</div>
              <div className="text-white font-bold">{Math.round(stats.maxPuckSpeed * 3.6)} km/h</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center space-x-2">
            <Flame size={15} className="text-rose-400 shrink-0" />
            <div>
              <div className="text-white/40 text-[10px]">LONGEST RALLY</div>
              <div className="text-white font-bold">{stats.longestRally} HITS</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center space-x-2">
            <Award size={15} className="text-purple-400 shrink-0" />
            <div>
              <div className="text-white/40 text-[10px]">PLAYER SHOTS</div>
              <div className="text-white font-bold">{stats.playerShots}</div>
            </div>
          </div>
        </div>

        {/* Unbeatable Challenge Survivor or Special Achievement notice */}
        {achievements.length > 0 && (
          <div className="mb-4 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center space-x-2 text-left">
            <Award size={16} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block">{achievements[0]}</span>
              {achievements.length > 1 && (
                <span className="text-[10px] text-amber-200/70">
                  +{achievements.length - 1} more feats unlocked
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2.5">
          <button
            id="btn-play-again"
            onClick={() => {
              soundManager.playButton();
              onPlayAgain();
            }}
            className="w-full py-3.5 px-5 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider text-black bg-gradient-to-r from-[#00f0ff] to-[#00c8e0] shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:shadow-[0_0_25px_rgba(0,240,255,0.8)] active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RotateCcw size={16} className="text-black" />
            <span>PLAY AGAIN</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-change-difficulty"
              onClick={() => {
                soundManager.playButton();
                onChangeDifficulty();
              }}
              className="py-2.5 px-3 rounded-xl font-['Rajdhani'] font-bold text-xs tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sliders size={14} className="text-cyan-400" />
              <span>CHANGE MODE</span>
            </button>

            <button
              id="btn-gameover-leaderboard"
              onClick={() => {
                soundManager.playButton();
                onViewLeaderboard();
              }}
              className="py-2.5 px-3 rounded-xl font-['Rajdhani'] font-bold text-xs tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Trophy size={14} className="text-amber-400" />
              <span>LEADERBOARD</span>
            </button>
          </div>

          <button
            id="btn-gameover-mainmenu"
            onClick={() => {
              soundManager.playButton();
              onMainMenu();
            }}
            className="w-full py-2 px-4 rounded-xl font-['Rajdhani'] font-semibold text-xs tracking-wider text-white/60 hover:text-white bg-transparent hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Home size={14} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
