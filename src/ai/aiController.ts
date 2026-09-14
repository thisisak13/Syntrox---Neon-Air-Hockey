// Intelligent Multi-Tier AI Controller for SYNTROX Neon Air Hockey
import { DifficultyMode, TableDimensions, PuckState, MalletState, TableOrientation } from '../types';

interface AIConfig {
  speed: number;
  reactionDelayFrames: number;
  predictionBounces: number;
  errorOffsetRange: number;
  aggression: number;
  interceptAnticipation: number;
}

const AI_PROFILES: Record<DifficultyMode, AIConfig> = {
  EASY: {
    speed: 10,
    reactionDelayFrames: 14, // ~230ms
    predictionBounces: 0,
    errorOffsetRange: 35,
    aggression: 0.35,
    interceptAnticipation: 0.2,
  },
  MEDIUM: {
    speed: 16,
    reactionDelayFrames: 6, // ~100ms
    predictionBounces: 1,
    errorOffsetRange: 15,
    aggression: 0.65,
    interceptAnticipation: 0.5,
  },
  HARD: {
    speed: 22,
    reactionDelayFrames: 2, // ~33ms
    predictionBounces: 2,
    errorOffsetRange: 4,
    aggression: 0.88,
    interceptAnticipation: 0.85,
  },
  UNBEATABLE: {
    speed: 27,
    reactionDelayFrames: 0, // Instantaneous
    predictionBounces: 4,
    errorOffsetRange: 0,
    aggression: 0.98,
    interceptAnticipation: 1.0,
  },
};

export class AIController {
  private mode: DifficultyMode;
  private config: AIConfig;
  private frameCount: number = 0;
  private delayedPuckHistory: { x: number; y: number; vx: number; vy: number }[] = [];

  constructor(mode: DifficultyMode) {
    this.mode = mode;
    this.config = AI_PROFILES[mode];
  }

  public setMode(mode: DifficultyMode) {
    this.mode = mode;
    this.config = AI_PROFILES[mode];
  }

  public getMode(): DifficultyMode {
    return this.mode;
  }

  public update(
    table: TableDimensions,
    puck: PuckState,
    aiMallet: MalletState,
    playerMallet: MalletState,
    orientation: TableOrientation = 'vertical'
  ): { targetX: number; targetY: number } {
    this.frameCount++;

    // Record delayed puck history for human-like reaction lag in Easy/Medium
    this.delayedPuckHistory.push({
      x: puck.x,
      y: puck.y,
      vx: puck.vx,
      vy: puck.vy,
    });

    const maxHistory = 30;
    if (this.delayedPuckHistory.length > maxHistory) {
      this.delayedPuckHistory.shift();
    }

    // Determine puck state to observe based on reaction lag
    const delayIndex = Math.max(0, this.delayedPuckHistory.length - 1 - this.config.reactionDelayFrames);
    const observedPuck = this.delayedPuckHistory[delayIndex] || puck;

    aiMallet.speed = this.config.speed;

    if (orientation === 'horizontal') {
      return this.updateHorizontal(table, observedPuck, puck, aiMallet, playerMallet);
    } else {
      return this.updateVertical(table, observedPuck, puck, aiMallet, playerMallet);
    }
  }

  // --------------------------------------------------------------------------
  // HORIZONTAL ORIENTATION (AI defends Left, Player defends Right)
  // --------------------------------------------------------------------------
  private updateHorizontal(
    table: TableDimensions,
    observedPuck: { x: number; y: number; vx: number; vy: number },
    realPuck: PuckState,
    aiMallet: MalletState,
    playerMallet: MalletState
  ): { targetX: number; targetY: number } {
    const midX = table.width / 2;
    const puckInAiHalf = observedPuck.x < midX;
    const puckMovingTowardAi = observedPuck.vx < 0;

    const homePosition = {
      x: table.width * 0.16,
      y: table.height / 2,
    };

    let targetX = homePosition.x;
    let targetY = homePosition.y;

    const isPuckNearCorner =
      observedPuck.x < 120 &&
      (observedPuck.y < 70 || observedPuck.y > table.height - 70);

    if (this.mode === 'UNBEATABLE') {
      const predicted = this.predictPuckTrajectoryHorizontal(
        observedPuck,
        table,
        this.config.predictionBounces,
        aiMallet.x
      );

      if (puckInAiHalf) {
        if (observedPuck.x > aiMallet.x + 8) {
          // Strike puck towards player's right goal
          const playerDefendingTop = playerMallet.y < table.height / 2;
          const targetGoalCornerY = playerDefendingTop
            ? (table.height + table.goalWidth) / 2 - 25 // aim bottom corner
            : (table.height - table.goalWidth) / 2 + 25; // aim top corner

          const strikeAngle = Math.atan2(
            targetGoalCornerY - observedPuck.y,
            table.width - observedPuck.x
          );

          targetX = observedPuck.x - Math.cos(strikeAngle) * (aiMallet.radius + realPuck.radius + 8);
          targetY = observedPuck.y - Math.sin(strikeAngle) * (aiMallet.radius + realPuck.radius + 8);

          targetX += Math.cos(strikeAngle) * 35;
          targetY += Math.sin(strikeAngle) * 35;
        } else {
          // Puck behind or beside AI: circle safely
          const side = observedPuck.y < aiMallet.y ? 1 : -1;
          targetX = Math.max(aiMallet.radius + 15, observedPuck.x - 25);
          targetY = Math.max(aiMallet.radius + 10, Math.min(table.height - aiMallet.radius - 10, observedPuck.y + side * (aiMallet.radius + 20)));
        }
      } else {
        if (puckMovingTowardAi && predicted) {
          targetY = predicted.y;
          targetX = Math.min(midX - aiMallet.radius - 15, Math.max(homePosition.x, predicted.x));
        } else {
          const goalCenterY = table.height / 2;
          const angleToPuck = Math.atan2(observedPuck.y - goalCenterY, observedPuck.x - 0);
          targetX = homePosition.x;
          targetY = goalCenterY + Math.sin(angleToPuck) * 60;
        }
      }
    } else if (this.mode === 'HARD') {
      const predicted = this.predictPuckTrajectoryHorizontal(
        observedPuck,
        table,
        this.config.predictionBounces,
        aiMallet.x
      );

      if (puckInAiHalf && observedPuck.x > aiMallet.x) {
        const aimOffset = playerMallet.y > table.height / 2 ? -40 : 40;
        targetX = observedPuck.x + 12;
        targetY = observedPuck.y + aimOffset * 0.3;
      } else if (puckMovingTowardAi && predicted) {
        targetX = homePosition.x + 15;
        targetY = predicted.y;
      } else {
        targetX = homePosition.x;
        targetY = (table.height / 2 + observedPuck.y) / 2;
      }
    } else if (this.mode === 'MEDIUM') {
      const predicted = this.predictPuckTrajectoryHorizontal(
        observedPuck,
        table,
        this.config.predictionBounces,
        aiMallet.x
      );

      if (puckInAiHalf && observedPuck.x > aiMallet.x + 15) {
        targetX = observedPuck.x + 8;
        targetY = observedPuck.y;
      } else if (puckMovingTowardAi && predicted) {
        targetX = homePosition.x;
        targetY = predicted.y;
      } else {
        targetX = homePosition.x;
        targetY = (homePosition.y + observedPuck.y * 0.5) / 1.5;
      }
    } else {
      // EASY
      if (puckInAiHalf && observedPuck.x > aiMallet.x + 30) {
        targetX = observedPuck.x;
        targetY = observedPuck.y;
      } else if (puckMovingTowardAi) {
        targetX = homePosition.x;
        targetY = observedPuck.y;
      } else {
        targetX = homePosition.x;
        targetY = homePosition.y;
      }
    }

    if (isPuckNearCorner && puckInAiHalf) {
      const innerY = observedPuck.y < table.height / 2 ? observedPuck.y + 45 : observedPuck.y - 45;
      targetX = observedPuck.x + 30;
      targetY = innerY;
    }

    if (this.config.errorOffsetRange > 0 && Math.random() < 0.15) {
      targetY += (Math.random() - 0.5) * this.config.errorOffsetRange;
    }

    const padding = aiMallet.radius + 6;
    targetX = Math.max(padding, Math.min(midX - padding - 8, targetX));
    targetY = Math.max(padding, Math.min(table.height - padding, targetY));

    return { targetX, targetY };
  }

  // --------------------------------------------------------------------------
  // VERTICAL ORIENTATION (AI defends Top, Player defends Bottom)
  // --------------------------------------------------------------------------
  private updateVertical(
    table: TableDimensions,
    observedPuck: { x: number; y: number; vx: number; vy: number },
    realPuck: PuckState,
    aiMallet: MalletState,
    playerMallet: MalletState
  ): { targetX: number; targetY: number } {
    const midY = table.height / 2;
    const puckInAiHalf = observedPuck.y < midY;
    const puckMovingTowardAi = observedPuck.vy < 0;

    const homePosition = {
      x: table.width / 2,
      y: table.height * 0.16,
    };

    let targetX = homePosition.x;
    let targetY = homePosition.y;

    const isPuckNearCorner =
      (observedPuck.x < 70 || observedPuck.x > table.width - 70) &&
      observedPuck.y < 120;

    if (this.mode === 'UNBEATABLE') {
      const predicted = this.predictPuckTrajectoryVertical(
        observedPuck,
        table,
        this.config.predictionBounces,
        aiMallet.y
      );

      if (puckInAiHalf) {
        if (observedPuck.y > aiMallet.y + 8) {
          const playerDefendingLeft = playerMallet.x < table.width / 2;
          const targetGoalCornerX = playerDefendingLeft
            ? (table.width + table.goalWidth) / 2 - 25
            : (table.width - table.goalWidth) / 2 + 25;

          const strikeAngle = Math.atan2(
            table.height - observedPuck.y,
            targetGoalCornerX - observedPuck.x
          );

          targetX = observedPuck.x - Math.cos(strikeAngle) * (aiMallet.radius + realPuck.radius + 8);
          targetY = observedPuck.y - Math.sin(strikeAngle) * (aiMallet.radius + realPuck.radius + 8);

          targetX += Math.cos(strikeAngle) * 35;
          targetY += Math.sin(strikeAngle) * 35;
        } else {
          const side = observedPuck.x < aiMallet.x ? 1 : -1;
          targetX = Math.max(aiMallet.radius + 10, Math.min(table.width - aiMallet.radius - 10, observedPuck.x + side * (aiMallet.radius + 20)));
          targetY = Math.max(aiMallet.radius + 15, observedPuck.y - 25);
        }
      } else {
        if (puckMovingTowardAi && predicted) {
          targetX = predicted.x;
          targetY = Math.min(midY - aiMallet.radius - 15, Math.max(homePosition.y, predicted.y));
        } else {
          const goalCenterX = table.width / 2;
          const angleToPuck = Math.atan2(observedPuck.y - 0, observedPuck.x - goalCenterX);
          targetX = goalCenterX + Math.cos(angleToPuck) * 60;
          targetY = homePosition.y;
        }
      }
    } else if (this.mode === 'HARD') {
      const predicted = this.predictPuckTrajectoryVertical(
        observedPuck,
        table,
        this.config.predictionBounces,
        aiMallet.y
      );

      if (puckInAiHalf && observedPuck.y > aiMallet.y) {
        const aimOffset = playerMallet.x > table.width / 2 ? -40 : 40;
        targetX = observedPuck.x + aimOffset * 0.3;
        targetY = observedPuck.y + 12;
      } else if (puckMovingTowardAi && predicted) {
        targetX = predicted.x;
        targetY = homePosition.y + 15;
      } else {
        targetX = (table.width / 2 + observedPuck.x) / 2;
        targetY = homePosition.y;
      }
    } else if (this.mode === 'MEDIUM') {
      const predicted = this.predictPuckTrajectoryVertical(
        observedPuck,
        table,
        this.config.predictionBounces,
        aiMallet.y
      );

      if (puckInAiHalf && observedPuck.y > aiMallet.y + 15) {
        targetX = observedPuck.x;
        targetY = observedPuck.y + 8;
      } else if (puckMovingTowardAi && predicted) {
        targetX = predicted.x;
        targetY = homePosition.y;
      } else {
        targetX = (homePosition.x + observedPuck.x * 0.5) / 1.5;
        targetY = homePosition.y;
      }
    } else {
      // EASY
      if (puckInAiHalf && observedPuck.y > aiMallet.y + 30) {
        targetX = observedPuck.x;
        targetY = observedPuck.y;
      } else if (puckMovingTowardAi) {
        targetX = observedPuck.x;
        targetY = homePosition.y;
      } else {
        targetX = homePosition.x;
        targetY = homePosition.y;
      }
    }

    if (isPuckNearCorner && puckInAiHalf) {
      const innerX = observedPuck.x < table.width / 2 ? observedPuck.x + 45 : observedPuck.x - 45;
      targetX = innerX;
      targetY = observedPuck.y + 30;
    }

    if (this.config.errorOffsetRange > 0 && Math.random() < 0.15) {
      targetX += (Math.random() - 0.5) * this.config.errorOffsetRange;
    }

    const padding = aiMallet.radius + 6;
    targetX = Math.max(padding, Math.min(table.width - padding, targetX));
    targetY = Math.max(padding, Math.min(midY - padding - 8, targetY));

    return { targetX, targetY };
  }

  // Predict trajectory for Vertical orientation
  private predictPuckTrajectoryVertical(
    puck: { x: number; y: number; vx: number; vy: number },
    table: TableDimensions,
    maxBounces: number,
    targetY: number
  ): { x: number; y: number } | null {
    if (puck.vy >= 0) return null;

    let simX = puck.x;
    let simY = puck.y;
    let simVx = puck.vx;
    let simVy = puck.vy;
    const r = 22;

    let bounces = 0;
    const maxSteps = 120;

    for (let i = 0; i < maxSteps; i++) {
      simX += simVx;
      simY += simVy;

      if (simX - r < 0) {
        simX = r;
        simVx = -simVx;
        bounces++;
      } else if (simX + r > table.width) {
        simX = table.width - r;
        simVx = -simVx;
        bounces++;
      }

      if (bounces > maxBounces) break;

      if (simY <= targetY) {
        return { x: simX, y: simY };
      }
    }

    return { x: Math.max(r, Math.min(table.width - r, simX)), y: targetY };
  }

  // Predict trajectory for Horizontal orientation
  private predictPuckTrajectoryHorizontal(
    puck: { x: number; y: number; vx: number; vy: number },
    table: TableDimensions,
    maxBounces: number,
    targetX: number
  ): { x: number; y: number } | null {
    if (puck.vx >= 0) return null;

    let simX = puck.x;
    let simY = puck.y;
    let simVx = puck.vx;
    let simVy = puck.vy;
    const r = 22;

    let bounces = 0;
    const maxSteps = 120;

    for (let i = 0; i < maxSteps; i++) {
      simX += simVx;
      simY += simVy;

      if (simY - r < 0) {
        simY = r;
        simVy = -simVy;
        bounces++;
      } else if (simY + r > table.height) {
        simY = table.height - r;
        simVy = -simVy;
        bounces++;
      }

      if (bounces > maxBounces) break;

      if (simX <= targetX) {
        return { x: simX, y: simY };
      }
    }

    return { x: targetX, y: Math.max(r, Math.min(table.height - r, simY)) };
  }
}
