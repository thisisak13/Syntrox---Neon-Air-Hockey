export type TableOrientation = 'horizontal' | 'vertical';

export type GameState = 
  | 'MENU'
  | 'MODE_SELECT'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'GOAL'
  | 'MATCH_OVER'
  | 'PAUSED';

export type DifficultyMode = 'EASY' | 'MEDIUM' | 'HARD' | 'UNBEATABLE';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PuckState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxSpeed: number;
  trail: { x: number; y: number; alpha: number }[];
}

export interface MalletState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetX: number;
  targetY: number;
  speed: number;
}

export interface TableDimensions {
  width: number;
  height: number;
  goalWidth: number;
  goalDepth: number;
  cornerCut: number;
}

export interface MatchStats {
  playerScore: number;
  aiScore: number;
  matchDuration: number; // in seconds
  playerShots: number;
  aiShots: number;
  playerSaves: number;
  aiSaves: number;
  maxPuckSpeed: number;
  longestRally: number;
  currentRally: number;
  performanceScore: number;
  unbeatableSurvivalTime: number;
  achievements: string[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  difficulty: DifficultyMode;
  date: string;
  result: 'VICTORY' | 'DEFEAT';
  playerGoals: number;
  aiGoals: number;
  duration: number;
}

export type ColorThemeId = 'CYBER_NEON' | 'SYNTHWAVE' | 'MATRIX' | 'SOLAR_FLARE' | 'ULTRAVIOLET';

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number;
  screenShake: boolean;
  particleQuality: 'HIGH' | 'LOW';
  playerName: string;
  colorTheme: ColorThemeId;
}

export type PowerUpType = 'MEGA_MALLET' | 'HYPER_SHOT' | 'GOAL_SHIELD' | 'EMP_FREEZE';

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  duration: number; // duration in seconds once collected
  color: string;
  label: string;
  spawnTime: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  label: string;
  color: string;
  timeLeft: number;
  duration: number;
}
