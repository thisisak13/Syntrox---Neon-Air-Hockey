// Pause Overlay Modal for SYNTROX Neon Air Hockey
import React from 'react';
import { soundManager } from '../audio/soundManager';
import { Play, RotateCcw, Home, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenSettings?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onMainMenu, onOpenSettings }) => {
  return (
    <div
      id="modal-pause"
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
    >
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-[#0c1220]/95 p-6 shadow-[0_0_40px_rgba(0,240,255,0.2)] text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-3">
          SYSTEM SUSPENDED
        </div>

        <h2 className="font-['Orbitron'] text-3xl font-black text-white tracking-wider mb-6 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
          GAME PAUSED
        </h2>

        <div className="flex flex-col space-y-3">
          <button
            id="btn-pause-resume"
            onClick={() => {
              soundManager.playButton();
              onResume();
            }}
            className="w-full py-3.5 px-5 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider text-black bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_25px_rgba(0,240,255,0.8)] active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play size={18} className="fill-black" />
            <span>RESUME MATCH</span>
          </button>

          <button
            id="btn-pause-restart"
            onClick={() => {
              soundManager.playButton();
              onRestart();
            }}
            className="w-full py-3 px-5 rounded-xl font-['Rajdhani'] font-bold text-sm tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-amber-400/50 hover:text-amber-300 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RotateCcw size={16} className="text-amber-400" />
            <span>RESTART MATCH</span>
          </button>

          {onOpenSettings && (
            <button
              id="btn-pause-settings"
              onClick={() => {
                soundManager.playButton();
                onOpenSettings();
              }}
              className="w-full py-3 px-5 rounded-xl font-['Rajdhani'] font-bold text-sm tracking-wider text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400/50 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Settings size={16} className="text-cyan-400" />
              <span>SETTINGS & THEMES</span>
            </button>
          )}

          <button
            id="btn-pause-mainmenu"
            onClick={() => {
              soundManager.playButton();
              onMainMenu();
            }}
            className="w-full py-3 px-5 rounded-xl font-['Rajdhani'] font-bold text-sm tracking-wider text-white/70 hover:text-white bg-transparent hover:bg-white/5 border border-white/10 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home size={16} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
