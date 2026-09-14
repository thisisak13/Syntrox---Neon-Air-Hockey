/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, DifficultyMode, MatchStats, GameSettings, ColorThemeId } from './types';
import { NeonTableCanvas } from './components/NeonTableCanvas';
import { HomeScreen } from './components/HomeScreen';
import { CountdownOverlay } from './components/CountdownOverlay';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardService } from './services/leaderboardService';
import { soundManager } from './audio/soundManager';

const getInitialTheme = (): ColorThemeId => {
  try {
    const saved = localStorage.getItem('syntrox_color_theme');
    if (
      saved &&
      (saved === 'CYBER_NEON' ||
        saved === 'SYNTHWAVE' ||
        saved === 'MATRIX' ||
        saved === 'SOLAR_FLARE' ||
        saved === 'ULTRAVIOLET')
    ) {
      return saved as ColorThemeId;
    }
  } catch {
    // fallback
  }
  return 'CYBER_NEON';
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('MEDIUM');

  // Modals visibility
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    soundVolume: 0.7,
    screenShake: true,
    particleQuality: 'HIGH',
    playerName: LeaderboardService.getPlayerName(),
    colorTheme: getInitialTheme(),
  });

  // Match End Results
  const [matchResult, setMatchResult] = useState<{
    winner: 'PLAYER' | 'AI';
    stats: MatchStats;
  } | null>(null);

  // Match instance key (increments to guarantee a fresh game board and timer)
  const [matchKey, setMatchKey] = useState<number>(1);

  // Initialize audio settings
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
    soundManager.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Start new match
  const handleStartMatch = (selectedMode: DifficultyMode) => {
    setDifficulty(selectedMode);
    setMatchResult(null);
    setMatchKey((prev) => prev + 1);
    setGameState('COUNTDOWN');
  };

  // Countdown finished -> Start playing
  const handleCountdownComplete = () => {
    setGameState('PLAYING');
  };

  // Goal scored
  const handleGoalScored = (
    _scorer: 'PLAYER' | 'AI',
    _newPlayerScore: number,
    _newAiScore: number
  ) => {
    // Keep state as PLAYING; table canvas handles brief goal banner delay
  };

  // Match ended (First to 7 reached)
  const handleMatchEnded = (winner: 'PLAYER' | 'AI', finalStats: MatchStats) => {
    // CRITICAL GAME END RULE:
    // Completely freeze gameplay and disable physics updates
    setGameState('MATCH_OVER');
    setMatchResult({
      winner,
      stats: finalStats,
    });
  };

  // Pause toggle
  const handlePauseToggle = () => {
    if (gameState === 'PLAYING') {
      soundManager.playButton();
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      soundManager.playButton();
      setGameState('PLAYING');
    }
  };

  // Quick sound toggle
  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    setSettings((prev) => ({ ...prev, soundEnabled: nextVal }));
    soundManager.setEnabled(nextVal);
    if (nextVal) soundManager.playButton();
  };

  // Restart match
  const handleRestartMatch = () => {
    soundManager.playButton();
    setMatchResult(null);
    setMatchKey((prev) => prev + 1);
    setGameState('COUNTDOWN');
  };

  // Return to Main Menu
  const handleMainMenu = () => {
    soundManager.playButton();
    setMatchResult(null);
    setGameState('MENU');
  };

  return (
    <div
      id="syntrox-app-root"
      className="fixed inset-0 w-full h-full bg-[#060814] text-white flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* 1. Main Menu / Landing View */}
      {gameState === 'MENU' && (
        <HomeScreen
          playerName={settings.playerName}
          onUpdatePlayerName={(name) => {
            setSettings((prev) => ({ ...prev, playerName: name }));
            LeaderboardService.setPlayerName(name);
          }}
          onStartMatch={handleStartMatch}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* 2. Active Air Hockey Table Canvas (Rendered during COUNTDOWN, PLAYING, GOAL, PAUSED, MATCH_OVER) */}
      {gameState !== 'MENU' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <NeonTableCanvas
            key={`table-${difficulty}-${matchKey}`}
            gameState={gameState}
            difficulty={difficulty}
            settings={settings}
            onGoalScored={handleGoalScored}
            onMatchEnded={handleMatchEnded}
            onPauseToggle={handlePauseToggle}
            onRestartRequest={handleRestartMatch}
            onToggleSound={handleToggleSound}
          />

          {/* Countdown Overlay */}
          {gameState === 'COUNTDOWN' && (
            <CountdownOverlay key={`countdown-${matchKey}`} onComplete={handleCountdownComplete} />
          )}

          {/* Pause Modal */}
          {gameState === 'PAUSED' && (
            <PauseModal
              onResume={() => setGameState('PLAYING')}
              onRestart={handleRestartMatch}
              onMainMenu={handleMainMenu}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}

          {/* Match Over Modal with Permanent 7-X Score & Stats */}
          {gameState === 'MATCH_OVER' && matchResult && (
            <GameOverModal
              winner={matchResult.winner}
              difficulty={difficulty}
              stats={matchResult.stats}
              playerName={settings.playerName}
              onPlayAgain={handleRestartMatch}
              onChangeDifficulty={() => setGameState('MENU')}
              onMainMenu={handleMainMenu}
              onViewLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
        </div>
      )}

      {/* 3. Global Modal Dialogs */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            try {
              localStorage.setItem('syntrox_color_theme', newSettings.colorTheme);
            } catch {
              // ignore
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
