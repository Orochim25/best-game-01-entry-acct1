// LUMENFALL — every pixel the player sees: the night map, the road, the
// lighthouse, towers, shadows, HUD, command bar and all the screens.
import { VIEW_W, VIEW_H, BAR_H, COLOURS, PATH_WIDTH, TOTAL_WAVES } from './config.js';
import { WAYPOINTS, PADS, PAD_RADIUS, LIGHTHOUSE, ROAD_LENGTH } from './levels.js';
import { TOWER_TYPES, TOWER_ORDER, towerStats, towerCost, sellValue } from './towers.js';
import { ENEMY_KINDS } from './enemies.js';
import { waveLabel } from './waves.js';
import {
  BAR_Y as BAR_TOP, shopCardRect, abilityRect, startWaveRect, pauseRect, muteRect,
  towerPanelRect, upgradeButtonRect, sellButtonRect, playButtonRect, howtoButtonRect,
  backButtonRect, againButtonRect, titleButtonRect, ABILITY_NAMES, ABILITY_LABELS,
} from './ui.js';
import { isMuted } from './audio.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

// Stars, fixed by a seeded RNG so the sky is identical on every load.
import { makeRng } from './random.js';
const starRng = makeRng(20261117);
const STARS = [];
for (let i = 0; i < 110; i++) {
  STARS.push({ x: starRng() * VIEW_W, y: starRng() * 300, r: starRng() * 1.6 + 0.4, p: starRng() * Math.PI * 2 });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function button(ctx, r, label, opts = {}) {
  const { fill = '#2c3566', edge = '#4a5696', text = '#f4ead8', font = 'bold 17px ' + FONT, disabled = false } = opts;
  ctx.globalAlpha = disabled ? 0.55 : 1;
  ctx.fillStyle = fill;
  roundRect(ctx, r.x, r.y, r.w, r.h, 9);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = text;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.globalAlpha = 1;
}

// ---- tower + enemy glyphs (drawn in code, no images) --------------------
export function drawTowerGlyph(ctx, type, x, y, s, tier = 1) {
  const t = TOWER_TYPES[type];
  ctx.save();
  ctx.translate(x, y);
  if (type === 'ember') {
    ctx.fillStyle = '#7a3b12';
    ctx.beginPath(); ctx.moveTo(-9 * s, 10 * s); ctx.lineTo(9 * s, 10 * s); ctx.lineTo(5 * s, -8 * s); ctx.lineTo(-5 * s, -8 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = t.colour;
    ctx.beginPath(); ctx.moveTo(0, -20 * s); ctx.quadraticCurveTo(9 * s, -6 * s, 5 * s, 2 * s); ctx.quadraticCurveTo(0, 6 * s, -5 * s, 2 * s); ctx.quadraticCurveTo(-9 * s, -6 * s, 0, -20 * s); ctx.fill();
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath(); ctx.arc(0, -6 * s, 3.5 * s, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'frost') {
    ctx.fillStyle = '#dfeeff';
    ctx.beginPath(); ctx.moveTo(0, -18 * s); ctx.lineTo(7 * s, -4 * s); ctx.lineTo(4 * s, 10 * s); ctx.lineTo(-4 * s, 10 * s); ctx.lineTo(-7 * s, -4 * s); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = t.colour; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(0, -14 * s); ctx.lineTo(0, 6 * s); ctx.moveTo(-9 * s, -6 * s); ctx.lineTo(9 * s, -6 * s); ctx.stroke();
    ctx.fillStyle = t.colour; ctx.beginPath(); ctx.arc(0, -4 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'storm') {
    ctx.fillStyle = '#5c4a12';
    ctx.fillRect(-7 * s, -8 * s, 14 * s, 18 * s);
    ctx.fillStyle = t.colour;
    ctx.beginPath(); ctx.moveTo(2 * s, -22 * s); ctx.lineTo(-6 * s, -2 * s); ctx.lineTo(0, -2 * s); ctx.lineTo(-2 * s, 12 * s); ctx.lineTo(7 * s, -8 * s); ctx.lineTo(1 * s, -8 * s); ctx.closePath(); ctx.fill();
  } else if (type === 'mortar') {
    ctx.fillStyle = '#3d4d1e';
    ctx.beginPath(); ctx.arc(0, 4 * s, 10 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a9a5b'; ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.moveTo(0, 2 * s); ctx.lineTo(8 * s, -12 * s); ctx.stroke();
    ctx.fillStyle = t.colour; ctx.beginPath(); ctx.arc(9 * s, -13 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'lantern') {
    ctx.strokeStyle = '#8a6a2e'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.moveTo(0, 10 * s); ctx.lineTo(0, -4 * s); ctx.stroke();
    ctx.fillStyle = t.colour;
    ctx.beginPath(); ctx.arc(0, -10 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0b3'; ctx.beginPath(); ctx.arc(0, -10 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = t.glow; ctx.lineWidth = 1.5 * s;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11 * s, -10 * s + Math.sin(a) * 11 * s); ctx.lineTo(Math.cos(a) * 15 * s, -10 * s + Math.sin(a) * 15 * s); ctx.stroke();
    }
  }
  // tier pips
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < tier; i++) {
    ctx.beginPath();
    ctx.arc(-6 * s + i * 6 * s, 15 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemyGlyph(ctx, e, t) {
  const d = e.def;
  ctx.save();
  ctx.translate(e.x, e.y);
  const wob = Math.sin(e.wobble) * 0.12;
  ctx.rotate(wob);
  const r = e.radius;
  ctx.fillStyle = d.dark;
  ctx.beginPath(); ctx.arc(0, 2, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = d.colour;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
  // kind details
  ctx.fillStyle = '#0b1026';
  if (e.kind === 'wisp') {
    ctx.beginPath(); ctx.arc(-4, -3, 2.4, 0, Math.PI * 2); ctx.arc(4, -3, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(201,184,255,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r, 6); ctx.quadraticCurveTo(0, 12, r, 6); ctx.stroke();
  } else if (e.kind === 'batwing') {
    ctx.fillStyle = d.dark;
    ctx.beginPath(); ctx.moveTo(-r, -2); ctx.quadraticCurveTo(-r - 12, -14, -r - 4, -4); ctx.quadraticCurveTo(-r - 2, 2, -r, -2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r, -2); ctx.quadraticCurveTo(r + 12, -14, r + 4, -4); ctx.quadraticCurveTo(r + 2, 2, r, -2); ctx.fill();
    ctx.fillStyle = '#ff5d73'; ctx.beginPath(); ctx.arc(-4, -3, 2.2, 0, Math.PI * 2); ctx.arc(4, -3, 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'husk' || e.kind === 'golem') {
    ctx.strokeStyle = d.dark; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.4); ctx.lineTo(r * 0.6, -r * 0.4); ctx.moveTo(-r * 0.6, r * 0.3); ctx.lineTo(r * 0.6, r * 0.3); ctx.stroke();
    ctx.fillStyle = '#0b1026'; ctx.beginPath(); ctx.arc(-4, -4, 2.4, 0, Math.PI * 2); ctx.arc(4, -4, 2.4, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'mender') {
    ctx.strokeStyle = '#eafff2'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 4); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.stroke();
  } else if (e.kind === 'splitter') {
    ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(-4, -4, 2.4, 0, Math.PI * 2); ctx.arc(4, -4, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = d.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke();
  } else if (e.kind === 'hexer') {
    ctx.strokeStyle = '#ffd7e0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -2, r * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd7e0'; ctx.beginPath(); ctx.arc(0, -2, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'king') {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(-14, -r + 4); ctx.lineTo(-10, -r - 12); ctx.lineTo(-5, -r + 2); ctx.lineTo(0, -r - 14); ctx.lineTo(5, -r + 2); ctx.lineTo(10, -r - 12); ctx.lineTo(14, -r + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5d73'; ctx.beginPath(); ctx.arc(-7, -5, 3, 0, Math.PI * 2); ctx.arc(7, -5, 3, 0, Math.PI * 2); ctx.fill();
  } else { // shade
    ctx.fillStyle = '#0b1026'; ctx.beginPath(); ctx.arc(-4, -3, 2.4, 0, Math.PI * 2); ctx.arc(4, -3, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // frozen / slowed tint
  if (t < e.freezeUntil) {
    ctx.fillStyle = 'rgba(127,212,255,0.55)';
    ctx.beginPath(); ctx.arc(e.x, e.y, r + 3, 0, Math.PI * 2); ctx.fill();
  } else if (t < e.slowUntil) {
    ctx.fillStyle = 'rgba(127,212,255,0.25)';
    ctx.beginPath(); ctx.arc(e.x, e.y, r + 2, 0, Math.PI * 2); ctx.fill();
  }
  // shield ring
  if (e.shield > 0) {
    ctx.strokeStyle = 'rgba(255,127,158,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y, r + 5, 0, Math.PI * 2); ctx.stroke();
  }
  // hp bar
  const w = Math.max(26, r * 2);
  const frac = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = 'rgba(5,8,20,0.8)';
  ctx.fillRect(e.x - w / 2, e.y - r - 12, w, 5);
  ctx.fillStyle = frac > 0.5 ? '#7fe0a8' : frac > 0.25 ? '#ffd166' : '#ff5d73';
  ctx.fillRect(e.x - w / 2, e.y - r - 12, w * frac, 5);
}

// ---- the world ------------------------------------------------------------
function drawBackground(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, COLOURS.night);
  g.addColorStop(0.55, COLOURS.night2);
  g.addColorStop(1, '#0a0e24');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // stars
  for (const s of STARS) {
    const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.4 + s.p));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#e8ecff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // moon
  ctx.fillStyle = '#f4ead8';
  ctx.beginPath(); ctx.arc(1120, 70, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(244,234,216,0.25)';
  ctx.beginPath(); ctx.arc(1120, 70, 36, 0, Math.PI * 2); ctx.fill();
  // ground
  ctx.fillStyle = COLOURS.ground;
  ctx.fillRect(0, 96, VIEW_W, 504);
  ctx.fillStyle = COLOURS.ground2;
  for (let i = 0; i < 40; i++) {
    const gx = (i * 173) % VIEW_W;
    const gy = 110 + ((i * 97) % 470);
    ctx.beginPath(); ctx.arc(gx, gy, 3 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }
}

function drawRoad(ctx) {
  // soft outer edge, then the road itself, then a dashed centre line
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLOURS.pathEdge;
  ctx.lineWidth = PATH_WIDTH + 12;
  ctx.beginPath();
  WAYPOINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.strokeStyle = COLOURS.path;
  ctx.lineWidth = PATH_WIDTH;
  ctx.beginPath();
  WAYPOINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(244,234,216,0.28)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  WAYPOINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPads(ctx, game) {
  for (let i = 0; i < PADS.length; i++) {
    const p = PADS[i];
    const tower = game.towerAtPad(i);
    const hovered = game.hoverPad === i;
    ctx.fillStyle = hovered ? '#2c3566' : '#232c52';
    ctx.beginPath(); ctx.arc(p.x, p.y, PAD_RADIUS, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hovered ? '#ffd166' : '#3d4780';
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.stroke();
    if (!tower) {
      ctx.fillStyle = 'rgba(244,234,216,0.35)';
      ctx.font = 'bold 20px ' + FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', p.x, p.y + 1);
    }
  }
}

function drawLighthouse(ctx, game, t) {
  const { x, y } = LIGHTHOUSE;
  // rotating beam
  const beamAngle = -0.5 + 0.5 * Math.sin(t * 0.5);
  ctx.save();
  ctx.translate(x, y - 46);
  ctx.rotate(beamAngle);
  const grad = ctx.createLinearGradient(0, 0, -320, 0);
  grad.addColorStop(0, 'rgba(255,233,168,0.30)');
  grad.addColorStop(1, 'rgba(255,233,168,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-320, -26); ctx.lineTo(-320, 26); ctx.closePath(); ctx.fill();
  ctx.restore();
  // cliff + tower
  ctx.fillStyle = '#2a2440';
  ctx.beginPath(); ctx.moveTo(x - 34, 600); ctx.lineTo(x + 10, 600); ctx.lineTo(x + 4, y + 30); ctx.lineTo(x - 28, y + 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(x - 22, y - 46, 26, 76);
  ctx.fillStyle = '#b23a5c';
  ctx.fillRect(x - 22, y - 20, 26, 8);
  ctx.fillRect(x - 22, y + 6, 26, 8);
  ctx.fillStyle = '#3d3560';
  ctx.beginPath(); ctx.arc(x - 9, y - 52, 14, Math.PI, 0); ctx.fill();
  // lamp
  const pulse = 0.75 + 0.25 * Math.sin(t * 2.4);
  ctx.fillStyle = `rgba(255,233,168,${pulse})`;
  ctx.beginPath(); ctx.arc(x - 9, y - 48, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,233,168,0.25)';
  ctx.beginPath(); ctx.arc(x - 9, y - 48, 18, 0, Math.PI * 2); ctx.fill();
  // lives pips under the lighthouse
  ctx.fillStyle = '#ff5d73';
  ctx.font = 'bold 15px ' + FONT;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`♥ ${game.lives}`, x - 9, y + 52);
}

function drawTowers(ctx, game) {
  for (const tw of game.towers) {
    const st = towerStats(tw.type, tw.tier);
    // range preview for the selected tower
    if (game.selectedTower === tw) {
      ctx.fillStyle = 'rgba(255,209,102,0.10)';
      ctx.beginPath(); ctx.arc(tw.x, tw.y, st.range, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,209,102,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // buff aura
    if (tw.type === 'lantern') {
      ctx.fillStyle = 'rgba(255,209,102,0.07)';
      ctx.beginPath(); ctx.arc(tw.x, tw.y, st.range, 0, Math.PI * 2); ctx.fill();
    }
    drawTowerGlyph(ctx, tw.type, tw.x, tw.y, 1.15, tw.tier);
    // barrel direction for shooters
    if (tw.type === 'ember' || tw.type === 'storm' || tw.type === 'mortar') {
      ctx.strokeStyle = '#0b1026';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(tw.x, tw.y - 6); ctx.lineTo(tw.x + Math.cos(tw.angle) * 22, tw.y - 6 + Math.sin(tw.angle) * 22); ctx.stroke();
    }
  }
  // ghost preview of the shop tower on the hovered pad
  if (game.hoverPad >= 0 && !game.towerAtPad(game.hoverPad) && game.state === 'playing') {
    const pad = PADS[game.hoverPad];
    const st = towerStats(game.shopType, 1);
    ctx.globalAlpha = 0.55;
    drawTowerGlyph(ctx, game.shopType, pad.x, pad.y, 1.15, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,209,102,0.08)';
    ctx.beginPath(); ctx.arc(pad.x, pad.y, st.range, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawEnemies(ctx, game, t) {
  const sorted = [...game.enemies].sort((a, b) => a.y - b.y);
  for (const e of sorted) drawEnemyGlyph(ctx, e, game.waveTime);
}

// ---- HUD + command bar ----------------------------------------------------
function drawHud(ctx, game) {
  ctx.fillStyle = 'rgba(10,14,36,0.82)';
  ctx.fillRect(0, 0, VIEW_W, 48);
  ctx.fillStyle = COLOURS.panelEdge;
  ctx.fillRect(0, 48, VIEW_W, 2);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 19px ' + FONT;
  ctx.fillStyle = COLOURS.gold;
  ctx.fillText(`● ${game.gold} gold`, 18, 25);
  ctx.fillStyle = COLOURS.life;
  ctx.fillText(`♥ ${game.lives} lives`, 190, 25);
  ctx.fillStyle = COLOURS.text;
  ctx.fillText(game.wave === 0 ? 'Wave — / 21' : `Wave ${game.wave} / 21`, 350, 25);
  ctx.fillStyle = COLOURS.textDim;
  ctx.fillText(`Score ${game.score}   Kills ${game.kills}`, 520, 25);
  if (game.waveActive) {
    const left = game.spawnQueue.length + game.enemies.length;
    ctx.fillStyle = '#ff9d5c';
    ctx.fillText(`Shadows left: ${left}`, 800, 25);
    // wave progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(800, 38, 220, 5);
  }
  button(ctx, pauseRect(), game.state === 'paused' ? '▶' : 'II', { fill: '#232c52', font: 'bold 15px ' + FONT });
  button(ctx, muteRect(), isMuted() ? '✕' : '♪', { fill: '#232c52', font: 'bold 15px ' + FONT });
}

function drawBar(ctx, game) {
  ctx.fillStyle = COLOURS.panel;
  ctx.fillRect(0, BAR_TOP, VIEW_W, BAR_H);
  ctx.fillStyle = COLOURS.panelEdge;
  ctx.fillRect(0, BAR_TOP, VIEW_W, 2);
  // shop cards
  for (let i = 0; i < TOWER_ORDER.length; i++) {
    const type = TOWER_ORDER[i];
    const r = shopCardRect(i);
    const def = TOWER_TYPES[type];
    const afford = game.gold >= def.cost;
    const selected = game.shopType === type;
    ctx.fillStyle = selected ? '#3a2f5e' : '#1a2145';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = selected ? COLOURS.gold : '#2c3566';
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    drawTowerGlyph(ctx, type, r.x + 26, r.y + 30, 0.95, 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOURS.text;
    ctx.font = 'bold 15px ' + FONT;
    ctx.fillText(def.short, r.x + 50, r.y + 18);
    ctx.fillStyle = COLOURS.textDim;
    ctx.font = '12px ' + FONT;
    ctx.fillText(def.role, r.x + 50, r.y + 36);
    ctx.fillStyle = afford ? COLOURS.gold : '#8a6a6a';
    ctx.font = 'bold 15px ' + FONT;
    ctx.fillText(`${def.cost}g`, r.x + 50, r.y + 58);
    ctx.fillStyle = COLOURS.textDim;
    ctx.font = '11px ' + FONT;
    ctx.fillText('T2 ' + def.tiers[1].cost + 'g · T3 ' + def.tiers[2].cost + 'g', r.x + 14, r.y + 82);
  }
  // abilities
  const icons = { frostNova: '❄', sunburst: '☀', surge: '⚡' };
  for (let i = 0; i < ABILITY_NAMES.length; i++) {
    const name = ABILITY_NAMES[i];
    const r = abilityRect(i);
    const ab = game.abilities[name];
    const ready = ab.cd <= 0;
    ctx.fillStyle = ready ? '#2c3566' : '#171d3a';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = ready ? COLOURS.gold : '#2c3566';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ready ? COLOURS.text : COLOURS.textDim;
    ctx.font = '26px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(icons[name], r.x + r.w / 2, r.y + 26);
    ctx.font = '10px ' + FONT;
    ctx.fillText(ABILITY_LABELS[name], r.x + r.w / 2, r.y + 50);
    if (!ready) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 15px ' + FONT;
      ctx.fillText(Math.ceil(ab.cd) + 's', r.x + r.w / 2, r.y + 26);
    } else {
      ctx.fillStyle = COLOURS.textDim;
      ctx.font = '10px ' + FONT;
      ctx.fillText(`key ${i + 1}`, r.x + r.w / 2, r.y + 60);
    }
  }
  // surge active glow
  if (game.waveTime < game.surgeUntil) {
    ctx.strokeStyle = 'rgba(255,209,102,0.9)';
    ctx.lineWidth = 2;
    roundRect(ctx, abilityRect(2).x - 3, abilityRect(2).y - 3, 70, 70, 12);
    ctx.stroke();
  }
  // start wave
  const sw = startWaveRect();
  if (game.waveActive) {
    const left = game.spawnQueue.length + game.enemies.length;
    button(ctx, sw, `WAVE ${game.wave} · ${left} LEFT`, { fill: '#3a2f5e', disabled: true, font: 'bold 15px ' + FONT });
  } else if (game.wave >= TOTAL_WAVES) {
    button(ctx, sw, 'THE LIGHT HOLDS', { fill: '#2c6e4e', disabled: true, font: 'bold 15px ' + FONT });
  } else {
    const label = game.wave === 0 ? '▶ START WAVE 1' : `▶ START WAVE ${game.wave + 1}`;
    button(ctx, sw, label, { fill: '#8a6a2e', edge: COLOURS.gold, font: 'bold 16px ' + FONT });
  }
  // (the hint line lives on the title screen instead, so the bar stays clean)
}

function drawTowerPanel(ctx, game) {
  const tw = game.selectedTower;
  if (!tw) return;
  const p = towerPanelRect();
  const def = TOWER_TYPES[tw.type];
  const st = towerStats(tw.type, tw.tier);
  ctx.fillStyle = 'rgba(20,26,56,0.95)';
  roundRect(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.strokeStyle = COLOURS.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawTowerGlyph(ctx, tw.type, p.x + 28, p.y + 30, 1.0, tw.tier);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 16px ' + FONT;
  ctx.fillText(st.name, p.x + 56, p.y + 20);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '13px ' + FONT;
  ctx.fillText(`DMG ${Math.round(st.damage * tw.buffMult)} · RNG ${st.range} · ${st.rate.toFixed(1)}/s · Kills ${tw.kills}`, p.x + 56, p.y + 42);
  if (tw.tier < 3) {
    const cost = towerCost(tw.type, tw.tier + 1);
    button(ctx, upgradeButtonRect(), `UPGRADE — ${cost}g`, { fill: game.gold >= cost ? '#8a6a2e' : '#3a3a3a', font: 'bold 13px ' + FONT });
  } else {
    button(ctx, upgradeButtonRect(), 'MAX TIER', { fill: '#3a3a3a', disabled: true, font: 'bold 13px ' + FONT });
  }
  button(ctx, sellButtonRect(), `SELL +${sellValue(tw)}g`, { fill: '#5c2e3a', font: 'bold 13px ' + FONT });
}

function drawMessage(ctx, game) {
  if (game.waveTime < game.messageUntil && game.message) {
    ctx.font = 'bold 24px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(game.message).width + 44;
    ctx.fillStyle = 'rgba(10,14,36,0.85)';
    roundRect(ctx, VIEW_W / 2 - w / 2, 62, w, 44, 10);
    ctx.fill();
    ctx.strokeStyle = COLOURS.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLOURS.gold;
    ctx.fillText(game.message, VIEW_W / 2, 85);
  }
}

// ---- screens ----------------------------------------------------------------
function dim(ctx) {
  ctx.fillStyle = 'rgba(5,8,20,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, game, t) {
  dim(ctx);
  // glowing lighthouse silhouette behind the title
  ctx.fillStyle = 'rgba(255,233,168,0.10)';
  ctx.beginPath(); ctx.arc(VIEW_W / 2, 210, 150 + 10 * Math.sin(t), 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOURS.gold;
  ctx.font = 'bold 84px ' + FONT;
  ctx.fillText('LUMENFALL', VIEW_W / 2, 180);
  ctx.fillStyle = COLOURS.text;
  ctx.font = '22px ' + FONT;
  ctx.fillText('Defend the last lighthouse against the shadow siege', VIEW_W / 2, 250);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '16px ' + FONT;
  ctx.fillText('21 waves · 5 towers · 3 blessings · one light that must not fall', VIEW_W / 2, 284);
  button(ctx, playButtonRect(), '▶  PLAY', { fill: '#8a6a2e', edge: COLOURS.gold, font: 'bold 24px ' + FONT });
  button(ctx, howtoButtonRect(), 'HOW TO PLAY', { fill: '#232c52', font: 'bold 18px ' + FONT });
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '13px ' + FONT;
  ctx.fillText('Mouse to build · Keys 1 / 2 / 3 for blessings · P to pause · M to mute', VIEW_W / 2, 600);
  ctx.fillText('An original game — art, sound and music made in code', VIEW_W / 2, 624);
}

function drawHowto(ctx) {
  dim(ctx);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOURS.gold;
  ctx.font = 'bold 40px ' + FONT;
  ctx.fillText('HOW TO PLAY', VIEW_W / 2, 90);
  const lines = [
    ['GOAL', 'Stop the shadows reaching the lighthouse. Lose all 20 lives and the light falls.'],
    ['BUILD', 'Click a stone pad, then pick a tower card below. Towers fire on their own.'],
    ['UPGRADE', 'Click a tower to upgrade it (3 tiers) or sell it back for 70% of its cost.'],
    ['WAVES', 'Press START WAVE when ready. Clearing a wave pays a gold bonus. Wave 21 is the King.'],
    ['TOWERS', 'Ember burns · Frost chills · Storm chains · Mortar splashes · Lantern blesses neighbours.'],
    ['BLESSINGS', '1 Frost Nova freezes the road · 2 Sunburst scorches everything · 3 Beacon Surge doubles fire rate.'],
    ['ENEMIES', 'Wisps are fast · Husks are tough · Menders heal · Splitters split · Hexers shield · Golems shrug off splash.'],
  ];
  let y = 150;
  for (const [head, body] of lines) {
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOURS.gold;
    ctx.font = 'bold 17px ' + FONT;
    ctx.fillText(head, 220, y);
    ctx.fillStyle = COLOURS.text;
    ctx.font = '16px ' + FONT;
    ctx.fillText(body, 340, y);
    y += 52;
  }
  button(ctx, backButtonRect(), 'BACK', { fill: '#232c52', font: 'bold 18px ' + FONT });
}

function drawPaused(ctx) {
  dim(ctx);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 56px ' + FONT;
  ctx.fillText('PAUSED', VIEW_W / 2, 300);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '18px ' + FONT;
  ctx.fillText('Press P or click ▶ to keep defending the light', VIEW_W / 2, 360);
}

function drawGameOver(ctx, game) {
  dim(ctx);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOURS.life;
  ctx.font = 'bold 60px ' + FONT;
  ctx.fillText('THE LIGHT HAS FALLEN', VIEW_W / 2, 200);
  ctx.fillStyle = COLOURS.text;
  ctx.font = '20px ' + FONT;
  ctx.fillText(`The shadows reached the lighthouse on wave ${game.wave}.`, VIEW_W / 2, 270);
  ctx.fillText(`Score ${game.score} · Kills ${game.kills} · Gold earned ${game.goldEarned} · Towers built ${game.towersBuilt}`, VIEW_W / 2, 310);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '16px ' + FONT;
  ctx.fillText('The lighthouse can be relit. Try a new wall of towers.', VIEW_W / 2, 350);
  button(ctx, againButtonRect(), '↻  TRY AGAIN', { fill: '#8a6a2e', edge: COLOURS.gold, font: 'bold 20px ' + FONT });
  button(ctx, titleButtonRect(), 'TITLE SCREEN', { fill: '#232c52', font: 'bold 16px ' + FONT });
}

function drawVictory(ctx, game) {
  dim(ctx);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOURS.gold;
  ctx.font = 'bold 60px ' + FONT;
  ctx.fillText('THE DAWN BREAKS', VIEW_W / 2, 170);
  ctx.fillStyle = COLOURS.text;
  ctx.font = '22px ' + FONT;
  ctx.fillText('The Umbral King is unmade. The lighthouse burns bright again.', VIEW_W / 2, 230);
  const mins = Math.floor(game.timePlayed / 60);
  const secs = Math.floor(game.timePlayed % 60).toString().padStart(2, '0');
  ctx.font = '19px ' + FONT;
  ctx.fillText(`Score ${game.score}  ·  Kills ${game.kills}  ·  Lives left ${game.lives}  ·  Time ${mins}:${secs}`, VIEW_W / 2, 290);
  ctx.fillText(`Gold earned ${game.goldEarned}  ·  Towers built ${game.towersBuilt}  ·  Upgrades ${game.upgradesBought}`, VIEW_W / 2, 322);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '16px ' + FONT;
  ctx.fillText('All 21 waves held. You are the Keeper of the Light.', VIEW_W / 2, 360);
  button(ctx, againButtonRect(), '↻  PLAY AGAIN', { fill: '#8a6a2e', edge: COLOURS.gold, font: 'bold 20px ' + FONT });
  button(ctx, titleButtonRect(), 'TITLE SCREEN', { fill: '#232c52', font: 'bold 16px ' + FONT });
}

// ---- main draw --------------------------------------------------------------
export function draw(ctx, game, t) {
  ctx.save();
  ctx.translate(game.particles.shakeX, game.particles.shakeY);
  drawBackground(ctx, t);
  drawRoad(ctx);
  drawPads(ctx, game);
  drawLighthouse(ctx, game, t);
  drawTowers(ctx, game);
  drawEnemies(ctx, game, t);
  game.particles.draw(ctx);
  ctx.restore();
  drawHud(ctx, game);
  if (game.state === 'playing' || game.state === 'paused') drawBar(ctx, game);
  drawTowerPanel(ctx, game);
  drawMessage(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game, t);
  else if (game.state === 'howto') drawHowto(ctx);
  else if (game.state === 'paused') drawPaused(ctx);
  else if (game.state === 'gameover') drawGameOver(ctx, game);
  else if (game.state === 'victory') drawVictory(ctx, game);
}
