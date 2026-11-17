// LUMENFALL — input: mouse clicks on pads, cards, buttons and panels, plus
// keyboard shortcuts. Converts client pixels to game coordinates (the canvas
// is scaled to fit the window, so every click is divided by the scale).
import { VIEW_W, VIEW_H } from './config.js';
import { TOWER_ORDER } from './towers.js';
import {
  shopCardRect, abilityRect, startWaveRect, pauseRect, muteRect,
  upgradeButtonRect, sellButtonRect, playButtonRect, howtoButtonRect,
  backButtonRect, againButtonRect, titleButtonRect, ABILITY_NAMES, inRect,
} from './ui.js';
import { unlockAudio, startMusic, setMuted, isMuted, sfx } from './audio.js';

export function attachInput(canvas, game) {
  function toGame(ev) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
    const ox = (rect.width - VIEW_W * scale) / 2;
    const oy = (rect.height - VIEW_H * scale) / 2;
    return {
      x: (ev.clientX - rect.left - ox) / scale,
      y: (ev.clientY - rect.top - oy) / scale,
    };
  }

  function firstGesture() {
    unlockAudio();
    startMusic();
  }

  canvas.addEventListener('pointerdown', (ev) => {
    firstGesture();
    const { x, y } = toGame(ev);
    game.hover = { x, y };
    click(game, x, y);
  });

  canvas.addEventListener('pointermove', (ev) => {
    const { x, y } = toGame(ev);
    game.hover = { x, y };
    game.hoverPad = game.state === 'playing' ? game.padAt(x, y) : -1;
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    firstGesture();
    const k = ev.key.toLowerCase();
    if (k === 'm') { setMuted(!isMuted()); return; }
    if (k === 'escape') {
      if (game.state === 'howto') game.state = 'title';
      else if (game.state === 'playing' || game.state === 'paused') game.togglePause();
      return;
    }
    if (k === 'p' || k === ' ') {
      if (game.state === 'playing' || game.state === 'paused') { game.togglePause(); sfx.click(); }
      else if (game.state === 'title') game.startGame();
      return;
    }
    if (k === 'enter') {
      if (game.state === 'title') game.startGame();
      else if (game.state === 'gameover' || game.state === 'victory') game.startGame();
      return;
    }
    if (game.state !== 'playing') return;
    if (k === '1') game.useAbility('frostNova');
    else if (k === '2') game.useAbility('sunburst');
    else if (k === '3') game.useAbility('surge');
    else if (k === 'w' || k === 'n') game.startWave();
    else if (k === 'u' && game.selectedTower) game.upgradeTower(game.selectedTower);
  });
}

function click(game, x, y) {
  // HUD buttons work in every state
  if (inRect(x, y, muteRect())) { setMuted(!isMuted()); sfx.click(); return; }
  if (inRect(x, y, pauseRect())) {
    if (game.state === 'playing' || game.state === 'paused') { game.togglePause(); sfx.click(); }
    return;
  }

  if (game.state === 'title') {
    if (inRect(x, y, playButtonRect())) { sfx.click(); game.startGame(); }
    else if (inRect(x, y, howtoButtonRect())) { sfx.click(); game.state = 'howto'; }
    return;
  }
  if (game.state === 'howto') {
    if (inRect(x, y, backButtonRect())) { sfx.click(); game.state = 'title'; }
    return;
  }
  if (game.state === 'gameover' || game.state === 'victory') {
    if (inRect(x, y, againButtonRect())) { sfx.click(); game.startGame(); }
    else if (inRect(x, y, titleButtonRect())) { sfx.click(); game.toTitle(); }
    return;
  }
  if (game.state === 'paused') return;
  if (game.state !== 'playing') return;

  // selected-tower panel
  if (game.selectedTower) {
    if (inRect(x, y, upgradeButtonRect())) { game.upgradeTower(game.selectedTower); return; }
    if (inRect(x, y, sellButtonRect())) { game.sellTower(game.selectedTower); return; }
  }

  // shop cards
  for (let i = 0; i < TOWER_ORDER.length; i++) {
    if (inRect(x, y, shopCardRect(i))) {
      game.shopType = TOWER_ORDER[i];
      game.selectedTower = null;
      sfx.click();
      return;
    }
  }
  // abilities
  for (let i = 0; i < ABILITY_NAMES.length; i++) {
    if (inRect(x, y, abilityRect(i))) { game.useAbility(ABILITY_NAMES[i]); return; }
  }
  // start wave
  if (inRect(x, y, startWaveRect())) { game.startWave(); return; }

  // pads
  const pad = game.padAt(x, y);
  if (pad >= 0) {
    const tower = game.towerAtPad(pad);
    if (tower) {
      game.selectedTower = tower;
      sfx.click();
    } else {
      game.selectedTower = null;
      game.placeTower(pad, game.shopType);
    }
    return;
  }
  // clicked empty ground: deselect
  game.selectedTower = null;
}
