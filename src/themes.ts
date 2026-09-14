// Color Themes for SYNTROX Neon Air Hockey
import { ColorThemeId } from './types';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  tagline: string;
  previewColors: [string, string, string]; // [Player Mallet, AI Mallet, Center Accent]

  // Canvas Table Colors
  tableBg: string;
  tableSurfaceAi: string;
  tableSurfacePlayer: string;

  // Player Mallet & Half
  playerPrimary: string;
  playerSecondary: string;
  playerGlow: string;
  playerRailStroke: string;
  playerRailGlow: string;

  // AI Mallet & Half
  aiPrimary: string;
  aiSecondary: string;
  aiGlow: string;
  aiRailStroke: string;
  aiRailGlow: string;

  // Center Line & Creases
  centerLine: string;
  centerGlow: string;
  centerRingBg: string;
  centerRingStroke: string;

  // Puck
  puckCore: string;
  puckRing: string;
  puckGlow: string;

  // HUD Scoreboard
  uiPlayerScore: string;
  uiAiScore: string;
}

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  CYBER_NEON: {
    id: 'CYBER_NEON',
    name: 'CYBER NEON',
    tagline: 'Electric Cyan vs Neon Rose',
    previewColors: ['#00f0ff', '#ff0055', '#00e5ff'],

    tableBg: '#060814',
    tableSurfaceAi: 'rgba(255, 0, 85, 0.04)',
    tableSurfacePlayer: 'rgba(0, 240, 255, 0.04)',

    playerPrimary: '#00f0ff',
    playerSecondary: '#33f5ff',
    playerGlow: 'rgba(0, 240, 255, 0.85)',
    playerRailStroke: 'rgba(0, 240, 255, 0.85)',
    playerRailGlow: 'rgba(0, 240, 255, 0.6)',

    aiPrimary: '#ff0055',
    aiSecondary: '#ff3377',
    aiGlow: 'rgba(255, 0, 85, 0.85)',
    aiRailStroke: 'rgba(255, 0, 85, 0.85)',
    aiRailGlow: 'rgba(255, 0, 85, 0.6)',

    centerLine: 'rgba(0, 240, 255, 0.45)',
    centerGlow: 'rgba(0, 240, 255, 0.5)',
    centerRingBg: 'rgba(0, 240, 255, 0.08)',
    centerRingStroke: 'rgba(0, 240, 255, 0.75)',

    puckCore: '#ffffff',
    puckRing: '#00f0ff',
    puckGlow: '#00f0ff',

    uiPlayerScore: '#00f0ff',
    uiAiScore: '#ff0055',
  },

  SYNTHWAVE: {
    id: 'SYNTHWAVE',
    name: 'SYNTHWAVE',
    tagline: 'Sunset Orange vs Neon Magenta',
    previewColors: ['#ff8800', '#e00096', '#ffb703'],

    tableBg: '#120520',
    tableSurfaceAi: 'rgba(224, 0, 150, 0.05)',
    tableSurfacePlayer: 'rgba(255, 136, 0, 0.05)',

    playerPrimary: '#ff8800',
    playerSecondary: '#ffaa33',
    playerGlow: 'rgba(255, 136, 0, 0.85)',
    playerRailStroke: 'rgba(255, 136, 0, 0.85)',
    playerRailGlow: 'rgba(255, 136, 0, 0.6)',

    aiPrimary: '#e00096',
    aiSecondary: '#ff33bb',
    aiGlow: 'rgba(224, 0, 150, 0.85)',
    aiRailStroke: 'rgba(224, 0, 150, 0.85)',
    aiRailGlow: 'rgba(224, 0, 150, 0.6)',

    centerLine: 'rgba(255, 183, 3, 0.45)',
    centerGlow: 'rgba(255, 183, 3, 0.5)',
    centerRingBg: 'rgba(255, 183, 3, 0.08)',
    centerRingStroke: 'rgba(255, 183, 3, 0.75)',

    puckCore: '#ffffff',
    puckRing: '#ffb703',
    puckGlow: '#ffaa00',

    uiPlayerScore: '#ff8800',
    uiAiScore: '#e00096',
  },

  MATRIX: {
    id: 'MATRIX',
    name: 'TOXIC MATRIX',
    tagline: 'Acid Green vs Cyber Amber',
    previewColors: ['#00ff66', '#f59e0b', '#39ff14'],

    tableBg: '#02150a',
    tableSurfaceAi: 'rgba(245, 158, 11, 0.05)',
    tableSurfacePlayer: 'rgba(0, 255, 102, 0.05)',

    playerPrimary: '#00ff66',
    playerSecondary: '#39ff14',
    playerGlow: 'rgba(0, 255, 102, 0.85)',
    playerRailStroke: 'rgba(0, 255, 102, 0.85)',
    playerRailGlow: 'rgba(0, 255, 102, 0.6)',

    aiPrimary: '#f59e0b',
    aiSecondary: '#fbbf24',
    aiGlow: 'rgba(245, 158, 11, 0.85)',
    aiRailStroke: 'rgba(245, 158, 11, 0.85)',
    aiRailGlow: 'rgba(245, 158, 11, 0.6)',

    centerLine: 'rgba(57, 255, 20, 0.45)',
    centerGlow: 'rgba(57, 255, 20, 0.5)',
    centerRingBg: 'rgba(57, 255, 20, 0.08)',
    centerRingStroke: 'rgba(57, 255, 20, 0.75)',

    puckCore: '#ffffff',
    puckRing: '#39ff14',
    puckGlow: '#00ff66',

    uiPlayerScore: '#00ff66',
    uiAiScore: '#f59e0b',
  },

  SOLAR_FLARE: {
    id: 'SOLAR_FLARE',
    name: 'SOLAR FLARE',
    tagline: 'Radiant Gold vs Volcanic Crimson',
    previewColors: ['#ffd100', '#ff1e27', '#ffaa00'],

    tableBg: '#180606',
    tableSurfaceAi: 'rgba(255, 30, 39, 0.05)',
    tableSurfacePlayer: 'rgba(255, 209, 0, 0.05)',

    playerPrimary: '#ffd100',
    playerSecondary: '#ffe066',
    playerGlow: 'rgba(255, 209, 0, 0.85)',
    playerRailStroke: 'rgba(255, 209, 0, 0.85)',
    playerRailGlow: 'rgba(255, 209, 0, 0.6)',

    aiPrimary: '#ff1e27',
    aiSecondary: '#ff5c62',
    aiGlow: 'rgba(255, 30, 39, 0.85)',
    aiRailStroke: 'rgba(255, 30, 39, 0.85)',
    aiRailGlow: 'rgba(255, 30, 39, 0.6)',

    centerLine: 'rgba(255, 170, 0, 0.45)',
    centerGlow: 'rgba(255, 170, 0, 0.5)',
    centerRingBg: 'rgba(255, 170, 0, 0.08)',
    centerRingStroke: 'rgba(255, 170, 0, 0.75)',

    puckCore: '#ffffff',
    puckRing: '#ffd100',
    puckGlow: '#ffaa00',

    uiPlayerScore: '#ffd100',
    uiAiScore: '#ff1e27',
  },

  ULTRAVIOLET: {
    id: 'ULTRAVIOLET',
    name: 'ULTRAVIOLET',
    tagline: 'Deep Violet vs Electric Frost',
    previewColors: ['#b55fe6', '#00e5ff', '#c084fc'],

    tableBg: '#0e0620',
    tableSurfaceAi: 'rgba(0, 229, 255, 0.05)',
    tableSurfacePlayer: 'rgba(181, 95, 230, 0.05)',

    playerPrimary: '#b55fe6',
    playerSecondary: '#d896ff',
    playerGlow: 'rgba(181, 95, 230, 0.85)',
    playerRailStroke: 'rgba(181, 95, 230, 0.85)',
    playerRailGlow: 'rgba(181, 95, 230, 0.6)',

    aiPrimary: '#00e5ff',
    aiSecondary: '#5ce1e6',
    aiGlow: 'rgba(0, 229, 255, 0.85)',
    aiRailStroke: 'rgba(0, 229, 255, 0.85)',
    aiRailGlow: 'rgba(0, 229, 255, 0.6)',

    centerLine: 'rgba(192, 132, 252, 0.45)',
    centerGlow: 'rgba(192, 132, 252, 0.5)',
    centerRingBg: 'rgba(192, 132, 252, 0.08)',
    centerRingStroke: 'rgba(192, 132, 252, 0.75)',

    puckCore: '#ffffff',
    puckRing: '#c084fc',
    puckGlow: '#b55fe6',

    uiPlayerScore: '#b55fe6',
    uiAiScore: '#00e5ff',
  },
};

export const getTheme = (id?: ColorThemeId): ColorTheme => {
  if (!id || !COLOR_THEMES[id]) {
    return COLOR_THEMES.CYBER_NEON;
  }
  return COLOR_THEMES[id];
};
