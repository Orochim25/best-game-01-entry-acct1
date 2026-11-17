// LUMENFALL — juice: particles, floating combat text, projectiles and shake.
// Everything here is cosmetic: it never changes game state.
export class Particles {
  constructor() {
    this.list = [];
    this.texts = [];
    this.shots = [];
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  burst(x, y, colour, count, speed = 120, life = 0.6, size = 3) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.list.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
        life: life * (0.6 + Math.random() * 0.7), age: 0,
        size: size * (0.6 + Math.random() * 0.8), colour,
      });
    }
  }

  ring(x, y, colour, count = 26, speed = 260) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.list.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 0.5, age: 0, size: 3.5, colour,
      });
    }
  }

  text(x, y, str, colour = '#ffd166', size = 15) {
    this.texts.push({ x, y, str, colour, size, age: 0, life: 0.9 });
  }

  // A visible projectile from a tower muzzle to its target.
  shot(x1, y1, x2, y2, colour, kind = 'bolt') {
    this.shots.push({ x1, y1, x2, y2, colour, kind, age: 0, life: 0.12 });
  }

  addShake(amount) {
    this.shake = Math.min(14, this.shake + amount);
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age >= p.life) { this.list.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.vx *= 0.98;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.age += dt;
      t.y -= 34 * dt;
      if (t.age >= t.life) this.texts.splice(i, 1);
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.age += dt;
      if (s.age >= s.life) this.shots.splice(i, 1);
    }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 26);
      const m = this.shake;
      this.shakeX = (Math.random() * 2 - 1) * m;
      this.shakeY = (Math.random() * 2 - 1) * m;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  draw(ctx) {
    // projectiles
    for (const s of this.shots) {
      const a = 1 - s.age / s.life;
      ctx.globalAlpha = a;
      ctx.strokeStyle = s.colour;
      ctx.lineWidth = s.kind === 'mortar' ? 4 : 2.5;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // particles
    for (const p of this.list) {
      const a = 1 - p.age / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.colour;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // floating text
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const a = 1 - t.age / t.life;
      ctx.globalAlpha = a;
      ctx.font = `bold ${t.size}px "Trebuchet MS", Verdana, sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(10,10,30,0.85)';
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.colour;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
