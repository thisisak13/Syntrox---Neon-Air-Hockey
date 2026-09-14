// Futuristic Landing Screen & Mode Select for SYNTROX Neon Air Hockey
import React, { useState } from 'react';
import { DifficultyMode } from '../types';
import { soundManager } from '../audio/soundManager';
import { Play, Trophy, HelpCircle, Settings, ArrowLeft, Zap, Shield, Flame, Skull, User, Check } from 'lucide-react';

interface HomeScreenProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onStartMatch: (mode: DifficultyMode) => void;
  onOpenLeaderboard: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  playerName,
  onUpdatePlayerName,
  onStartMatch,
  onOpenLeaderboard,
  onOpenHowToPlay,
  onOpenSettings,
}) => {
  const [view, setView] = useState<'HOME' | 'MODE_SELECT'>('HOME');
  const [localName, setLocalName] = useState<string>(playerName);
  const [savedBadge, setSavedBadge] = useState<boolean>(false);

  const handleNameChange = (val: string) => {
    setLocalName(val);
    onUpdatePlayerName(val);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1200);
  };

  const handlePlayNowClick = () => {
    soundManager.playButton();
    // Fallback if blank
    if (!localName.trim()) {
      handleNameChange('PILOT 1');
    }
    setView('MODE_SELECT');
  };

  const handleSelectMode = (mode: DifficultyMode) => {
    soundManager.playButton();
    onStartMatch(mode);
  };

  const handleBack = () => {
    soundManager.playButton();
    setView('HOME');
  };

  return (
    <div
      id="syntrox-home-screen"
      className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto overflow-x-hidden bg-[#060814] text-white select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <header className="relative z-10 text-center mt-2 sm:mt-6 flex flex-col items-center">
        {/* SYNTROX Official Logo Image */}
        <div id="syntrox-home-logo" className="relative inline-flex items-center justify-center mb-2 sm:mb-3">
          <img
            src="/syntrox-logo.png"
            alt="SYNTROX Logo"
            referrerPolicy="no-referrer"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain select-none filter drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]"
          />
        </div>

        <h1 className="font-['Orbitron'] text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,240,255,0.5)]">
          SYNTROX
        </h1>

        <div className="font-['Orbitron'] text-lg sm:text-2xl font-bold tracking-[0.3em] text-[#00f0ff] mt-1 sm:mt-2 drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]">
          NEON AIR HOCKEY
        </div>

        <p className="font-mono text-xs sm:text-sm tracking-[0.25em] text-white/50 mt-2 sm:mt-3 uppercase">
          PLAY • AIM • STRIKE
        </p>
      </header>

      {/* Central Interactive Content */}
      <main className="relative z-10 w-full max-w-md my-auto py-4">
        {view === 'HOME' ? (
          <div className="flex flex-col space-y-3.5 sm:space-y-4">
            {/* Custom Real Player Username Input */}
            <div
              id="player-callsign-card"
              className="p-3.5 rounded-xl bg-white/5 border border-cyan-500/30 backdrop-blur-sm text-left shadow-[0_0_15px_rgba(0,240,255,0.1)]"
            >
              <div className="flex items-center justify-between text-xs font-mono text-cyan-300/80 mb-2 uppercase tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <User size={14} className="text-cyan-400" />
                  <span className="font-bold">PILOT CALLSIGN / USERNAME</span>
                </span>
                {savedBadge ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                    <Check size={11} />
                    <span>SAVED</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40">FOR LEADERBOARD</span>
                )}
              </div>

              <input
                id="input-pilot-username"
                type="text"
                value={localName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="ENTER YOUR NAME..."
                maxLength={16}
                className="w-full px-3.5 py-2.5 rounded-lg bg-black/70 border border-cyan-500/40 text-cyan-100 font-['Orbitron'] font-bold text-sm tracking-wider focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.35)] placeholder:text-white/25 transition-all"
              />
              <p className="text-[10px] font-mono text-white/40 mt-1.5">
                Leaderboard scores record under this name with no preset defaults.
              </p>
            </div>

            <button
              id="btn-play-now"
              onClick={handlePlayNowClick}
              className="group relative w-full py-4 px-6 rounded-xl font-['Orbitron'] font-bold text-lg tracking-wider text-black bg-gradient-to-r from-[#00f0ff] via-[#5dfaff] to-[#00d0f0] shadow-[0_0_25px_rgba(0,240,255,0.6)] hover:shadow-[0_0_35px_rgba(0,240,255,0.9)] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 cursor-pointer"
            >
              <Play size={20} className="fill-black" />
              <span>PLAY NOW</span>
            </button>

            <button
              id="btn-home-leaderboard"
              onClick={() => {
                soundManager.playButton();
                onOpenLeaderboard();
              }}
              className="w-full py-3.5 px-6 rounded-xl font-['Rajdhani'] font-bold text-base tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 hover:text-amber-300 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 cursor-pointer backdrop-blur-sm"
            >
              <Trophy size={18} className="text-amber-400" />
              <span>LIVE LEADERBOARD</span>
            </button>

            <button
              id="btn-home-howtoplay"
              onClick={() => {
                soundManager.playButton();
                onOpenHowToPlay();
              }}
              className="w-full py-3.5 px-6 rounded-xl font-['Rajdhani'] font-bold text-base tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 hover:text-cyan-300 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 cursor-pointer backdrop-blur-sm"
            >
              <HelpCircle size={18} className="text-cyan-400" />
              <span>HOW TO PLAY</span>
            </button>

            <button
              id="btn-home-settings"
              onClick={() => {
                soundManager.playButton();
                onOpenSettings();
              }}
              className="w-full py-3.5 px-6 rounded-xl font-['Rajdhani'] font-bold text-base tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 hover:text-purple-300 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 cursor-pointer backdrop-blur-sm"
            >
              <Settings size={18} className="text-purple-400" />
              <span>SETTINGS</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between mb-1">
              <button
                id="btn-back-to-home"
                onClick={handleBack}
                className="flex items-center space-x-1.5 text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>BACK</span>
              </button>
              <span className="font-['Orbitron'] text-xs text-cyan-400 font-bold tracking-widest uppercase">
                SELECT DIFFICULTY
              </span>
            </div>

            {/* Mode Card: EASY */}
            <div
              id="card-mode-easy"
              onClick={() => handleSelectMode('EASY')}
              className="group p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-['Orbitron'] font-bold text-base text-emerald-300 group-hover:text-emerald-200">
                    RECRUIT (EASY)
                  </h3>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    Forgiving AI speed, human-like reaction delay, great for warm-up.
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Card: MEDIUM */}
            <div
              id="card-mode-medium"
              onClick={() => handleSelectMode('MEDIUM')}
              className="group p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-['Orbitron'] font-bold text-base text-cyan-300 group-hover:text-cyan-200">
                    OPERATOR (MEDIUM)
                  </h3>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    Standard arcade match. Balanced bank shots and counter-attacks.
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Card: HARD */}
            <div
              id="card-mode-hard"
              onClick={() => handleSelectMode('HARD')}
              className="group p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Flame size={20} />
                </div>
                <div>
                  <h3 className="font-['Orbitron'] font-bold text-base text-amber-300 group-hover:text-amber-200">
                    VETERAN (HARD)
                  </h3>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    Fast reflex AI, 2-bounce trajectory prediction, aggressive cuts.
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Card: UNBEATABLE */}
            <div
              id="card-mode-unbeatable"
              onClick={() => handleSelectMode('UNBEATABLE')}
              className="group p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-950/50 hover:border-rose-400 hover:shadow-[0_0_25px_rgba(255,0,85,0.4)] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <Skull size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-['Orbitron'] font-black text-base text-rose-300 group-hover:text-rose-200">
                      SYNTROX CORE (UNBEATABLE)
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50">
                      ELITE
                    </span>
                  </div>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    Flawless 4-bounce geometry, zero reaction delay. Reach 7 goals to win!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer System Status */}
      <footer className="relative z-10 flex items-center justify-between w-full max-w-md text-white/40 text-[11px] font-mono tracking-wider pt-2 border-t border-white/5">
        <span className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUDIO ENGINE: ACTIVE</span>
        </span>
        <span>FIRST TO 7 WINS</span>
      </footer>
    </div>
  );
};
