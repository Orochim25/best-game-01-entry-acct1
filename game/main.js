// LUMENFALL — bootstrap: canvas, resize, the frame loop, and shot mode.
// Normal play runs on requestAnimationFrame with a clamped delta. Shot mode
// (?shot=...) stages a fixed scene once and renders it with a fixed clock.
import { VIEW_W, VIEW_H } from './config.js';
import { Game } from './game.js';
import { draw } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

const game = new Game();
attachInput(canvas, game);
window.__game = game; // for playtesting from the console

const params = new URLSearchParams(window.location.search);
const isShot = params.has('shot');

if (isShot) {
  applyShot(game, window.location.search);
  // One frozen frame: the staged scene, fixed clock, no updates.
  draw(ctx, game, game.shotTime);
  requestAnimationFrame(() => draw(ctx, game, game.shotTime));
} else {
  let last = performance.now();
  let t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    game.update(dt);
    draw(ctx, game, t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
