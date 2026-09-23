// Live Leaderboard & Performance Scoring Service for SYNTROX Neon Air Hockey
import { DifficultyMode, LeaderboardEntry, MatchStats } from '../types';

const STORAGE_KEY = 'syntrox_real_players_leaderboard_v2';
const PLAYER_NAME_KEY = 'syntrox_real_player_callsign';

export class LeaderboardService {
  public static getPlayerName(): string {
    if (typeof window === 'undefined') return 'PLAYER';
    const stored = localStorage.getItem(PLAYER_NAME_KEY);
    if (!stored || stored === 'NEO_PILOT' || stored.trim() === '') {
      return '';
    }
    return stored;
  }

  public static setPlayerName(name: string) {
    if (typeof window === 'undefined') return;
    const clean = name.trim().slice(0, 16);
    localStorage.setItem(PLAYER_NAME_KEY, clean);
  }

  public static getEntries(modeFilter: 'ALL' | DifficultyMode = 'ALL'): LeaderboardEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let entries: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(entries)) {
        entries = [];
      }

      if (modeFilter !== 'ALL') {
        entries = entries.filter((e) => e.difficulty === modeFilter);
      }

      // Sort descending by score
      return entries.sort((a, b) => b.score - a.score);
    } catch {
      return [];
    }
  }

  public static submitMatch(
    playerName: string,
    difficulty: DifficultyMode,
    stats: MatchStats
  ): { entry: LeaderboardEntry; rank: number } {
    const score = this.calculatePerformanceScore(difficulty, stats);
    const result = stats.playerScore > stats.aiScore ? 'VICTORY' : 'DEFEAT';
    const cleanName = playerName.trim() || this.getPlayerName() || 'PLAYER';

    const newEntry: LeaderboardEntry = {
      id: 'match-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      playerName: cleanName,
      score,
      difficulty,
      date: new Date().toISOString().split('T')[0],
      result,
      playerGoals: stats.playerScore,
      aiGoals: stats.aiScore,
      duration: Math.floor(stats.matchDuration),
    };

    let all = this.getEntries('ALL');
    all.push(newEntry);
    all.sort((a, b) => b.score - a.score);
    // Keep top 100 real player matches
    if (all.length > 100) all = all.slice(0, 100);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {}
    }

    const rank = all.findIndex((e) => e.id === newEntry.id) + 1;
    return { entry: newEntry, rank };
  }

  public static calculatePerformanceScore(difficulty: DifficultyMode, stats: MatchStats): number {
    const isWin = stats.playerScore > stats.aiScore;

    // Difficulty base multipliers
    const diffMultipliers: Record<DifficultyMode, number> = {
      EASY: 1.0,
      MEDIUM: 1.6,
      HARD: 2.5,
      UNBEATABLE: 4.2,
    };

    let base = 0;
    if (isWin) {
      base = 1000;
      // Goal difference bonus (up to 7 * 150 = 1050)
      base += (stats.playerScore - stats.aiScore) * 150;
      // Clean sheet / defense bonus
      if (stats.aiScore === 0) base += 500;
    } else {
      // Points for goals scored against strong AI
      base = stats.playerScore * 140;
    }

    // Rally length skill bonus
    base += Math.min(600, stats.longestRally * 35);

    // Saves count bonus
    base += Math.min(500, stats.playerSaves * 50);

    // Fast finish bonus for victories
    if (isWin && stats.matchDuration < 60) {
      base += Math.floor((60 - stats.matchDuration) * 10);
    }

    // Unbeatable survival bonus
    if (difficulty === 'UNBEATABLE') {
      base += Math.floor(stats.matchDuration * 8);
    }

    const total = Math.round(base * diffMultipliers[difficulty]);
    return Math.max(100, total);
  }

  public static evaluateAchievements(difficulty: DifficultyMode, stats: MatchStats): string[] {
    const list: string[] = [];
    if (stats.playerScore >= 7) {
      list.push('VICTORY ACHIEVED');
      if (stats.aiScore === 0) {
        list.push('SHUTOUT MASTER (7-0)');
      }
      if (difficulty === 'UNBEATABLE') {
        list.push('CORE BREAKER: Defeated the Unbeatable AI');
      }
    }

    if (difficulty === 'UNBEATABLE') {
      if (stats.matchDuration >= 60) {
        list.push('UNBEATABLE SURVIVOR: Survived full 60s against SYNTROX CORE');
      }
      if (stats.playerScore >= 3) {
        list.push('CYBER RESISTANCE: Scored 3+ goals against Unbeatable AI');
      }
    }

    if (stats.longestRally >= 10) {
      list.push(`HYPER RALLY: ${stats.longestRally} consecutive hits`);
    }

    if (stats.maxPuckSpeed >= 24) {
      list.push('WARP SHOT: Hyper-velocity strike');
    }

    return list;
  }
}
