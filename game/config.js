// LUMENFALL — tuning constants. One place for every number that shapes balance.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const PLAY_H = 600; // playfield height; the bottom 120px is the command bar
export const BAR_H = 120;

export const START_GOLD = 240;
export const START_LIVES = 20;
export const TOTAL_WAVES = 21; // 20 regular waves + wave 21, the Umbral King
export const BOSS_WAVE = 21;
export const KILL_GOLD_BONUS = 1.0;
export const WAVE_CLEAR_BONUS = (wave) => 24 + wave * 6;

export const PATH_WIDTH = 56;
export const LEAK_X = 1196; // enemies reaching this x hit the lighthouse

// Ability cooldowns (seconds)
export const ABILITY = {
  frostNova: { cooldown: 26, freezeSecs: 3.2, key: '1' },
  sunburst: { cooldown: 34, damage: 260, key: '2' },
  surge: { cooldown: 30, duration: 8, rateMult: 2.0, key: '3' },
};

export const COLOURS = {
  night: '#0b1026',
  night2: '#11173a',
  ground: '#1a2350',
  ground2: '#141b3d',
  path: '#3a2f5e',
  pathEdge: '#574a86',
  gold: '#ffd166',
  goldDim: '#b98a2e',
  life: '#ff5d73',
  text: '#f4ead8',
  textDim: '#aab3d6',
  panel: '#141a38',
  panelEdge: '#2c3566',
  lighthouse: '#ffe9a8',
};

// Deterministic shot scenes render at fixed simulated times, never wall clock.
export const SHOT = {
  title: { seed: 7 },
  play: { seed: 11, simSecs: 26 },
  boss: { seed: 21, simSecs: 18 },
  victory: { seed: 31 },
};
