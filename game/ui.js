// LUMENFALL — UI layout: every clickable rect in one place, so render.js and
// input.js always agree on where a button is.
import { VIEW_W, VIEW_H, BAR_H } from './config.js';
import { TOWER_ORDER } from './towers.js';

export const BAR_Y = VIEW_H - BAR_H; // 600

// Tower shop: five cards along the bottom bar.
export function shopCardRect(i) {
  return { x: 14 + i * 158, y: BAR_Y + 12, w: 150, h: 96 };
}

export function shopCardForType(type) {
  return shopCardRect(TOWER_ORDER.indexOf(type));
}

// Abilities: three square buttons right of the shop.
export function abilityRect(i) {
  return { x: 824 + i * 72, y: BAR_Y + 26, w: 64, h: 64 };
}

export const ABILITY_NAMES = ['frostNova', 'sunburst', 'surge'];
export const ABILITY_LABELS = { frostNova: 'FROST', sunburst: 'SUNBURST', surge: 'SURGE' };

// Start wave / wave progress button, far right of the bar.
export function startWaveRect() {
  return { x: 1060, y: BAR_Y + 16, w: 206, h: 56 };
}

// Small round buttons on the top HUD bar.
export function pauseRect() {
  return { x: VIEW_W - 96, y: 8, w: 40, h: 32 };
}
export function muteRect() {
  return { x: VIEW_W - 50, y: 8, w: 40, h: 32 };
}

// Selected-tower panel, floating above the bar on the left.
export function towerPanelRect() {
  return { x: 14, y: BAR_Y - 122, w: 320, h: 110 };
}
export function upgradeButtonRect() {
  const p = towerPanelRect();
  return { x: p.x + 14, y: p.y + 66, w: 140, h: 32 };
}
export function sellButtonRect() {
  const p = towerPanelRect();
  return { x: p.x + 166, y: p.y + 66, w: 140, h: 32 };
}

// Title screen buttons.
export function playButtonRect() {
  return { x: VIEW_W / 2 - 130, y: 430, w: 260, h: 62 };
}
export function howtoButtonRect() {
  return { x: VIEW_W / 2 - 130, y: 508, w: 260, h: 52 };
}
export function backButtonRect() {
  return { x: VIEW_W / 2 - 110, y: 620, w: 220, h: 52 };
}

// Game over / victory buttons.
export function againButtonRect() {
  return { x: VIEW_W / 2 - 140, y: 480, w: 280, h: 58 };
}
export function titleButtonRect() {
  return { x: VIEW_W / 2 - 140, y: 552, w: 280, h: 48 };
}

export function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
