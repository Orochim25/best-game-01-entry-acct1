// LUMENFALL — deterministic screenshot scenes (?shot=title|play|boss|victory).
// Each scene stages a fixed game state with a seeded RNG and a fixed simulated
// time, so the same URL always renders the same picture. No wall clock, no audio.
import { makeRng } from './random.js';
import { SHOT } from './config.js';

const FIXED_DT = 1 / 60;

function simulate(game, secs) {
  const steps = Math.round(secs / FIXED_DT);
  for (let i = 0; i < steps; i++) game.update(FIXED_DT);
}

function stageTowers(game, plan) {
  game.gold = 99999;
  for (const [pad, type, tier] of plan) {
    game.placeTower(pad, type);
    const tw = game.towerAtPad(pad);
    while (tw && tw.tier < tier) game.upgradeTower(tw);
  }
  game.gold = 620;
}

// Mid-fight: a wall of towers holds wave 5 while shadows press down the road.
function stagePlay(game) {
  game.startGame();
  stageTowers(game, [
    [0, 'ember', 2], [1, 'frost', 2], [2, 'ember', 1], [5, 'storm', 2],
    [7, 'mortar', 1], [8, 'lantern', 1], [11, 'ember', 2], [13, 'storm', 1],
    [15, 'frost', 1], [16, 'mortar', 2],
  ]);
  game.wave = 4;
  game.startWave();
  simulate(game, 13);
  game.flash('WAVE 5 — hold the road!');
}

// The final wave: the Umbral King lumbers down the road under heavy fire.
function stageBoss(game) {
  game.startGame();
  stageTowers(game, [
    [0, 'ember', 3], [1, 'ember', 3], [2, 'storm', 3], [5, 'mortar', 3],
    [6, 'lantern', 2], [7, 'ember', 3], [8, 'storm', 2], [11, 'mortar', 2],
    [12, 'frost', 2], [13, 'ember', 2], [15, 'storm', 3], [16, 'mortar', 3],
  ]);
  game.wave = 20;
  game.startWave();
  // 18s in, the King is mid-road under heavy fire (no frost on the top road,
  // so he is not crawling); the start banner has expired, so nothing covers him.
  simulate(game, 18);
}

// The dawn breaks: a finished run, with its stats on the victory screen.
function stageVictory(game) {
  game.startGame();
  stageTowers(game, [
    [0, 'ember', 3], [1, 'frost', 2], [5, 'storm', 3], [7, 'mortar', 3], [8, 'lantern', 3],
  ]);
  game.state = 'victory';
  game.wave = 21;
  game.score = 12840;
  game.kills = 347;
  game.goldEarned = 3210;
  game.lives = 14;
  game.towersBuilt = 12;
  game.upgradesBought = 9;
  game.timePlayed = 754;
  game.leaked = 6;
  game.message = '';
}

export function applyShot(game, search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot') || 'title';
  const seed = parseInt(params.get('seed') || '1', 10) || 1;
  const rng = makeRng(seed * 7919 + 13);
  const realRandom = Math.random;
  Math.random = rng;
  try {
    if (shot === 'play') stagePlay(game);
    else if (shot === 'boss') stageBoss(game);
    else if (shot === 'victory') stageVictory(game);
    // title: the game stays on its title screen
  } finally {
    Math.random = realRandom;
  }
  game.shotMode = shot;
  // Fixed render clock for the shot: no wall clock anywhere in the picture.
  game.shotTime = shot === 'title' ? 3.0 : 6.5;
  window.__shotReady = true;
  return shot;
}
