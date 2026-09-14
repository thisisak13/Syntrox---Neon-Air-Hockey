// Instructions & Controls Modal for SYNTROX Neon Air Hockey
import React from 'react';
import { soundManager } from '../audio/soundManager';
import { HelpCircle, X, Smartphone, Monitor, ShieldAlert, Zap, Target, Timer, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div
      id="modal-howtoplay"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0a0f1e]/95 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-xl sm:text-2xl font-bold text-white tracking-wide">
                HOW TO PLAY
              </h2>
              <p className="text-xs text-white/50 font-mono tracking-wider uppercase">
                TACTICAL COMBAT & CONTROLS GUIDE
              </p>
            </div>
          </div>

          <button
            id="btn-close-howtoplay"
            onClick={() => {
              soundManager.playButton();
              onClose();
            }}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-3 text-sm">
          {/* Rule 1: Goals & 60-Second Match Timer */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
            <div className="flex items-center space-x-2 font-['Orbitron'] font-bold text-cyan-300 text-sm mb-1">
              <Timer size={16} className="text-cyan-400" />
              <span>60-SECOND MATCH TIMER & GOALS</span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              In <strong className="text-cyan-300">all levels</strong> (Easy, Medium, Hard, and Unbeatable), you have a 
              <strong className="text-white"> 60-second countdown timer</strong> to score as many goals as possible.
              The match ends immediately when a combatant reaches <strong className="text-white">7 goals</strong>, or when the 60s timer expires (highest score wins)!
            </p>
          </div>

          {/* Tactical Power-Ups */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
            <div className="flex items-center space-x-2 font-['Orbitron'] font-bold text-purple-300 text-sm mb-2">
              <Sparkles size={16} className="text-purple-400" />
              <span>TACTICAL POWER-UPS (SPAWNED ON TABLE)</span>
            </div>
            <p className="text-white/70 text-xs mb-2">
              Hit the floating glowing orbs with your puck or mallet to collect game-changing tactical boosts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/30">
                <span className="font-bold text-emerald-400">🛡️ GOAL SHIELD</span>
                <p className="text-white/60 text-[11px] mt-0.5">Deploys an electric laser barrier across your goal to block shots.</p>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-amber-500/30">
                <span className="font-bold text-amber-400">🔥 HYPER SHOT</span>
                <p className="text-white/60 text-[11px] mt-0.5">Kinetic plasma boost accelerating strikes up to supersonic speed.</p>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/30">
                <span className="font-bold text-cyan-400">⚡ MEGA MALLET</span>
                <p className="text-white/60 text-[11px] mt-0.5">Expands your mallet radius by 40% for unbreakable defense.</p>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-purple-500/30">
                <span className="font-bold text-purple-400">❄️ EMP FREEZE</span>
                <p className="text-white/60 text-[11px] mt-0.5">Electromagnetic pulse slowing AI movement speed by 65%.</p>
              </div>
            </div>
          </div>

          {/* Controls: Mobile & Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2 font-['Orbitron'] font-bold text-white text-xs mb-2">
                <Smartphone size={16} className="text-cyan-400" />
                <span>MOBILE TOUCH</span>
              </div>
              <ul className="text-xs text-white/70 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">One-Finger Drag:</strong> Mallet follows your touch instantly with 1:1 precision.</li>
                <li>Stay inside your half.</li>
                <li>Swipe quickly forward into the puck to execute powerful strikes.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2 font-['Orbitron'] font-bold text-white text-xs mb-2">
                <Monitor size={16} className="text-amber-400" />
                <span>DESKTOP CONTROLS</span>
              </div>
              <ul className="text-xs text-white/70 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Mouse Movement:</strong> Cursor controls mallet position.</li>
                <li><strong className="text-white">WASD / Arrow Keys:</strong> Smooth directional movement.</li>
                <li><strong className="text-white">Space / P:</strong> Pause / Resume match.</li>
              </ul>
            </div>
          </div>

          {/* Anti-Stuck & Physics */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-center space-x-2 font-['Orbitron'] font-bold text-emerald-300 text-sm mb-1">
              <ShieldAlert size={16} className="text-emerald-400" />
              <span>ANTI-STUCK RECOVERY SYSTEM</span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              If the puck is trapped or stalled for over 1.5 seconds, the SYNTROX magnetic stabilizer
              automatically re-centers the puck with momentum toward active play.
            </p>
          </div>

          {/* AI Modes & Unbeatable */}
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <div className="flex items-center space-x-2 font-['Orbitron'] font-bold text-rose-300 text-sm mb-1">
              <Zap size={16} className="text-rose-400" />
              <span>UNBEATABLE CHALLENGE</span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              In Unbeatable mode, survive as long as possible! The AI calculates multi-wall reflections with surgical precision and first to 7 goals wins.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-howtoplay-gotit"
          onClick={() => {
            soundManager.playButton();
            onClose();
          }}
          className="w-full py-3 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all cursor-pointer mt-2"
        >
          READY FOR COMBAT
        </button>
      </div>
    </div>
  );
};
