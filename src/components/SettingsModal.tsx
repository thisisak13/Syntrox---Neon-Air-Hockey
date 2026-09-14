// Settings Modal for SYNTROX Neon Air Hockey
import React, { useState } from 'react';
import { GameSettings, ColorThemeId } from '../types';
import { COLOR_THEMES } from '../themes';
import { soundManager } from '../audio/soundManager';
import { LeaderboardService } from '../services/leaderboardService';
import { Settings, X, Volume2, VolumeX, Sparkles, Vibrate, User, Check, Palette } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    soundManager.playButton();
    LeaderboardService.setPlayerName(localSettings.playerName);
    soundManager.setEnabled(localSettings.soundEnabled);
    soundManager.setVolume(localSettings.soundVolume);
    onUpdateSettings(localSettings);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div
      id="modal-settings"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0f1e]/95 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-xl sm:text-2xl font-bold text-white tracking-wide">
                SETTINGS
              </h2>
              <p className="text-xs text-white/50 font-mono tracking-wider uppercase">
                SYSTEM, AUDIO & COLOR THEMES
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings"
            onClick={() => {
              soundManager.playButton();
              onClose();
            }}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Form (Scrollable) */}
        <div className="space-y-4 my-3 overflow-y-auto pr-1 flex-1">
          {/* Player Name */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1.5">
              <User size={14} />
              <span>PLAYER CALLSIGN</span>
            </label>
            <input
              id="input-player-name"
              type="text"
              maxLength={15}
              value={localSettings.playerName}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  playerName: e.target.value.toUpperCase(),
                })
              }
              placeholder="NEO_PILOT"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-['Orbitron'] font-bold text-sm focus:outline-none focus:border-cyan-400 tracking-wider"
            />
            <span className="text-[10px] text-white/40 font-mono block mt-1">
              Displayed on live leaderboards and match results.
            </span>
          </div>

          {/* Color Themes */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Palette size={16} className="text-cyan-400" />
                <span className="font-['Rajdhani'] font-bold text-sm text-white tracking-wide">
                  NEON COLOR THEME
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {COLOR_THEMES[localSettings.colorTheme || 'CYBER_NEON']?.name || 'CYBER NEON'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map((themeId) => {
                const theme = COLOR_THEMES[themeId];
                const isSelected = (localSettings.colorTheme || 'CYBER_NEON') === themeId;
                return (
                  <button
                    key={themeId}
                    id={`btn-theme-${themeId.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      soundManager.playButton();
                      setLocalSettings({ ...localSettings, colorTheme: themeId });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/12 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400'
                        : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-['Orbitron'] font-bold text-xs text-white truncate flex items-center space-x-1.5">
                        <span>{theme.name}</span>
                        {isSelected && <Check size={12} className="text-cyan-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-white/50 font-mono truncate">
                        {theme.tagline}
                      </div>
                    </div>

                    {/* Color Preview Swatches */}
                    <div className="flex items-center -space-x-1 shrink-0">
                      {theme.previewColors.map((col, idx) => (
                        <div
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-black/80 shadow-xs"
                          style={{ backgroundColor: col, boxShadow: `0 0 6px ${col}` }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound FX Toggle & Volume */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {localSettings.soundEnabled ? (
                  <Volume2 size={18} className="text-cyan-400" />
                ) : (
                  <VolumeX size={18} className="text-rose-400" />
                )}
                <div>
                  <div className="font-['Rajdhani'] font-bold text-sm text-white">SOUND EFFECTS</div>
                  <div className="text-[11px] text-white/50">Procedural arcade synthesizer</div>
                </div>
              </div>

              <button
                id="btn-toggle-sound"
                type="button"
                onClick={() => {
                  const nextVal = !localSettings.soundEnabled;
                  setLocalSettings({ ...localSettings, soundEnabled: nextVal });
                  soundManager.setEnabled(nextVal);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  localSettings.soundEnabled ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    localSettings.soundEnabled ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {localSettings.soundEnabled && (
              <div>
                <div className="flex justify-between text-xs font-mono text-white/60 mb-1">
                  <span>VOLUME</span>
                  <span>{Math.round(localSettings.soundVolume * 100)}%</span>
                </div>
                <input
                  id="slider-sound-volume"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={localSettings.soundVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setLocalSettings({ ...localSettings, soundVolume: vol });
                    soundManager.setVolume(vol);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Screen Shake Toggle */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Vibrate size={18} className="text-amber-400" />
              <div>
                <div className="font-['Rajdhani'] font-bold text-sm text-white">SCREEN SHAKE</div>
                <div className="text-[11px] text-white/50">Impact dynamic camera feedback</div>
              </div>
            </div>

            <button
              id="btn-toggle-screenshake"
              type="button"
              onClick={() =>
                setLocalSettings({
                  ...localSettings,
                  screenShake: !localSettings.screenShake,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                localSettings.screenShake ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  localSettings.screenShake ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Particle Quality */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles size={18} className="text-purple-400" />
              <div>
                <div className="font-['Rajdhani'] font-bold text-sm text-white">PARTICLE QUALITY</div>
                <div className="text-[11px] text-white/50">Impact sparks and goal shockwaves</div>
              </div>
            </div>

            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                id="btn-particle-high"
                onClick={() => setLocalSettings({ ...localSettings, particleQuality: 'HIGH' })}
                className={`px-2.5 py-1 text-xs font-mono font-bold cursor-pointer transition-colors ${
                  localSettings.particleQuality === 'HIGH'
                    ? 'bg-purple-500 text-black'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                HIGH
              </button>
              <button
                id="btn-particle-low"
                onClick={() => setLocalSettings({ ...localSettings, particleQuality: 'LOW' })}
                className={`px-2.5 py-1 text-xs font-mono font-bold cursor-pointer transition-colors ${
                  localSettings.particleQuality === 'LOW'
                    ? 'bg-purple-500 text-black'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                LOW
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-save-settings"
          onClick={handleSave}
          className="w-full py-3 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
        >
          {savedToast ? (
            <>
              <Check size={16} />
              <span>SAVED!</span>
            </>
          ) : (
            <span>APPLY & CLOSE</span>
          )}
        </button>
      </div>
    </div>
  );
};
