// Authoritative Physics Engine for SYNTROX Neon Air Hockey
import { TableDimensions, PuckState, MalletState, TableOrientation, PowerUpItem, PowerUpType } from '../types';

export interface CollisionEvent {
  type: 'WALL' | 'MALLET_PLAYER' | 'MALLET_AI' | 'GOAL_PLAYER' | 'GOAL_AI' | 'RECOVERY' | 'SHIELD_BOUNCE' | 'POWERUP_COLLECT';
  speedIntensity: number;
  x: number;
  y: number;
  powerUp?: PowerUpItem;
}

export class PhysicsEngine {
  public orientation: TableOrientation = 'vertical';

  public table: TableDimensions = {
    width: 600,
    height: 1000,
    goalWidth: 220,
    goalDepth: 30,
    cornerCut: 40,
  };

  public puck: PuckState;
  public playerMallet: MalletState;
  public aiMallet: MalletState;

  // Crucial goal lock to prevent duplicate multi-goal triggers per round
  public isGoalLocked: boolean = false;

  // Power-up state
  public powerUps: PowerUpItem[] = [];
  public isGoalShieldActive: boolean = false;
  public isHyperShotActive: boolean = false;
  public isMegaMalletActive: boolean = false;
  public isEmpFreezeActive: boolean = false;

  // Stagnation / anti-stuck detector
  private stuckTimer: number = 0;
  private readonly STUCK_SPEED_THRESHOLD = 0.8; // px per frame
  private readonly STUCK_FRAMES_TRIGGER = 90; // ~1.5s at 60fps

  // Goal post radius
  public readonly GOAL_POST_RADIUS = 10;
  public readonly MALLET_RADIUS = 38;
  public readonly PUCK_RADIUS = 22;
  public readonly PUCK_MAX_SPEED = 28;
  public readonly PUCK_MIN_SPEED = 0.05;

  constructor(initialOrientation: TableOrientation = 'vertical') {
    this.orientation = initialOrientation;
    this.updateTableDimensions();

    this.puck = {
      x: this.table.width / 2,
      y: this.table.height / 2,
      vx: 0,
      vy: 0,
      radius: this.PUCK_RADIUS,
      maxSpeed: this.PUCK_MAX_SPEED,
      trail: [],
    };

    this.playerMallet = {
      x: this.orientation === 'horizontal' ? this.table.width * 0.82 : this.table.width / 2,
      y: this.orientation === 'horizontal' ? this.table.height / 2 : this.table.height * 0.82,
      vx: 0,
      vy: 0,
      radius: this.MALLET_RADIUS,
      targetX: this.orientation === 'horizontal' ? this.table.width * 0.82 : this.table.width / 2,
      targetY: this.orientation === 'horizontal' ? this.table.height / 2 : this.table.height * 0.82,
      speed: 25,
    };

    this.aiMallet = {
      x: this.orientation === 'horizontal' ? this.table.width * 0.18 : this.table.width / 2,
      y: this.orientation === 'horizontal' ? this.table.height / 2 : this.table.height * 0.18,
      vx: 0,
      vy: 0,
      radius: this.MALLET_RADIUS,
      targetX: this.orientation === 'horizontal' ? this.table.width * 0.18 : this.table.width / 2,
      targetY: this.orientation === 'horizontal' ? this.table.height / 2 : this.table.height * 0.18,
      speed: 18,
    };
  }

  public setOrientation(newOrientation: TableOrientation) {
    if (this.orientation === newOrientation) return;
    this.orientation = newOrientation;
    this.updateTableDimensions();
    this.resetPositions();
  }

  private updateTableDimensions() {
    if (this.orientation === 'horizontal') {
      this.table = {
        width: 1000,
        height: 600,
        goalWidth: 220,
        goalDepth: 30,
        cornerCut: 40,
      };
    } else {
      this.table = {
        width: 600,
        height: 1000,
        goalWidth: 220,
        goalDepth: 30,
        cornerCut: 40,
      };
    }
  }

  public resetPuck(servingTowardsPlayer: boolean = false) {
    this.isGoalLocked = false;
    this.puck.x = this.table.width / 2;
    this.puck.y = this.table.height / 2;
    this.puck.trail = [];
    this.stuckTimer = 0;

    const angleOffset = (Math.random() - 0.5) * 0.6;
    const initialSpeed = 5;

    if (this.orientation === 'horizontal') {
      // Horizontal: Towards player = +X, Towards AI = -X
      const dir = servingTowardsPlayer ? 1 : -1;
      this.puck.vx = Math.cos(angleOffset) * initialSpeed * dir;
      this.puck.vy = Math.sin(angleOffset) * initialSpeed;
    } else {
      // Vertical: Towards player = +Y, Towards AI = -Y
      const dir = servingTowardsPlayer ? 1 : -1;
      this.puck.vx = Math.sin(angleOffset) * initialSpeed;
      this.puck.vy = Math.cos(angleOffset) * initialSpeed * dir;
    }
  }

  public resetPositions() {
    this.resetPuck();

    if (this.orientation === 'horizontal') {
      this.playerMallet.x = this.table.width * 0.82;
      this.playerMallet.y = this.table.height / 2;
      this.playerMallet.vx = 0;
      this.playerMallet.vy = 0;
      this.playerMallet.targetX = this.playerMallet.x;
      this.playerMallet.targetY = this.playerMallet.y;

      this.aiMallet.x = this.table.width * 0.18;
      this.aiMallet.y = this.table.height / 2;
      this.aiMallet.vx = 0;
      this.aiMallet.vy = 0;
      this.aiMallet.targetX = this.aiMallet.x;
      this.aiMallet.targetY = this.aiMallet.y;
    } else {
      this.playerMallet.x = this.table.width / 2;
      this.playerMallet.y = this.table.height * 0.82;
      this.playerMallet.vx = 0;
      this.playerMallet.vy = 0;
      this.playerMallet.targetX = this.playerMallet.x;
      this.playerMallet.targetY = this.playerMallet.y;

      this.aiMallet.x = this.table.width / 2;
      this.aiMallet.y = this.table.height * 0.18;
      this.aiMallet.vx = 0;
      this.aiMallet.vy = 0;
      this.aiMallet.targetX = this.aiMallet.x;
      this.aiMallet.targetY = this.aiMallet.y;
    }

    this.stuckTimer = 0;
  }

  public setPlayerTarget(targetX: number, targetY: number) {
    if (this.orientation === 'horizontal') {
      // Player defends right half (x > width / 2)
      const minX = this.table.width / 2 + this.playerMallet.radius;
      const maxX = this.table.width - this.playerMallet.radius - 8;
      const minY = this.playerMallet.radius + 8;
      const maxY = this.table.height - this.playerMallet.radius - 8;

      this.playerMallet.targetX = Math.max(minX, Math.min(maxX, targetX));
      this.playerMallet.targetY = Math.max(minY, Math.min(maxY, targetY));
    } else {
      // Player defends lower half (y > height / 2)
      const minX = this.playerMallet.radius + 8;
      const maxX = this.table.width - this.playerMallet.radius - 8;
      const minY = this.table.height / 2 + this.playerMallet.radius;
      const maxY = this.table.height - this.playerMallet.radius - 8;

      this.playerMallet.targetX = Math.max(minX, Math.min(maxX, targetX));
      this.playerMallet.targetY = Math.max(minY, Math.min(maxY, targetY));
    }
  }

  public setAiTarget(targetX: number, targetY: number) {
    if (this.orientation === 'horizontal') {
      // AI defends left half (x < width / 2)
      const minX = this.aiMallet.radius + 8;
      const maxX = this.table.width / 2 - this.aiMallet.radius;
      const minY = this.aiMallet.radius + 8;
      const maxY = this.table.height - this.aiMallet.radius - 8;

      this.aiMallet.targetX = Math.max(minX, Math.min(maxX, targetX));
      this.aiMallet.targetY = Math.max(minY, Math.min(maxY, targetY));
    } else {
      // AI defends upper half (y < height / 2)
      const minX = this.aiMallet.radius + 8;
      const maxX = this.table.width - this.aiMallet.radius - 8;
      const minY = this.aiMallet.radius + 8;
      const maxY = this.table.height / 2 - this.aiMallet.radius;

      this.aiMallet.targetX = Math.max(minX, Math.min(maxX, targetX));
      this.aiMallet.targetY = Math.max(minY, Math.min(maxY, targetY));
    }
  }

  public update(isPlayActive: boolean): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    // Dynamically adjust player mallet radius based on MEGA_MALLET
    this.playerMallet.radius = this.isMegaMalletActive ? 52 : this.MALLET_RADIUS;

    // 1. Move Player Mallet smoothly towards target
    const prevPlayerX = this.playerMallet.x;
    const prevPlayerY = this.playerMallet.y;
    const dxP = this.playerMallet.targetX - this.playerMallet.x;
    const dyP = this.playerMallet.targetY - this.playerMallet.y;
    const distP = Math.hypot(dxP, dyP);

    if (distP > 0.1) {
      const moveDist = Math.min(distP, this.playerMallet.speed);
      this.playerMallet.x += (dxP / distP) * moveDist;
      this.playerMallet.y += (dyP / distP) * moveDist;
    } else {
      this.playerMallet.x = this.playerMallet.targetX;
      this.playerMallet.y = this.playerMallet.targetY;
    }
    this.playerMallet.vx = this.playerMallet.x - prevPlayerX;
    this.playerMallet.vy = this.playerMallet.y - prevPlayerY;

    // 2. Move AI Mallet towards target (slowed if EMP_FREEZE active)
    const effectiveAiSpeed = this.isEmpFreezeActive ? Math.max(4, this.aiMallet.speed * 0.35) : this.aiMallet.speed;
    const prevAiX = this.aiMallet.x;
    const prevAiY = this.aiMallet.y;
    const dxAi = this.aiMallet.targetX - this.aiMallet.x;
    const dyAi = this.aiMallet.targetY - this.aiMallet.y;
    const distAi = Math.hypot(dxAi, dyAi);

    if (distAi > 0.1) {
      const moveDist = Math.min(distAi, effectiveAiSpeed);
      this.aiMallet.x += (dxAi / distAi) * moveDist;
      this.aiMallet.y += (dyAi / distAi) * moveDist;
    } else {
      this.aiMallet.x = this.aiMallet.targetX;
      this.aiMallet.y = this.aiMallet.targetY;
    }
    this.aiMallet.vx = this.aiMallet.x - prevAiX;
    this.aiMallet.vy = this.aiMallet.y - prevAiY;

    if (!isPlayActive) {
      return events;
    }

    // 3. Puck sub-stepping continuous collision detection
    const puckSpeed = Math.hypot(this.puck.vx, this.puck.vy);
    const subSteps = Math.max(3, Math.min(8, Math.ceil(puckSpeed / 4)));
    const dt = 1 / subSteps;

    const isH = this.orientation === 'horizontal';
    const goalStart = isH
      ? (this.table.height - this.table.goalWidth) / 2
      : (this.table.width - this.table.goalWidth) / 2;
    const goalEnd = isH
      ? (this.table.height + this.table.goalWidth) / 2
      : (this.table.width + this.table.goalWidth) / 2;

    for (let step = 0; step < subSteps; step++) {
      if (this.isGoalLocked) break;

      this.puck.x += this.puck.vx * dt;
      this.puck.y += this.puck.vy * dt;

      // Mallet collisions
      const playerHit = this.resolveMalletCollision(this.playerMallet);
      if (playerHit) {
        events.push({
          type: 'MALLET_PLAYER',
          speedIntensity: Math.min(1, Math.hypot(this.puck.vx, this.puck.vy) / this.PUCK_MAX_SPEED),
          x: this.puck.x,
          y: this.puck.y,
        });
      }

      const aiHit = this.resolveMalletCollision(this.aiMallet);
      if (aiHit) {
        events.push({
          type: 'MALLET_AI',
          speedIntensity: Math.min(1, Math.hypot(this.puck.vx, this.puck.vy) / this.PUCK_MAX_SPEED),
          x: this.puck.x,
          y: this.puck.y,
        });
      }

      // Check Goal detection
      if (!this.isGoalLocked) {
        if (isH) {
          // Horizontal:
          // Left goal (AI goal) -> Player scores!
          if (this.puck.x - this.puck.radius <= 0) {
            if (this.puck.y >= goalStart + 4 && this.puck.y <= goalEnd - 4) {
              if (this.puck.x < -8) {
                this.isGoalLocked = true;
                this.puck.vx = 0;
                this.puck.vy = 0;
                events.push({
                  type: 'GOAL_PLAYER',
                  speedIntensity: 1,
                  x: 0,
                  y: this.puck.y,
                });
                return events;
              }
            }
          }

          // Right goal (Player goal) -> Protected by GOAL_SHIELD or AI scores!
          if (this.puck.x + this.puck.radius >= this.table.width - 4) {
            if (this.puck.y >= goalStart - 4 && this.puck.y <= goalEnd + 4) {
              if (this.isGoalShieldActive) {
                // Shield deflects the puck!
                this.puck.x = this.table.width - this.puck.radius - 8;
                this.puck.vx = -Math.max(10, Math.abs(this.puck.vx) * 1.15);
                events.push({
                  type: 'SHIELD_BOUNCE',
                  speedIntensity: 1,
                  x: this.table.width,
                  y: this.puck.y,
                });
              } else if (this.puck.x > this.table.width + 8) {
                this.isGoalLocked = true;
                this.puck.vx = 0;
                this.puck.vy = 0;
                events.push({
                  type: 'GOAL_AI',
                  speedIntensity: 1,
                  x: this.table.width,
                  y: this.puck.y,
                });
                return events;
              }
            }
          }
        } else {
          // Vertical:
          // Top goal (AI goal) -> Player scores!
          if (this.puck.y - this.puck.radius <= 0) {
            if (this.puck.x >= goalStart + 4 && this.puck.x <= goalEnd - 4) {
              if (this.puck.y < -8) {
                this.isGoalLocked = true;
                this.puck.vx = 0;
                this.puck.vy = 0;
                events.push({
                  type: 'GOAL_PLAYER',
                  speedIntensity: 1,
                  x: this.puck.x,
                  y: 0,
                });
                return events;
              }
            }
          }

          // Bottom goal (Player goal) -> Protected by GOAL_SHIELD or AI scores!
          if (this.puck.y + this.puck.radius >= this.table.height - 4) {
            if (this.puck.x >= goalStart - 4 && this.puck.x <= goalEnd + 4) {
              if (this.isGoalShieldActive) {
                // Shield deflects the puck!
                this.puck.y = this.table.height - this.puck.radius - 8;
                this.puck.vy = -Math.max(10, Math.abs(this.puck.vy) * 1.15);
                events.push({
                  type: 'SHIELD_BOUNCE',
                  speedIntensity: 1,
                  x: this.puck.x,
                  y: this.table.height,
                });
              } else if (this.puck.y > this.table.height + 8) {
                this.isGoalLocked = true;
                this.puck.vx = 0;
                this.puck.vy = 0;
                events.push({
                  type: 'GOAL_AI',
                  speedIntensity: 1,
                  x: this.puck.x,
                  y: this.table.height,
                });
                return events;
              }
            }
          }
        }
      }

      // Wall & Post collisions
      const wallHit = this.resolveWallAndPostCollisions(goalStart, goalEnd);
      if (wallHit) {
        events.push({
          type: 'WALL',
          speedIntensity: Math.min(1, Math.hypot(this.puck.vx, this.puck.vy) / 18),
          x: this.puck.x,
          y: this.puck.y,
        });
      }
    }

    // 4. Power-up collection checks
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      const distPuck = Math.hypot(this.puck.x - p.x, this.puck.y - p.y);
      const distPlayer = Math.hypot(this.playerMallet.x - p.x, this.playerMallet.y - p.y);

      if (distPuck <= this.puck.radius + p.radius || distPlayer <= this.playerMallet.radius + p.radius) {
        const collected = this.powerUps.splice(i, 1)[0];
        events.push({
          type: 'POWERUP_COLLECT',
          speedIntensity: 1,
          x: p.x,
          y: p.y,
          powerUp: collected,
        });
      }
    }

    if (this.isGoalLocked) {
      return events;
    }

    // 4. Air friction damping
    this.puck.vx *= 0.9985;
    this.puck.vy *= 0.9985;

    // Clamp puck speed
    const curSpeed = Math.hypot(this.puck.vx, this.puck.vy);
    if (curSpeed > this.puck.maxSpeed) {
      this.puck.vx = (this.puck.vx / curSpeed) * this.puck.maxSpeed;
      this.puck.vy = (this.puck.vy / curSpeed) * this.puck.maxSpeed;
    }

    // 5. Update puck visual trail
    this.puck.trail.unshift({ x: this.puck.x, y: this.puck.y, alpha: 0.8 });
    if (this.puck.trail.length > 7) {
      this.puck.trail.pop();
    }
    for (const pt of this.puck.trail) {
      pt.alpha *= 0.82;
    }

    // 6. Anti-Stuck & Anti-Trap Recovery System
    if (curSpeed < this.STUCK_SPEED_THRESHOLD) {
      this.stuckTimer++;
      if (this.stuckTimer >= this.STUCK_FRAMES_TRIGGER) {
        this.puck.x = this.table.width / 2;
        this.puck.y = this.table.height / 2;

        if (this.orientation === 'horizontal') {
          const dirX = Math.random() > 0.5 ? 1 : -1;
          this.puck.vx = dirX * 6;
          this.puck.vy = (Math.random() - 0.5) * 3;
        } else {
          const dirY = Math.random() > 0.5 ? 1 : -1;
          this.puck.vx = (Math.random() - 0.5) * 3;
          this.puck.vy = dirY * 6;
        }

        this.stuckTimer = 0;
        events.push({
          type: 'RECOVERY',
          speedIntensity: 0.5,
          x: this.puck.x,
          y: this.puck.y,
        });
      }
    } else {
      this.stuckTimer = 0;
    }

    // Safeguard boundary clamping
    if (isH) {
      if (this.puck.y < this.puck.radius) this.puck.y = this.puck.radius;
      if (this.puck.y > this.table.height - this.puck.radius) this.puck.y = this.table.height - this.puck.radius;
    } else {
      if (this.puck.x < this.puck.radius) this.puck.x = this.puck.radius;
      if (this.puck.x > this.table.width - this.puck.radius) this.puck.x = this.table.width - this.puck.radius;
    }

    return events;
  }

  private resolveMalletCollision(mallet: MalletState): boolean {
    const dx = this.puck.x - mallet.x;
    const dy = this.puck.y - mallet.y;
    const dist = Math.hypot(dx, dy);
    const minDist = this.puck.radius + mallet.radius;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      // Position correction to prevent overlap sticking
      this.puck.x += nx * (overlap + 0.5);
      this.puck.y += ny * (overlap + 0.5);

      // Relative velocity
      const rvx = this.puck.vx - mallet.vx;
      const rvy = this.puck.vy - mallet.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const restitution = 1.08; // Energetic impulse
        const impulseMag = -(1 + restitution) * velAlongNormal;

        this.puck.vx += nx * impulseMag;
        this.puck.vy += ny * impulseMag;

        // Impart mallet swing momentum
        const malletSpeed = Math.hypot(mallet.vx, mallet.vy);
        if (malletSpeed > 1) {
          this.puck.vx += mallet.vx * 0.45;
          this.puck.vy += mallet.vy * 0.45;
        }

        // Add minimum rebound impulse to avoid dead puck
        const postSpeed = Math.hypot(this.puck.vx, this.puck.vy);
        if (postSpeed < 4) {
          this.puck.vx = nx * 5;
          this.puck.vy = ny * 5;
        }

        // Apply HYPER_SHOT extra kinetic boost if player hits
        if (mallet === this.playerMallet && this.isHyperShotActive) {
          this.puck.vx *= 1.45;
          this.puck.vy *= 1.45;
          const boostedSpd = Math.hypot(this.puck.vx, this.puck.vy);
          if (boostedSpd > 36) {
            this.puck.vx = (this.puck.vx / boostedSpd) * 36;
            this.puck.vy = (this.puck.vy / boostedSpd) * 36;
          }
        }

        return true;
      }
    }
    return false;
  }

  private resolveWallAndPostCollisions(goalStart: number, goalEnd: number): boolean {
    let hit = false;
    const r = this.puck.radius;
    const bounce = 0.94;
    const cut = this.table.cornerCut;
    const isH = this.orientation === 'horizontal';

    if (isH) {
      // ----------------------------------------------------
      // HORIZONTAL TABLE (Goals on Left and Right)
      // ----------------------------------------------------
      // Top & Bottom continuous walls
      if (this.puck.y - r < 0) {
        this.puck.y = r;
        this.puck.vy = -this.puck.vy * bounce;
        hit = true;
      } else if (this.puck.y + r > this.table.height) {
        this.puck.y = this.table.height - r;
        this.puck.vy = -this.puck.vy * bounce;
        hit = true;
      }

      // Left Wall (Above and Below Left Goal)
      if (this.puck.x - r < 0) {
        const outsideGoal = this.puck.y < goalStart || this.puck.y > goalEnd;
        if (outsideGoal) {
          this.puck.x = r;
          this.puck.vx = -this.puck.vx * bounce;
          hit = true;
        }
      }

      // Right Wall (Above and Below Right Goal)
      if (this.puck.x + r > this.table.width) {
        const outsideGoal = this.puck.y < goalStart || this.puck.y > goalEnd;
        if (outsideGoal) {
          this.puck.x = this.table.width - r;
          this.puck.vx = -this.puck.vx * bounce;
          hit = true;
        }
      }

      // Corner Chamfers (45-degree corner bumpers)
      if (this.puck.x + this.puck.y < cut + r) {
        const normalX = 0.7071;
        const normalY = 0.7071;
        const penetration = (cut + r) - (this.puck.x + this.puck.y);
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }
      if ((this.table.width - this.puck.x) + this.puck.y < cut + r) {
        const normalX = -0.7071;
        const normalY = 0.7071;
        const penetration = (cut + r) - ((this.table.width - this.puck.x) + this.puck.y);
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }
      if (this.puck.x + (this.table.height - this.puck.y) < cut + r) {
        const normalX = 0.7071;
        const normalY = -0.7071;
        const penetration = (cut + r) - (this.puck.x + (this.table.height - this.puck.y));
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }
      if ((this.table.width - this.puck.x) + (this.table.height - this.puck.y) < cut + r) {
        const normalX = -0.7071;
        const normalY = -0.7071;
        const penetration = (cut + r) - ((this.table.width - this.puck.x) + (this.table.height - this.puck.y));
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }

      // Goal Post Collisions (Left & Right posts)
      const posts = [
        { x: 0, y: goalStart },
        { x: 0, y: goalEnd },
        { x: this.table.width, y: goalStart },
        { x: this.table.width, y: goalEnd },
      ];

      for (const post of posts) {
        const dx = this.puck.x - post.x;
        const dy = this.puck.y - post.y;
        const dist = Math.hypot(dx, dy);
        const minDist = r + this.GOAL_POST_RADIUS;

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          this.puck.x += nx * (overlap + 0.5);
          this.puck.y += ny * (overlap + 0.5);

          const dot = this.puck.vx * nx + this.puck.vy * ny;
          if (dot < 0) {
            this.puck.vx -= 2 * dot * nx * bounce;
            this.puck.vy -= 2 * dot * ny * bounce;
            hit = true;
          }
        }
      }
    } else {
      // ----------------------------------------------------
      // VERTICAL TABLE (Goals on Top and Bottom)
      // ----------------------------------------------------
      // Left & Right continuous walls
      if (this.puck.x - r < 0) {
        this.puck.x = r;
        this.puck.vx = -this.puck.vx * bounce;
        hit = true;
      } else if (this.puck.x + r > this.table.width) {
        this.puck.x = this.table.width - r;
        this.puck.vx = -this.puck.vx * bounce;
        hit = true;
      }

      // Corner Chamfers
      if (this.puck.x + this.puck.y < cut + r) {
        const normalX = 0.7071;
        const normalY = 0.7071;
        const penetration = (cut + r) - (this.puck.x + this.puck.y);
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }
      if ((this.table.width - this.puck.x) + this.puck.y < cut + r) {
        const normalX = -0.7071;
        const normalY = 0.7071;
        const penetration = (cut + r) - ((this.table.width - this.puck.x) + this.puck.y);
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }
      if (this.puck.x + (this.table.height - this.puck.y) < cut + r) {
        const normalX = 0.7071;
        const normalY = -0.7071;
        const penetration = (cut + r) - (this.puck.x + (this.table.height - this.puck.y));
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }
      if ((this.table.width - this.puck.x) + (this.table.height - this.puck.y) < cut + r) {
        const normalX = -0.7071;
        const normalY = -0.7071;
        const penetration = (cut + r) - ((this.table.width - this.puck.x) + (this.table.height - this.puck.y));
        this.puck.x += normalX * penetration;
        this.puck.y += normalY * penetration;
        const dot = this.puck.vx * normalX + this.puck.vy * normalY;
        if (dot < 0) {
          this.puck.vx -= 2 * dot * normalX * bounce;
          this.puck.vy -= 2 * dot * normalY * bounce;
          hit = true;
        }
      }

      // Top Wall (Outside Goal)
      if (this.puck.y - r < 0) {
        const outsideGoal = this.puck.x < goalStart || this.puck.x > goalEnd;
        if (outsideGoal) {
          this.puck.y = r;
          this.puck.vy = -this.puck.vy * bounce;
          hit = true;
        }
      }

      // Bottom Wall (Outside Goal)
      if (this.puck.y + r > this.table.height) {
        const outsideGoal = this.puck.x < goalStart || this.puck.x > goalEnd;
        if (outsideGoal) {
          this.puck.y = this.table.height - r;
          this.puck.vy = -this.puck.vy * bounce;
          hit = true;
        }
      }

      // Goal Posts (Top & Bottom)
      const posts = [
        { x: goalStart, y: 0 },
        { x: goalEnd, y: 0 },
        { x: goalStart, y: this.table.height },
        { x: goalEnd, y: this.table.height },
      ];

      for (const post of posts) {
        const dx = this.puck.x - post.x;
        const dy = this.puck.y - post.y;
        const dist = Math.hypot(dx, dy);
        const minDist = r + this.GOAL_POST_RADIUS;

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          this.puck.x += nx * (overlap + 0.5);
          this.puck.y += ny * (overlap + 0.5);

          const dot = this.puck.vx * nx + this.puck.vy * ny;
          if (dot < 0) {
            this.puck.vx -= 2 * dot * nx * bounce;
            this.puck.vy -= 2 * dot * ny * bounce;
            hit = true;
          }
        }
      }
    }

    return hit;
  }

  public spawnPowerUp(): PowerUpItem | null {
    if (this.powerUps.length >= 2) return null;

    const types: { type: PowerUpType; label: string; color: string; duration: number }[] = [
      { type: 'MEGA_MALLET', label: 'MEGA MALLET', color: '#00f0ff', duration: 10 },
      { type: 'HYPER_SHOT', label: 'HYPER SHOT', color: '#ffb703', duration: 10 },
      { type: 'GOAL_SHIELD', label: 'GOAL SHIELD', color: '#00ff88', duration: 8 },
      { type: 'EMP_FREEZE', label: 'EMP FREEZE', color: '#c084fc', duration: 6 },
    ];

    const pick = types[Math.floor(Math.random() * types.length)];
    const isH = this.orientation === 'horizontal';

    let spawnX: number;
    let spawnY: number;

    if (isH) {
      // Horizontal: spawn towards center and right half so player can reach it
      spawnX = this.table.width * 0.38 + Math.random() * (this.table.width * 0.38);
      spawnY = this.table.height * 0.18 + Math.random() * (this.table.height * 0.64);
    } else {
      // Vertical: spawn towards center and bottom half so player can reach it
      spawnX = this.table.width * 0.18 + Math.random() * (this.table.width * 0.64);
      spawnY = this.table.height * 0.38 + Math.random() * (this.table.height * 0.38);
    }

    const item: PowerUpItem = {
      id: `pwr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: pick.type,
      x: spawnX,
      y: spawnY,
      radius: 20,
      duration: pick.duration,
      color: pick.color,
      label: pick.label,
      spawnTime: Date.now(),
    };

    this.powerUps.push(item);
    return item;
  }

  public clearPowerUps() {
    this.powerUps = [];
    this.isGoalShieldActive = false;
    this.isHyperShotActive = false;
    this.isMegaMalletActive = false;
    this.isEmpFreezeActive = false;
    this.playerMallet.radius = this.MALLET_RADIUS;
  }
}
