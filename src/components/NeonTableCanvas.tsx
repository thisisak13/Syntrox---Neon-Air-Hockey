// Main Game Canvas & Table Renderer for SYNTROX Neon Air Hockey
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, DifficultyMode, MatchStats, GameSettings, TableOrientation, ActivePowerUp } from '../types';
import { PhysicsEngine } from '../physics/engine';
import { AIController } from '../ai/aiController';
import { ParticleSystem } from '../effects/particleSystem';
import { soundManager } from '../audio/soundManager';
import { getTheme } from '../themes';
import { Pause, Volume2, VolumeX, RotateCcw, Timer } from 'lucide-react';

interface NeonTableCanvasProps {
  gameState: GameState;
  difficulty: DifficultyMode;
  settings: GameSettings;
  onGoalScored: (scorer: 'PLAYER' | 'AI', newPlayerScore: number, newAiScore: number) => void;
  onMatchEnded: (winner: 'PLAYER' | 'AI', finalStats: MatchStats) => void;
  onPauseToggle: () => void;
  onRestartRequest: () => void;
  onToggleSound: () => void;
}

const MATCH_TIME_LIMIT = 60; // 60 seconds for all levels

const detectTableOrientation = (): TableOrientation => {
  if (typeof window === 'undefined') return 'vertical';
  // Desktop site (widescreen and width >= 768px): horizontal board
  // Mobile site (portrait or small screens): vertical board
  return window.innerWidth >= 768 && window.innerWidth > window.innerHeight
    ? 'horizontal'
    : 'vertical';
};

export const NeonTableCanvas: React.FC<NeonTableCanvasProps> = ({
  gameState,
  difficulty,
  settings,
  onGoalScored,
  onMatchEnded,
  onPauseToggle,
  onRestartRequest,
  onToggleSound,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const theme = getTheme(settings.colorTheme);

  const [orientation, setOrientation] = useState<TableOrientation>(detectTableOrientation);

  // Engine references
  const physicsRef = useRef<PhysicsEngine>(new PhysicsEngine(detectTableOrientation()));
  const aiRef = useRef<AIController>(new AIController(difficulty));
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem(settings.particleQuality));

  // Authoritative match score tracking refs
  const scoresRef = useRef<{ player: number; ai: number }>({ player: 0, ai: 0 });
  const isGoalTransitionRef = useRef<boolean>(false);

  // UI state for reactive scoreboard & 2-minute timer
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(MATCH_TIME_LIMIT);
  const timeLeftRef = useRef<number>(MATCH_TIME_LIMIT);
  const [recoveryNotice, setRecoveryNotice] = useState<boolean>(false);
  const [goalBanner, setGoalBanner] = useState<{ text: string; color: string; subtitle?: string } | null>(null);

  // Tactical Power-ups state
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [powerUpToast, setPowerUpToast] = useState<{ text: string; color: string } | null>(null);

  // Keyboard tracking
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Match stats ref
  const statsRef = useRef<MatchStats>({
    playerScore: 0,
    aiScore: 0,
    matchDuration: 0,
    playerShots: 0,
    aiShots: 0,
    playerSaves: 0,
    aiSaves: 0,
    maxPuckSpeed: 0,
    longestRally: 0,
    currentRally: 0,
    performanceScore: 0,
    unbeatableSurvivalTime: 0,
    achievements: [],
  });

  // Keep AI mode updated
  useEffect(() => {
    aiRef.current.setMode(difficulty);
  }, [difficulty]);

  // Keep particle quality updated
  useEffect(() => {
    particlesRef.current.setQuality(settings.particleQuality);
  }, [settings.particleQuality]);

  // Handle orientation changes (Desktop Horizontal vs Mobile Vertical)
  useEffect(() => {
    const handleResize = () => {
      const newOrientation = detectTableOrientation();
      setOrientation(newOrientation);
      physicsRef.current.setOrientation(newOrientation);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset match state
  const resetMatchState = useCallback(() => {
    physicsRef.current.resetPositions();
    physicsRef.current.clearPowerUps();
    particlesRef.current.clear();
    scoresRef.current = { player: 0, ai: 0 };
    isGoalTransitionRef.current = false;
    setPlayerScore(0);
    setAiScore(0);
    setTimeLeft(MATCH_TIME_LIMIT);
    timeLeftRef.current = MATCH_TIME_LIMIT;
    setActivePowerUps([]);
    setPowerUpToast(null);
    setGoalBanner(null);
    setRecoveryNotice(false);
    statsRef.current = {
      playerScore: 0,
      aiScore: 0,
      matchDuration: 0,
      playerShots: 0,
      aiShots: 0,
      playerSaves: 0,
      aiSaves: 0,
      maxPuckSpeed: 0,
      longestRally: 0,
      currentRally: 0,
      performanceScore: 0,
      unbeatableSurvivalTime: 0,
      achievements: [],
    };
  }, []);

  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      resetMatchState();
    }
  }, [gameState, resetMatchState]);

  // Match 60-Second Timer & Active Power-Ups Tick Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      // 1. Tick down 60-second timer for all levels
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 60-second time limit expired!
          const currentP = scoresRef.current.player;
          const currentAi = scoresRef.current.ai;
          if (currentP > currentAi) {
            onMatchEnded('PLAYER', { ...statsRef.current });
          } else if (currentAi > currentP) {
            onMatchEnded('AI', { ...statsRef.current });
          } else {
            // Sudden death if tied!
            setGoalBanner({ text: 'GOAL!', color: '#ffb703', subtitle: 'TIME EXPIRED • NEXT GOAL WINS!' });
            setTimeout(() => setGoalBanner(null), 2500);
          }
          return 0;
        }
        const next = prev - 1;
        timeLeftRef.current = next;
        statsRef.current.matchDuration = MATCH_TIME_LIMIT - next;
        if (difficulty === 'UNBEATABLE') {
          statsRef.current.unbeatableSurvivalTime = statsRef.current.matchDuration;
        }
        return next;
      });

      // 2. Tick active power-ups
      setActivePowerUps((prev) => {
        if (prev.length === 0) return prev;
        const next = prev
          .map((p) => ({ ...p, timeLeft: p.timeLeft - 1 }))
          .filter((p) => p.timeLeft > 0);

        // Synchronize physics engine flags
        const physics = physicsRef.current;
        physics.isGoalShieldActive = next.some((p) => p.type === 'GOAL_SHIELD');
        physics.isHyperShotActive = next.some((p) => p.type === 'HYPER_SHOT');
        physics.isMegaMalletActive = next.some((p) => p.type === 'MEGA_MALLET');
        physics.isEmpFreezeActive = next.some((p) => p.type === 'EMP_FREEZE');

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, difficulty, onMatchEnded]);

  // Tactical Power-up Spawner (spawns orbs on the table during play)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const spawnInterval = setInterval(() => {
      if (gameState === 'PLAYING' && !isGoalTransitionRef.current) {
        const item = physicsRef.current.spawnPowerUp();
        if (item) {
          soundManager.playPowerUpSpawn();
          particlesRef.current.addImpactSparks(item.x, item.y, item.color, 14, 1.2);
        }
      }
    }, 13000);

    // Initial power-up drop after 4 seconds of game start for optimal player engagement
    const initialTimer = setTimeout(() => {
      if (gameState === 'PLAYING' && !isGoalTransitionRef.current) {
        const item = physicsRef.current.spawnPowerUp();
        if (item) {
          soundManager.playPowerUpSpawn();
          particlesRef.current.addImpactSparks(item.x, item.y, item.color, 14, 1.2);
        }
      }
    }, 3500);

    return () => {
      clearInterval(spawnInterval);
      clearTimeout(initialTimer);
    };
  }, [gameState]);

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        onPauseToggle();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPauseToggle]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const physics = physicsRef.current;
      const ai = aiRef.current;
      const particles = particlesRef.current;

      const isPlayActive = gameState === 'PLAYING' && !isGoalTransitionRef.current;

      // 1. Keyboard Mallet Input (Desktop)
      if (isPlayActive) {
        const moveSpeed = 16;
        let deltaX = 0;
        let deltaY = 0;
        const keys = keysDownRef.current;
        if (keys['w'] || keys['arrowup']) deltaY -= moveSpeed;
        if (keys['s'] || keys['arrowdown']) deltaY += moveSpeed;
        if (keys['a'] || keys['arrowleft']) deltaX -= moveSpeed;
        if (keys['d'] || keys['arrowright']) deltaX += moveSpeed;

        if (deltaX !== 0 || deltaY !== 0) {
          const nextTargetX = physics.playerMallet.targetX + deltaX;
          const nextTargetY = physics.playerMallet.targetY + deltaY;
          physics.setPlayerTarget(nextTargetX, nextTargetY);
        }
      }

      // 2. AI Decision Update
      if (isPlayActive) {
        const aiTarget = ai.update(
          physics.table,
          physics.puck,
          physics.aiMallet,
          physics.playerMallet,
          physics.orientation
        );
        physics.setAiTarget(aiTarget.targetX, aiTarget.targetY);
      }

      // 3. Update Physics Engine
      const collisionEvents = physics.update(isPlayActive);

      // Process collision audio and particle effects
      for (const ev of collisionEvents) {
        if (ev.type === 'WALL') {
          soundManager.playWallHit(ev.speedIntensity);
          particles.addWallBounceSparks(ev.x, ev.y, ev.speedIntensity);
        } else if (ev.type === 'MALLET_PLAYER') {
          soundManager.playMalletHit(ev.speedIntensity);
          particles.addMalletImpactSparks(ev.x, ev.y, true, ev.speedIntensity);
          statsRef.current.playerShots++;
          statsRef.current.currentRally++;
          if (statsRef.current.currentRally > statsRef.current.longestRally) {
            statsRef.current.longestRally = statsRef.current.currentRally;
          }
          const curPuckSpeed = Math.hypot(physics.puck.vx, physics.puck.vy);
          if (curPuckSpeed > statsRef.current.maxPuckSpeed) {
            statsRef.current.maxPuckSpeed = curPuckSpeed;
          }
        } else if (ev.type === 'MALLET_AI') {
          soundManager.playMalletHit(ev.speedIntensity);
          particles.addMalletImpactSparks(ev.x, ev.y, false, ev.speedIntensity);
          statsRef.current.aiShots++;
          statsRef.current.currentRally++;
          if (statsRef.current.currentRally > statsRef.current.longestRally) {
            statsRef.current.longestRally = statsRef.current.currentRally;
          }
          const curPuckSpeed = Math.hypot(physics.puck.vx, physics.puck.vy);
          if (curPuckSpeed > statsRef.current.maxPuckSpeed) {
            statsRef.current.maxPuckSpeed = curPuckSpeed;
          }
        } else if (ev.type === 'RECOVERY') {
          soundManager.playPuckRecovered();
          particles.addRecoveryEffect(ev.x, ev.y);
          setRecoveryNotice(true);
          setTimeout(() => setRecoveryNotice(false), 1200);
        } else if (ev.type === 'SHIELD_BOUNCE') {
          soundManager.playShieldBounce();
          particles.addImpactSparks(ev.x, ev.y, '#00ff88', 22, 1.4);
          particles.triggerShake(5);
        } else if (ev.type === 'POWERUP_COLLECT' && ev.powerUp) {
          soundManager.playPowerUpCollect();
          particles.addImpactSparks(ev.x, ev.y, ev.powerUp.color, 32, 1.8);
          particles.triggerShake(4);

          const collected = ev.powerUp;
          if (collected.type === 'GOAL_SHIELD') physics.isGoalShieldActive = true;
          if (collected.type === 'HYPER_SHOT') physics.isHyperShotActive = true;
          if (collected.type === 'MEGA_MALLET') physics.isMegaMalletActive = true;
          if (collected.type === 'EMP_FREEZE') physics.isEmpFreezeActive = true;

          setActivePowerUps((prev) => {
            const filtered = prev.filter((p) => p.type !== collected.type);
            return [
              ...filtered,
              {
                type: collected.type,
                label: collected.label,
                color: collected.color,
                timeLeft: collected.duration,
                duration: collected.duration,
              },
            ];
          });

          setPowerUpToast({
            text: `⚡ ${collected.label} ACQUIRED!`,
            color: collected.color,
          });
          setTimeout(() => setPowerUpToast(null), 1800);
        } else if (ev.type === 'GOAL_PLAYER') {
          // PLAYER GOAL!
          if (!isGoalTransitionRef.current && gameState === 'PLAYING') {
            isGoalTransitionRef.current = true;
            soundManager.playGoal();
            particles.addGoalExplosion(ev.x, ev.y, true);

            scoresRef.current.player += 1;
            const nextScore = scoresRef.current.player;
            setPlayerScore(nextScore);
            statsRef.current.playerScore = nextScore;
            statsRef.current.currentRally = 0;

            const playerCallsign = settings.playerName?.trim() ? settings.playerName.trim().toUpperCase() : 'PLAYER';

            if (nextScore >= 7) {
              // First to 7 wins immediately
              setGoalBanner({ text: `${playerCallsign} WINS!`, color: theme.playerPrimary, subtitle: 'MATCH POINT • VICTORY' });
              onMatchEnded('PLAYER', { ...statsRef.current });
            } else {
              setGoalBanner({ text: 'GOAL!', color: theme.playerPrimary, subtitle: `${playerCallsign} SCORED` });
              onGoalScored('PLAYER', nextScore, scoresRef.current.ai);
              setTimeout(() => {
                setGoalBanner(null);
                physics.resetPuck(true);
                isGoalTransitionRef.current = false;
              }, 1400);
            }
          }
        } else if (ev.type === 'GOAL_AI') {
          // AI GOAL!
          if (!isGoalTransitionRef.current && gameState === 'PLAYING') {
            isGoalTransitionRef.current = true;
            soundManager.playGoal();
            particles.addGoalExplosion(ev.x, ev.y, false);

            scoresRef.current.ai += 1;
            const nextScore = scoresRef.current.ai;
            setAiScore(nextScore);
            statsRef.current.aiScore = nextScore;
            statsRef.current.currentRally = 0;

            if (nextScore >= 7) {
              // First to 7 wins immediately
              setGoalBanner({ text: 'SYNTROX AI WINS!', color: theme.aiPrimary, subtitle: 'MATCH POINT' });
              onMatchEnded('AI', { ...statsRef.current });
            } else {
              setGoalBanner({ text: 'GOAL!', color: theme.aiPrimary, subtitle: 'SYNTROX AI SCORED' });
              onGoalScored('AI', scoresRef.current.player, nextScore);
              setTimeout(() => {
                setGoalBanner(null);
                physics.resetPuck(false);
                isGoalTransitionRef.current = false;
              }, 1400);
            }
          }
        }
      }

      // 4. Update particles
      particles.update();

      // 5. Render Canvas Frame
      drawFrame(ctx, canvas, physics, particles, settings.screenShake);

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, difficulty, settings.screenShake, onGoalScored, onMatchEnded]);

  // Canvas Drawing Routine (Clean, High-Contrast, Zero Distortions)
  const drawFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    physics: PhysicsEngine,
    particles: ParticleSystem,
    screenShake: boolean
  ) => {
    const table = physics.table;
    const w = canvas.width;
    const h = canvas.height;
    const isH = physics.orientation === 'horizontal';

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Controlled, smooth screen shake (subtle and distortion-free)
    if (screenShake && particles.screenShakeIntensity > 0) {
      const maxShake = 6;
      const intensity = Math.min(particles.screenShakeIntensity, maxShake);
      const sx = (Math.random() - 0.5) * intensity * 0.8;
      const sy = (Math.random() - 0.5) * intensity * 0.8;
      ctx.translate(sx, sy);
    }

    // Scale to table coordinates while preserving aspect ratio
    const scale = Math.min(w / table.width, h / table.height);
    const offsetX = (w - table.width * scale) / 2;
    const offsetY = (h - table.height * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Table Floor Surface
    const floorGrad = ctx.createRadialGradient(
      table.width / 2,
      table.height / 2,
      60,
      table.width / 2,
      table.height / 2,
      Math.max(table.width, table.height) * 0.6
    );
    floorGrad.addColorStop(0, theme.tableBg);
    floorGrad.addColorStop(0.7, theme.tableBg);
    floorGrad.addColorStop(1, '#020308');

    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, table.width, table.height);

    // Subtle Cyber Grid Lines
    ctx.save();
    ctx.strokeStyle = `${theme.playerPrimary}15`;
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= table.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, table.height);
      ctx.stroke();
    }
    for (let y = 0; y <= table.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(table.width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Subtle Zone Underlays
    if (isH) {
      // AI Zone (Left)
      ctx.fillStyle = theme.tableSurfaceAi;
      ctx.fillRect(0, 0, table.width / 2, table.height);
      // Player Zone (Right)
      ctx.fillStyle = theme.tableSurfacePlayer;
      ctx.fillRect(table.width / 2, 0, table.width / 2, table.height);
    } else {
      // AI Zone (Top)
      ctx.fillStyle = theme.tableSurfaceAi;
      ctx.fillRect(0, 0, table.width, table.height / 2);
      // Player Zone (Bottom)
      ctx.fillStyle = theme.tableSurfacePlayer;
      ctx.fillRect(0, table.height / 2, table.width, table.height / 2);
    }

    // Outer Table Perimeter & Rails
    drawTablePerimeter(ctx, physics);

    // Center Line & Markings
    drawCenterMarkings(ctx, physics);

    // Power-Up orbs spawned on table
    drawPowerUps(ctx, physics);

    // Goals & Goal Posts & Laser Shield
    drawGoals(ctx, physics);

    // Puck Trail & Puck (Trail energized if Hyper Shot active)
    drawPuckTrail(ctx, physics.puck, physics.isHyperShotActive);
    drawPuck(ctx, physics.puck);

    // Mallets (rendered with visual indicators for Mega, Hyper, EMP)
    drawMallet(
      ctx,
      physics.aiMallet,
      theme.aiPrimary,
      theme.aiSecondary,
      'CORE',
      physics.isEmpFreezeActive,
      false,
      false
    );
    drawMallet(
      ctx,
      physics.playerMallet,
      physics.isHyperShotActive ? '#ffb703' : theme.playerPrimary,
      physics.isMegaMalletActive ? '#ffffff' : theme.playerSecondary,
      physics.isMegaMalletActive ? 'MEGA' : 'YOU',
      false,
      physics.isMegaMalletActive,
      physics.isHyperShotActive
    );

    // Particles and Shockwaves
    particles.render(ctx);

    ctx.restore();
  };

  // Draw Table Perimeter with Beveled Corners and Neon Rails
  const drawTablePerimeter = (ctx: CanvasRenderingContext2D, physics: PhysicsEngine) => {
    const table = physics.table;
    const cut = table.cornerCut;
    const w = table.width;
    const h = table.height;
    const isH = physics.orientation === 'horizontal';

    ctx.save();

    if (isH) {
      // HORIZONTAL RAILS (Left is AI, Right is Player)
      const goalStart = (h - table.goalWidth) / 2;
      const goalEnd = (h + table.goalWidth) / 2;

      // Top Wall (AI side is AI theme rail, Player side is Player theme rail)
      ctx.lineWidth = 4;
      ctx.shadowBlur = 12;

      ctx.strokeStyle = theme.aiRailStroke;
      ctx.shadowColor = theme.aiRailGlow;
      ctx.beginPath();
      ctx.moveTo(cut, 0);
      ctx.lineTo(w / 2, 0);
      ctx.stroke();

      ctx.strokeStyle = theme.playerRailStroke;
      ctx.shadowColor = theme.playerRailGlow;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w - cut, 0);
      ctx.stroke();

      // Bottom Wall
      ctx.strokeStyle = theme.aiRailStroke;
      ctx.shadowColor = theme.aiRailGlow;
      ctx.beginPath();
      ctx.moveTo(cut, h);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      ctx.strokeStyle = theme.playerRailStroke;
      ctx.shadowColor = theme.playerRailGlow;
      ctx.beginPath();
      ctx.moveTo(w / 2, h);
      ctx.lineTo(w - cut, h);
      ctx.stroke();

      // Left Wall (AI side, with goal opening)
      ctx.strokeStyle = theme.aiRailStroke;
      ctx.shadowColor = theme.aiRailGlow;
      ctx.beginPath();
      ctx.moveTo(cut, 0);
      ctx.lineTo(0, cut);
      ctx.lineTo(0, goalStart);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, goalEnd);
      ctx.lineTo(0, h - cut);
      ctx.lineTo(cut, h);
      ctx.stroke();

      // Right Wall (Player side, with goal opening)
      ctx.strokeStyle = theme.playerRailStroke;
      ctx.shadowColor = theme.playerRailGlow;
      ctx.beginPath();
      ctx.moveTo(w - cut, 0);
      ctx.lineTo(w, cut);
      ctx.lineTo(w, goalStart);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w, goalEnd);
      ctx.lineTo(w, h - cut);
      ctx.lineTo(w - cut, h);
      ctx.stroke();
    } else {
      // VERTICAL RAILS (Top is AI, Bottom is Player)
      const goalStart = (w - table.goalWidth) / 2;
      const goalEnd = (w + table.goalWidth) / 2;

      ctx.lineWidth = 4;
      ctx.shadowBlur = 12;

      // Left & Right continuous walls
      ctx.strokeStyle = theme.playerRailStroke;
      ctx.shadowColor = theme.playerRailGlow;
      ctx.beginPath();
      ctx.moveTo(0, cut);
      ctx.lineTo(0, h - cut);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w, cut);
      ctx.lineTo(w, h - cut);
      ctx.stroke();

      // Top Wall (AI side)
      ctx.strokeStyle = theme.aiRailStroke;
      ctx.shadowColor = theme.aiRailGlow;
      ctx.beginPath();
      ctx.moveTo(0, cut);
      ctx.lineTo(cut, 0);
      ctx.lineTo(goalStart, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(goalEnd, 0);
      ctx.lineTo(w - cut, 0);
      ctx.lineTo(w, cut);
      ctx.stroke();

      // Bottom Wall (Player side)
      ctx.strokeStyle = theme.playerRailStroke;
      ctx.shadowColor = theme.playerRailGlow;
      ctx.beginPath();
      ctx.moveTo(0, h - cut);
      ctx.lineTo(cut, h);
      ctx.lineTo(goalStart, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(goalEnd, h);
      ctx.lineTo(w - cut, h);
      ctx.lineTo(w, h - cut);
      ctx.stroke();
    }

    // Corner Bumper Blocks
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#101628';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    const drawCornerBracket = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    drawCornerBracket(0, 0, cut, 0, 0, cut);
    drawCornerBracket(w, 0, w - cut, 0, w, cut);
    drawCornerBracket(0, h, cut, h, 0, h - cut);
    drawCornerBracket(w, h, w - cut, h, w, h - cut);

    ctx.restore();
  };

  // Center Line, Circle, and Defensive Crease Lines
  const drawCenterMarkings = (ctx: CanvasRenderingContext2D, physics: PhysicsEngine) => {
    const table = physics.table;
    const isH = physics.orientation === 'horizontal';
    const midX = table.width / 2;
    const midY = table.height / 2;

    ctx.save();
    ctx.shadowColor = theme.centerGlow;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = theme.centerLine;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);

    if (isH) {
      // Vertical Center Dividing Line
      ctx.beginPath();
      ctx.moveTo(midX, 15);
      ctx.lineTo(midX, table.height - 15);
      ctx.stroke();
    } else {
      // Horizontal Center Dividing Line
      ctx.beginPath();
      ctx.moveTo(15, midY);
      ctx.lineTo(table.width - 15, midY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Center Face-off Circle
    ctx.beginPath();
    ctx.arc(midX, midY, 80, 0, Math.PI * 2);
    ctx.strokeStyle = theme.centerLine;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner Center Ring
    ctx.beginPath();
    ctx.arc(midX, midY, 20, 0, Math.PI * 2);
    ctx.fillStyle = theme.centerRingBg;
    ctx.fill();
    ctx.strokeStyle = theme.centerRingStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Defensive arcs
    if (isH) {
      // Left Goal Arc (AI)
      ctx.beginPath();
      ctx.arc(0, midY, 130, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = `${theme.aiPrimary}40`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();

      // Right Goal Arc (Player)
      ctx.beginPath();
      ctx.arc(table.width, midY, 130, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.strokeStyle = `${theme.playerPrimary}40`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Top Goal Arc (AI)
      ctx.beginPath();
      ctx.arc(midX, 0, 130, 0, Math.PI);
      ctx.strokeStyle = `${theme.aiPrimary}40`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();

      // Bottom Goal Arc (Player)
      ctx.beginPath();
      ctx.arc(midX, table.height, 130, Math.PI, Math.PI * 2);
      ctx.strokeStyle = `${theme.playerPrimary}40`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Goals Rendering with Depth and Neon Glow
  const drawGoals = (ctx: CanvasRenderingContext2D, physics: PhysicsEngine) => {
    const table = physics.table;
    const isH = physics.orientation === 'horizontal';
    const postRadius = physics.GOAL_POST_RADIUS;

    ctx.save();

    if (isH) {
      // HORIZONTAL: Left Goal is AI, Right Goal is Player
      const goalStart = (table.height - table.goalWidth) / 2;
      const goalEnd = (table.height + table.goalWidth) / 2;

      // Left Goal Pocket (AI)
      const leftGoalGrad = ctx.createLinearGradient(-25, 0, 5, 0);
      leftGoalGrad.addColorStop(0, '#0a0206');
      leftGoalGrad.addColorStop(1, `${theme.aiPrimary}40`);
      ctx.fillStyle = leftGoalGrad;
      ctx.fillRect(-25, goalStart, 25, table.goalWidth);

      ctx.shadowColor = theme.aiPrimary;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = theme.aiPrimary;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, goalStart);
      ctx.lineTo(0, goalEnd);
      ctx.stroke();

      // Left Goal Posts
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = theme.aiPrimary;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, goalStart, postRadius, 0, Math.PI * 2);
      ctx.arc(0, goalEnd, postRadius, 0, Math.PI * 2);
      ctx.fill();

      // Right Goal Pocket (Player)
      const rightGoalGrad = ctx.createLinearGradient(table.width - 5, 0, table.width + 25, 0);
      rightGoalGrad.addColorStop(0, `${theme.playerPrimary}40`);
      rightGoalGrad.addColorStop(1, '#02060a');
      ctx.fillStyle = rightGoalGrad;
      ctx.fillRect(table.width, goalStart, 25, table.goalWidth);

      ctx.shadowColor = theme.playerPrimary;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = theme.playerPrimary;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(table.width, goalStart);
      ctx.lineTo(table.width, goalEnd);
      ctx.stroke();

      // Right Goal Posts
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = theme.playerPrimary;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(table.width, goalStart, postRadius, 0, Math.PI * 2);
      ctx.arc(table.width, goalEnd, postRadius, 0, Math.PI * 2);
      ctx.fill();

      // Right Goal Tactical Laser Shield (Horizontal)
      if (physics.isGoalShieldActive) {
        ctx.save();
        ctx.strokeStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(table.width, goalStart);
        ctx.lineTo(table.width, goalEnd);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = "bold 9px 'Orbitron', monospace";
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'right';
        ctx.shadowBlur = 10;
        ctx.fillText('SHIELD ACTIVE', table.width - 12, (goalStart + goalEnd) / 2);
        ctx.restore();
      }
    } else {
      // VERTICAL: Top Goal is AI, Bottom Goal is Player
      const goalStart = (table.width - table.goalWidth) / 2;
      const goalEnd = (table.width + table.goalWidth) / 2;

      // Top Goal Pocket (AI)
      const topGoalGrad = ctx.createLinearGradient(0, -25, 0, 5);
      topGoalGrad.addColorStop(0, '#0a0206');
      topGoalGrad.addColorStop(1, `${theme.aiPrimary}40`);
      ctx.fillStyle = topGoalGrad;
      ctx.fillRect(goalStart, -25, table.goalWidth, 25);

      ctx.shadowColor = theme.aiPrimary;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = theme.aiPrimary;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(goalStart, 0);
      ctx.lineTo(goalEnd, 0);
      ctx.stroke();

      // Top Goal Posts
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = theme.aiPrimary;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(goalStart, 0, postRadius, 0, Math.PI * 2);
      ctx.arc(goalEnd, 0, postRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bottom Goal Pocket (Player)
      const bottomGoalGrad = ctx.createLinearGradient(0, table.height - 5, 0, table.height + 25);
      bottomGoalGrad.addColorStop(0, `${theme.playerPrimary}40`);
      bottomGoalGrad.addColorStop(1, '#02060a');
      ctx.fillStyle = bottomGoalGrad;
      ctx.fillRect(goalStart, table.height, table.goalWidth, 25);

      ctx.shadowColor = theme.playerPrimary;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = theme.playerPrimary;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(goalStart, table.height);
      ctx.lineTo(goalEnd, table.height);
      ctx.stroke();

      // Bottom Goal Posts
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = theme.playerPrimary;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(goalStart, table.height, postRadius, 0, Math.PI * 2);
      ctx.arc(goalEnd, table.height, postRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bottom Goal Tactical Laser Shield (Vertical)
      if (physics.isGoalShieldActive) {
        ctx.save();
        ctx.strokeStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(goalStart, table.height);
        ctx.lineTo(goalEnd, table.height);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = "bold 9px 'Orbitron', monospace";
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.fillText('⚡ SHIELD ACTIVE ⚡', (goalStart + goalEnd) / 2, table.height - 12);
        ctx.restore();
      }
    }

    ctx.restore();
  };

  // Draw floating power-up orbs with pulsing glows, rotating dashed rings, and icons
  const drawPowerUps = (ctx: CanvasRenderingContext2D, physics: PhysicsEngine) => {
    if (!physics.powerUps || physics.powerUps.length === 0) return;
    const now = Date.now();

    ctx.save();
    for (const p of physics.powerUps) {
      const pulse = Math.sin((now - p.spawnTime) / 180) * 0.15 + 1;
      const rot = (now / 600) % (Math.PI * 2);

      // Outer aura
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * pulse * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}25`;
      ctx.fill();

      // Rotating dashed ring
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      // Inner solid orb
      const orbGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, p.radius);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.4, p.color);
      orbGrad.addColorStop(1, '#050a18');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Icon symbol in center
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.font = "bold 13px 'Orbitron', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let icon = '⚡';
      if (p.type === 'GOAL_SHIELD') icon = '🛡️';
      if (p.type === 'HYPER_SHOT') icon = '🔥';
      if (p.type === 'EMP_FREEZE') icon = '❄️';
      if (p.type === 'MEGA_MALLET') icon = '⚡';
      ctx.fillText(icon, p.x, p.y);
      ctx.restore();

      // Floating label below orb
      ctx.save();
      ctx.font = "bold 9px 'Orbitron', monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.label, p.x, p.y + p.radius + 12);
      ctx.restore();
    }
    ctx.restore();
  };

  // Mallet rendering: Metallic Bevel, High-Contrast Neon Ring, 3D Handle, Power-Up Effects
  const drawMallet = (
    ctx: CanvasRenderingContext2D,
    mallet: typeof physicsRef.current.playerMallet,
    glowColor: string,
    accentColor: string,
    label: string,
    isEmpActive: boolean = false,
    isMegaActive: boolean = false,
    isHyperActive: boolean = false
  ) => {
    ctx.save();

    // EMP Freeze crackle aura on AI
    if (isEmpActive) {
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(mallet.x, mallet.y, mallet.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Mega Mallet outer expansion ring
    if (isMegaActive) {
      ctx.save();
      ctx.strokeStyle = theme.playerPrimary;
      ctx.shadowColor = theme.playerPrimary;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(mallet.x, mallet.y, mallet.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Hyper Shot flame ring
    if (isHyperActive) {
      ctx.save();
      ctx.strokeStyle = '#ffb703';
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 22;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mallet.x, mallet.y, mallet.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Outer Glow Aura
    ctx.shadowColor = isEmpActive ? '#c084fc' : glowColor;
    ctx.shadowBlur = 18;

    // Outer Rim Metallic Gradient
    const rimGrad = ctx.createRadialGradient(
      mallet.x - mallet.radius * 0.3,
      mallet.y - mallet.radius * 0.3,
      mallet.radius * 0.2,
      mallet.x,
      mallet.y,
      mallet.radius
    );
    rimGrad.addColorStop(0, '#4a5568');
    rimGrad.addColorStop(0.7, '#1e293b');
    rimGrad.addColorStop(1, '#0f172a');

    ctx.beginPath();
    ctx.arc(mallet.x, mallet.y, mallet.radius, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Neon Accent Border Ring
    ctx.strokeStyle = isEmpActive ? '#c084fc' : accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner Recessed Disk
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(mallet.x, mallet.y, mallet.radius * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = '#060a14';
    ctx.fill();
    ctx.strokeStyle = isEmpActive ? '#c084fc' : glowColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center Handle Knob (Spherical 3D Light)
    const knobGrad = ctx.createRadialGradient(
      mallet.x - mallet.radius * 0.15,
      mallet.y - mallet.radius * 0.15,
      2,
      mallet.x,
      mallet.y,
      mallet.radius * 0.42
    );
    knobGrad.addColorStop(0, '#ffffff');
    knobGrad.addColorStop(0.3, isEmpActive ? '#c084fc' : accentColor);
    knobGrad.addColorStop(0.8, isEmpActive ? '#9333ea' : glowColor);
    knobGrad.addColorStop(1, '#110515');

    ctx.beginPath();
    ctx.arc(mallet.x, mallet.y, mallet.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();

    // Mallet Label Text
    ctx.font = "bold 9px 'Orbitron', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isEmpActive ? 'FROZEN' : label, mallet.x, mallet.y);

    ctx.restore();
  };

  // Puck Trail (with Hyper Shot plasma color)
  const drawPuckTrail = (
    ctx: CanvasRenderingContext2D,
    puck: typeof physicsRef.current.puck,
    isHyperShot: boolean = false
  ) => {
    if (!puck.trail || puck.trail.length < 2) return;

    ctx.save();
    for (let i = 0; i < puck.trail.length - 1; i++) {
      const pt1 = puck.trail[i];
      const pt2 = puck.trail[i + 1];
      const alpha = pt1.alpha * 0.4;

      ctx.strokeStyle = isHyperShot
        ? `rgba(255, 183, 3, ${alpha})`
        : `${theme.puckGlow}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = puck.radius * 1.7 * (1 - i / puck.trail.length);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Energetic Puck
  const drawPuck = (ctx: CanvasRenderingContext2D, puck: typeof physicsRef.current.puck) => {
    ctx.save();

    // Puck Outer Neon Glow
    ctx.shadowColor = theme.puckGlow;
    ctx.shadowBlur = 16;

    // Puck Body
    const puckGrad = ctx.createRadialGradient(
      puck.x - puck.radius * 0.3,
      puck.y - puck.radius * 0.3,
      puck.radius * 0.1,
      puck.x,
      puck.y,
      puck.radius
    );
    puckGrad.addColorStop(0, '#ffffff');
    puckGrad.addColorStop(0.25, theme.puckRing);
    puckGrad.addColorStop(0.65, theme.puckGlow);
    puckGrad.addColorStop(1, '#020610');

    ctx.beginPath();
    ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
    ctx.fillStyle = puckGrad;
    ctx.fill();

    // Neon Rim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner Glowing Core
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, puck.radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  };

  // Convert Screen Mouse / Touch Coordinates to Virtual Table Coordinates
  const screenToTableCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const table = physicsRef.current.table;

    const scale = Math.min(canvas.width / table.width, canvas.height / table.height);
    const offsetX = (canvas.width - table.width * scale) / 2;
    const offsetY = (canvas.height - table.height * scale) / 2;

    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (clientY - rect.top) * (canvas.height / rect.height);

    const tableX = (canvasX - offsetX) / scale;
    const tableY = (canvasY - offsetY) / scale;

    return { x: tableX, y: tableY };
  };

  // Touch Handlers
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const coords = screenToTableCoords(touch.clientX, touch.clientY);
      if (coords) {
        physicsRef.current.setPlayerTarget(coords.x, coords.y);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const coords = screenToTableCoords(touch.clientX, touch.clientY);
      if (coords) {
        physicsRef.current.setPlayerTarget(coords.x, coords.y);
      }
    }
  };

  // Mouse Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const coords = screenToTableCoords(e.clientX, e.clientY);
    if (coords) {
      physicsRef.current.setPlayerTarget(coords.x, coords.y);
    }
  };

  // Resize Canvas to fill container with proper pixel ratio
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    updateCanvasSize();
    const ro = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      id="syntrox-table-container"
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden touch-none select-none"
      style={{ backgroundColor: theme.tableBg }}
    >
      {/* Top HUD Bar */}
      <header
        id="table-hud-bar"
        className="absolute top-0 left-0 right-0 z-20 px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-xs"
      >
        {/* Left: Mode Badge & Timer */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/20 text-white/90 text-xs font-mono tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.playerPrimary }}></span>
            <span className="font-bold">{difficulty}</span>
          </div>

          <div
            className={`flex items-center space-x-1.5 font-mono text-xs sm:text-sm tracking-widest px-2.5 py-0.5 rounded border transition-all ${
              timeLeft <= 15
                ? 'bg-rose-950/70 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_12px_rgba(255,0,85,0.5)]'
                : 'bg-black/50 border-white/20 text-white/90 shadow-sm'
            }`}
          >
            <Timer size={13} className={timeLeft <= 15 ? 'text-rose-400 animate-spin' : 'text-white/80'} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Center: Digital Scoreboard (First to 7) */}
        <div className="flex items-center space-x-4 sm:space-x-6 font-['Orbitron']">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-xs font-mono tracking-wider opacity-80" style={{ color: theme.uiAiScore }}>AI</span>
            <span
              className="text-2xl sm:text-3xl font-black"
              style={{ color: theme.uiAiScore, textShadow: `0 0 10px ${theme.uiAiScore}` }}
            >
              {aiScore}
            </span>
          </div>

          <span className="text-white/30 text-sm sm:text-base font-mono">:</span>

          <div className="flex items-center space-x-2">
            <span
              className="text-2xl sm:text-3xl font-black"
              style={{ color: theme.uiPlayerScore, textShadow: `0 0 10px ${theme.uiPlayerScore}` }}
            >
              {playerScore}
            </span>
            <span className="text-[10px] sm:text-xs font-mono tracking-wider opacity-80" style={{ color: theme.uiPlayerScore }}>YOU</span>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <button
            id="btn-quick-sound"
            onClick={() => {
              soundManager.playButton();
              onToggleSound();
            }}
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            id="btn-quick-restart"
            onClick={() => {
              soundManager.playButton();
              onRestartRequest();
            }}
            title="Restart Match"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>

          <button
            id="btn-quick-pause"
            onClick={() => {
              soundManager.playButton();
              onPauseToggle();
            }}
            title="Pause Match (P / Space)"
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            <Pause size={14} />
            <span className="hidden sm:inline">PAUSE</span>
          </button>
        </div>
      </header>

      {/* Active Power-Ups Badges */}
      {activePowerUps.length > 0 && (
        <div
          id="active-powerups-hud"
          className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 pointer-events-none"
        >
          {activePowerUps.map((p) => (
            <div
              key={p.type}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/85 border text-xs font-mono tracking-wider backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 shadow-md"
              style={{ borderColor: p.color, color: p.color, boxShadow: `0 0 12px ${p.color}50` }}
            >
              <span>{p.label}</span>
              <span className="font-bold bg-white/15 px-1.5 py-0.5 rounded text-[10px] text-white">
                {p.timeLeft}s
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Power-Up Toast Notification */}
      {powerUpToast && (
        <div
          id="powerup-toast"
          className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-5 py-2 rounded-full bg-black/90 border font-['Orbitron'] text-xs font-bold tracking-wider uppercase animate-in fade-in zoom-in-90 duration-150 pointer-events-none"
          style={{
            borderColor: powerUpToast.color,
            color: powerUpToast.color,
            boxShadow: `0 0 25px ${powerUpToast.color}70`,
          }}
        >
          {powerUpToast.text}
        </div>
      )}

      {/* Goal Celebration Overlay Banner */}
      {goalBanner && (
        <div
          id="goal-celebration-banner"
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="text-center px-8 py-5 rounded-2xl bg-black/85 border-2 border-white/25 backdrop-blur-md shadow-[0_0_60px_rgba(0,240,255,0.4)]">
            <div
              className="font-['Orbitron'] text-4xl sm:text-6xl font-black tracking-wider"
              style={{ color: goalBanner.color, textShadow: `0 0 30px ${goalBanner.color}` }}
            >
              {goalBanner.text}
            </div>
            <div className="font-mono text-xs sm:text-sm text-cyan-300/90 tracking-widest mt-2 uppercase font-semibold">
              {goalBanner.subtitle || 'FIRST TO 7 • NEXT ROUND STARTING...'}
            </div>
          </div>
        </div>
      )}

      {/* Anti-Stuck Notice */}
      {recoveryNotice && (
        <div
          id="puck-recovery-banner"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-mono text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(0,240,255,0.4)] pointer-events-none"
        >
          ⚡ PUCK RE-SERVED TO CENTER
        </div>
      )}

      {/* Primary HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        id="syntrox-neon-canvas"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="w-full h-full cursor-crosshair touch-none select-none block"
      />

      {/* Subtle Bottom Controls Hint */}
      <footer className="absolute bottom-2 left-0 right-0 z-10 text-center pointer-events-none">
        <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">
          {orientation === 'horizontal'
            ? 'DESKTOP: MOUSE DRAG OR [WASD / ARROWS] TO DEFEND RIGHT HALF'
            : 'MOBILE: TOUCH & DRAG TO DEFEND LOWER HALF'}
        </span>
      </footer>
    </div>
  );
};
