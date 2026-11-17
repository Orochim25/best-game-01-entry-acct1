// LUMENFALL — the game itself: state, combat, economy, waves, abilities.
// Owns towers, enemies, gold and lives; render.js only draws what is here.
import { START_GOLD, START_LIVES, TOTAL_WAVES, BOSS_WAVE, WAVE_CLEAR_BONUS, ABILITY, LEAK_X } from './config.js';
import { PADS, LIGHTHOUSE, ROAD_LENGTH, pointOnRoad } from './levels.js';
import { TOWER_TYPES, towerStats, towerCost, sellValue } from './towers.js';
import { ENEMY_KINDS, scaledHp, scaledGold } from './enemies.js';
import { WAVES, waveCount } from './waves.js';
import { Particles } from './particles.js';
import { sfx } from './audio.js';

export class Game {
  constructor() {
    this.particles = new Particles();
    this.reset();
  }

  reset() {
    this.state = 'title'; // title | howto | playing | paused | gameover | victory
    this.gold = START_GOLD;
    this.lives = START_LIVES;
    this.wave = 0;
    this.score = 0;
    this.kills = 0;
    this.goldEarned = 0;
    this.leaked = 0;
    this.towersBuilt = 0;
    this.upgradesBought = 0;
    this.timePlayed = 0;
    this.towers = [];
    this.enemies = [];
    this.spawnQueue = [];
    this.waveActive = false;
    this.waveTime = 0;
    this.betweenTimer = 0;
    this.selectedPad = -1;
    this.selectedTower = null; // a tower object, when one is clicked
    this.shopType = 'ember';
    this.hover = { x: -1, y: -1 };
    this.hoverPad = -1;
    this.abilities = {
      frostNova: { cd: 0 },
      sunburst: { cd: 0 },
      surge: { cd: 0 },
    };
    this.surgeUntil = 0;
    this.message = '';
    this.messageUntil = 0;
    this.particles = new Particles();
    this.bossSpawned = false;
  }

  startGame() {
    this.reset();
    this.state = 'playing';
    this.flash('Build towers on the stone pads, then press START WAVE');
    sfx.waveStart();
  }

  toTitle() {
    this.reset();
  }

  togglePause() {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
  }

  // ---- waves ------------------------------------------------------------
  startWave() {
    if (this.state !== 'playing' || this.waveActive || this.wave >= TOTAL_WAVES) return false;
    this.wave++;
    this.waveActive = true;
    this.waveTime = 0;
    this.bossSpawned = false;
    const groups = WAVES[this.wave - 1];
    this.spawnQueue = [];
    for (const grp of groups) {
      for (let i = 0; i < grp.count; i++) {
        this.spawnQueue.push({ at: grp.delay + i * grp.gap, kind: grp.kind });
      }
    }
    this.spawnQueue.sort((a, b) => a.at - b.at);
    this.flash(this.wave === BOSS_WAVE ? 'THE UMBRAL KING APPROACHES' : `WAVE ${this.wave} — ${waveCount(this.wave)} shadows`);
    if (this.wave === BOSS_WAVE) sfx.boss();
    else sfx.waveStart();
    return true;
  }

  spawnEnemy(kind) {
    const def = ENEMY_KINDS[kind];
    const hp = scaledHp(kind, this.wave);
    const pos = pointOnRoad(0);
    const e = {
      kind, def, hp, maxHp: hp, shield: 0,
      dist: 0, x: pos.x, y: pos.y, angle: pos.angle,
      speed: def.speed * (0.92 + Math.random() * 0.16),
      gold: scaledGold(kind, this.wave), lives: def.lives, radius: def.radius,
      slowFactor: 1, slowUntil: 0, freezeUntil: 0,
      healTimer: 1, shieldTimer: 1, bossTimer: 5,
      wobble: Math.random() * Math.PI * 2,
      dead: false, leaked: false,
    };
    this.enemies.push(e);
    if (kind === 'king') this.bossSpawned = true;
    return e;
  }

  // ---- towers -----------------------------------------------------------
  padAt(x, y) {
    for (let i = 0; i < PADS.length; i++) {
      const dx = x - PADS[i].x, dy = y - PADS[i].y;
      if (dx * dx + dy * dy < 34 * 34) return i;
    }
    return -1;
  }

  towerAtPad(i) {
    return this.towers.find((t) => t.padIndex === i) || null;
  }

  placeTower(padIndex, type) {
    if (this.state !== 'playing') return false;
    if (this.towerAtPad(padIndex)) return false;
    const cost = towerCost(type, 1);
    if (this.gold < cost) { sfx.error(); this.flash('Not enough gold'); return false; }
    this.gold -= cost;
    const pad = PADS[padIndex];
    this.towers.push({
      type, tier: 1, padIndex, x: pad.x, y: pad.y,
      cooldown: 0, angle: -Math.PI / 2, kills: 0, buffMult: 1,
    });
    this.towersBuilt++;
    this.particles.burst(pad.x, pad.y, TOWER_TYPES[type].colour, 14, 140, 0.5);
    sfx.build();
    return true;
  }

  upgradeTower(tower) {
    if (!tower || tower.tier >= 3) return false;
    const cost = towerCost(tower.type, tower.tier + 1);
    if (this.gold < cost) { sfx.error(); this.flash('Not enough gold'); return false; }
    this.gold -= cost;
    tower.tier++;
    this.upgradesBought++;
    this.particles.ring(tower.x, tower.y, TOWER_TYPES[tower.type].glow);
    sfx.upgrade();
    return true;
  }

  sellTower(tower) {
    if (!tower) return false;
    const value = sellValue(tower);
    this.gold += value;
    this.goldEarned += 0;
    this.particles.text(tower.x, tower.y - 20, `+${value}g`, '#ffd166', 16);
    this.towers = this.towers.filter((t) => t !== tower);
    if (this.selectedTower === tower) this.selectedTower = null;
    sfx.sell();
    return true;
  }

  // ---- abilities --------------------------------------------------------
  useAbility(name) {
    if (this.state !== 'playing') return false;
    const ab = this.abilities[name];
    if (!ab || ab.cd > 0) { sfx.error(); return false; }
    if (name === 'frostNova') {
      ab.cd = ABILITY.frostNova.cooldown;
      for (const e of this.enemies) e.freezeUntil = this.waveTime + ABILITY.frostNova.freezeSecs;
      this.particles.ring(LIGHTHOUSE.x - 120, 300, '#7fd4ff', 40, 420);
      this.flash('FROST NOVA — the shadows freeze');
    } else if (name === 'sunburst') {
      ab.cd = ABILITY.sunburst.cooldown;
      for (const e of [...this.enemies]) {
        this.damageEnemy(e, ABILITY.sunburst.damage, false);
      }
      this.particles.ring(640, 300, '#ffd166', 48, 520);
      this.particles.addShake(6);
      this.flash('SUNBURST — holy light scorches the road');
    } else if (name === 'surge') {
      ab.cd = ABILITY.surge.cooldown;
      this.surgeUntil = this.waveTime + ABILITY.surge.duration;
      this.flash('BEACON SURGE — towers fire twice as fast');
    }
    sfx.ability();
    return true;
  }

  flash(msg) {
    this.message = msg;
    this.messageUntil = this.waveTime + 2.6;
  }

  // ---- combat -----------------------------------------------------------
  damageEnemy(e, amount, isSplash) {
    if (e.dead || e.leaked) return;
    let dmg = amount;
    if (isSplash && e.def.splashResist) dmg *= e.def.splashResist;
    if (e.shield > 0) {
      const absorbed = Math.min(e.shield, dmg);
      e.shield -= absorbed;
      dmg -= absorbed;
    }
    e.hp -= dmg;
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    this.kills++;
    this.score += 10;
    this.gold += e.gold;
    this.goldEarned += e.gold;
    this.particles.burst(e.x, e.y, e.def.colour, e.kind === 'king' ? 60 : 12, e.kind === 'king' ? 300 : 130, 0.7);
    this.particles.text(e.x, e.y - 14, `+${e.gold}g`, '#ffd166', 13);
    sfx.die();
    if (e.kind === 'king') {
      this.particles.addShake(12);
      this.particles.ring(e.x, e.y, '#ffd166', 60, 420);
      sfx.victory();
    }
    if (e.def.splitsInto) {
      for (let i = 0; i < e.def.splitCount; i++) {
        const w = this.spawnEnemy(e.def.splitsInto);
        w.dist = Math.max(0, e.dist - 26 - i * 14);
        const pos = pointOnRoad(w.dist);
        w.x = pos.x; w.y = pos.y;
      }
    }
  }

  leakEnemy(e) {
    if (e.leaked) return;
    e.leaked = true;
    this.leaked++;
    this.lives -= e.lives;
    this.particles.burst(LIGHTHOUSE.x - 20, LIGHTHOUSE.y, '#ff5d73', 22, 200, 0.8);
    this.particles.addShake(8);
    this.particles.text(LIGHTHOUSE.x - 90, LIGHTHOUSE.y - 60, `-${e.lives} ♥`, '#ff5d73', 20);
    sfx.leak();
    if (this.lives <= 0) {
      this.lives = 0;
      this.state = 'gameover';
      sfx.defeat();
    }
  }

  lanternBuff(tower) {
    let mult = 1;
    for (const t of this.towers) {
      if (t.type !== 'lantern' || t === tower) continue;
      const st = towerStats('lantern', t.tier);
      const dx = t.x - tower.x, dy = t.y - tower.y;
      if (dx * dx + dy * dy <= st.range * st.range) mult = Math.max(mult, st.buff);
    }
    return mult;
  }

  updateTowers(dt) {
    const surge = this.waveTime < this.surgeUntil ? ABILITY.surge.rateMult : 1;
    for (const t of this.towers) {
      const st = towerStats(t.type, t.tier);
      t.buffMult = this.lanternBuff(t);
      t.cooldown -= dt;
      if (t.type === 'frost') {
        // chill aura: slow everything in range, small damage ticks
        for (const e of this.enemies) {
          if (e.dead || e.leaked) continue;
          const dx = e.x - t.x, dy = e.y - t.y;
          if (dx * dx + dy * dy <= st.range * st.range) {
            e.slowFactor = Math.min(e.slowFactor, st.slow);
            e.slowUntil = this.waveTime + 0.6;
            if (t.cooldown <= 0) this.damageEnemy(e, st.damage, false);
          }
        }
        if (t.cooldown <= 0) { t.cooldown = 1 / st.rate; }
        continue;
      }
      if (t.cooldown > 0) continue;
      // target: furthest along the road within range
      let target = null;
      let bestDist = -1;
      for (const e of this.enemies) {
        if (e.dead || e.leaked) continue;
        const dx = e.x - t.x, dy = e.y - t.y;
        if (dx * dx + dy * dy <= st.range * st.range && e.dist > bestDist) {
          bestDist = e.dist;
          target = e;
        }
      }
      if (!target) continue;
      t.angle = Math.atan2(target.y - t.y, target.x - t.x);
      const dmg = st.damage * t.buffMult;
      t.cooldown = 1 / (st.rate * surge);
      if (t.type === 'storm') {
        const chain = st.chain || 2;
        let from = { x: t.x, y: t.y };
        let current = target;
        const hitSet = new Set();
        for (let c = 0; c < chain && current; c++) {
          this.particles.shot(from.x, from.y, current.x, current.y, '#ffe14d', 'bolt');
          this.damageEnemy(current, dmg, false);
          hitSet.add(current);
          from = { x: current.x, y: current.y };
          let next = null;
          let bestD = 130 * 130;
          for (const e of this.enemies) {
            if (e.dead || e.leaked || hitSet.has(e)) continue;
            const dx = e.x - from.x, dy = e.y - from.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD) { bestD = d2; next = e; }
          }
          current = next;
        }
        sfx.storm();
      } else if (t.type === 'mortar' || st.splash > 0) {
        this.particles.shot(t.x, t.y - 10, target.x, target.y, '#b6ff5e', 'mortar');
        this.particles.burst(target.x, target.y, '#b6ff5e', 10, 150, 0.5);
        for (const e of [...this.enemies]) {
          if (e.dead || e.leaked) continue;
          const dx = e.x - target.x, dy = e.y - target.y;
          if (dx * dx + dy * dy <= st.splash * st.splash) this.damageEnemy(e, dmg, true);
        }
        sfx.mortar();
      } else {
        this.particles.shot(t.x, t.y - 8, target.x, target.y, TOWER_TYPES[t.type].colour, 'bolt');
        this.damageEnemy(target, dmg, false);
        if (t.type === 'lantern') sfx.frost();
        else sfx.shoot();
      }
      t.kills += 1;
    }
  }

  updateEnemies(dt) {
    for (const e of this.enemies) {
      if (e.dead || e.leaked) continue;
      // mender heals allies
      if (e.def.kind === 'healer') {
        e.healTimer -= dt;
        if (e.healTimer <= 0) {
          e.healTimer = 1.2;
          for (const o of this.enemies) {
            if (o === e || o.dead || o.leaked) continue;
            const dx = o.x - e.x, dy = o.y - e.y;
            if (dx * dx + dy * dy <= e.def.healRadius * e.def.healRadius && o.hp < o.maxHp) {
              o.hp = Math.min(o.maxHp, o.hp + e.def.heal);
              this.particles.text(o.x, o.y - 18, `+${e.def.heal}`, '#7fe0a8', 11);
            }
          }
        }
      }
      // hexer shields allies
      if (e.def.kind === 'shield') {
        e.shieldTimer -= dt;
        if (e.shieldTimer <= 0) {
          e.shieldTimer = 1.5;
          for (const o of this.enemies) {
            if (o === e || o.dead || o.leaked) continue;
            const dx = o.x - e.x, dy = o.y - e.y;
            if (dx * dx + dy * dy <= e.def.shieldRadius * e.def.shieldRadius) {
              o.shield = Math.min(e.def.shield, o.shield + e.def.shield);
            }
          }
        }
      }
      // the King calls wisps
      if (e.kind === 'king') {
        e.bossTimer -= dt;
        if (e.bossTimer <= 0) {
          e.bossTimer = 6;
          for (let i = 0; i < 2; i++) {
            const w = this.spawnEnemy('wisp');
            w.dist = Math.max(0, e.dist - 40 - i * 20);
            const pos = pointOnRoad(w.dist);
            w.x = pos.x; w.y = pos.y;
          }
          this.flash('The King calls his wisps!');
        }
      }
      // movement
      const frozen = this.waveTime < e.freezeUntil;
      const slowed = this.waveTime < e.slowUntil;
      let speed = e.speed;
      if (frozen) speed = 0;
      else if (slowed) speed *= e.slowFactor;
      e.dist += speed * dt;
      const pos = pointOnRoad(e.dist);
      e.wobble += dt * 6;
      const bob = e.def.flying ? Math.sin(e.wobble) * 6 : Math.sin(e.wobble) * 1.5;
      e.x = pos.x;
      e.y = pos.y + bob;
      e.angle = pos.angle;
      if (e.dist >= ROAD_LENGTH - 14 || e.x >= LEAK_X) this.leakEnemy(e);
    }
    this.enemies = this.enemies.filter((e) => !e.dead && !e.leaked);
  }

  update(dt) {
    if (this.state !== 'playing') return;
    this.timePlayed += dt;
    this.waveTime += dt;
    for (const key of Object.keys(this.abilities)) {
      if (this.abilities[key].cd > 0) this.abilities[key].cd -= dt;
    }
    this.particles.update(dt);
    if (!this.waveActive) {
      this.betweenTimer += dt;
      return;
    }
    // spawn
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].at <= this.waveTime) {
      const s = this.spawnQueue.shift();
      this.spawnEnemy(s.kind);
    }
    this.updateTowers(dt);
    this.updateEnemies(dt);
    // wave cleared?
    if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      const bonus = WAVE_CLEAR_BONUS(this.wave);
      this.gold += bonus;
      this.goldEarned += bonus;
      this.score += 150;
      this.particles.text(640, 200, `Wave clear! +${bonus}g`, '#ffd166', 22);
      if (this.wave >= TOTAL_WAVES) {
        this.state = 'victory';
        this.score += this.lives * 50;
        sfx.victory();
      } else {
        sfx.waveClear();
        this.flash(`Wave ${this.wave} cleared — +${bonus} gold. Press START WAVE when ready.`);
      }
    }
  }
}
