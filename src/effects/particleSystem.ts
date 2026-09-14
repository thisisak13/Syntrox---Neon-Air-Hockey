// High-performance particle & visual effects system for SYNTROX Neon Air Hockey

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  public screenShakeIntensity: number = 0;
  private maxParticles: number = 200;

  constructor(quality: 'HIGH' | 'LOW' = 'HIGH') {
    this.maxParticles = quality === 'HIGH' ? 220 : 100;
  }

  public setQuality(quality: 'HIGH' | 'LOW') {
    this.maxParticles = quality === 'HIGH' ? 220 : 100;
  }

  public addWallBounceSparks(x: number, y: number, speedIntensity: number = 0.5) {
    const intensity = Math.min(Math.max(speedIntensity, 0.2), 1.5);
    const count = Math.round(8 * intensity);
    const color = '#00f0ff';
    this.addImpactSparks(x, y, color, count, intensity * 0.8);
  }

  public addMalletImpactSparks(x: number, y: number, isPlayer: boolean = true, speedIntensity: number = 0.5) {
    const intensity = Math.min(Math.max(speedIntensity, 0.3), 2.0);
    const primaryColor = isPlayer ? '#00f0ff' : '#ff0055';
    const count = Math.round(14 * intensity);

    this.addImpactSparks(x, y, primaryColor, count, intensity);

    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: Math.min(32 * intensity, 65),
      color: primaryColor,
      alpha: 0.8,
      lineWidth: 2,
    });

    if (intensity > 0.75) {
      this.triggerShake(intensity * 3.5);
    }
  }

  public addImpactSparks(x: number, y: number, color: string = '#00f0ff', count: number = 14, speedScale: number = 1) {
    if (this.particles.length > this.maxParticles) return;
    const clampedCount = Math.min(count, this.maxParticles - this.particles.length);
    for (let i = 0; i < clampedCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 6) * speedScale;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 1.5 + Math.random() * 2.5,
        alpha: 1,
        maxLife: 15 + Math.random() * 15,
        life: 0,
      });
    }
  }

  public addGoalExplosion(x: number, y: number, isPlayerGoal: boolean) {
    const primaryColor = isPlayerGoal ? '#00f0ff' : '#ff0055';
    const secondaryColor = '#ffffff';

    // Add shockwave ring
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: 180,
      color: primaryColor,
      alpha: 1,
      lineWidth: 4,
    });

    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 120,
      color: secondaryColor,
      alpha: 0.8,
      lineWidth: 2,
    });

    // Add burst particles
    const count = 45;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 11;
      const color = Math.random() > 0.3 ? primaryColor : secondaryColor;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3.5,
        alpha: 1,
        maxLife: 30 + Math.random() * 25,
        life: 0,
      });
    }

    this.triggerShake(12);
  }

  public addRecoveryEffect(x: number, y: number) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 70,
      color: '#00ffcc',
      alpha: 0.9,
      lineWidth: 3,
    });

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: '#00ffcc',
        size: 2.5,
        alpha: 1,
        maxLife: 20,
        life: 0,
      });
    }
  }

  public triggerShake(intensity: number) {
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
  }

  public update() {
    // Screen shake decay
    if (this.screenShakeIntensity > 0.05) {
      this.screenShakeIntensity *= 0.88;
    } else {
      this.screenShakeIntensity = 0;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 0.15 + 2;
      s.alpha = Math.max(0, 1 - s.radius / s.maxRadius);
      if (s.radius >= s.maxRadius || s.alpha <= 0.01) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Render shockwaves
    for (const s of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.lineWidth = s.lineWidth;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.shockwaves = [];
    this.screenShakeIntensity = 0;
  }
}
