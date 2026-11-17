// LUMENFALL — the shadow creatures. Each kind has a job on the road:
// fast ones slip past, tanks soak fire, menders heal, splitters multiply,
// hexers shield, golems shrug off splash, and the Umbral King ends the siege.
export const ENEMY_KINDS = {
  shade: {
    name: 'Shade', hp: 46, speed: 56, gold: 5, lives: 1, radius: 13,
    colour: '#8b7fd4', dark: '#5a4fa3', flying: false, kind: 'walker',
  },
  wisp: {
    name: 'Swift Wisp', hp: 26, speed: 102, gold: 5, lives: 1, radius: 10,
    colour: '#c9b8ff', dark: '#8f7fd4', flying: false, kind: 'fast',
  },
  husk: {
    name: 'Husk', hp: 150, speed: 36, gold: 9, lives: 2, radius: 17,
    colour: '#6f7f9e', dark: '#46536e', flying: false, kind: 'tank',
  },
  batwing: {
    name: 'Batwing', hp: 40, speed: 88, gold: 7, lives: 1, radius: 11,
    colour: '#d47fd4', dark: '#96439b', flying: true, kind: 'flying',
  },
  mender: {
    name: 'Mender', hp: 70, speed: 48, gold: 10, lives: 1, radius: 13,
    colour: '#7fe0a8', dark: '#3f9e66', flying: false, kind: 'healer', heal: 9, healRadius: 90,
  },
  splitter: {
    name: 'Splitter', hp: 64, speed: 52, gold: 7, lives: 1, radius: 14,
    colour: '#ff9d5c', dark: '#c96a2e', flying: false, kind: 'splitter', splitsInto: 'wisp', splitCount: 2,
  },
  hexer: {
    name: 'Hexer', hp: 90, speed: 44, gold: 11, lives: 1, radius: 13,
    colour: '#ff7f9e', dark: '#b23a5c', flying: false, kind: 'shield', shield: 40, shieldRadius: 100,
  },
  golem: {
    name: 'Golem', hp: 320, speed: 30, gold: 16, lives: 3, radius: 20,
    colour: '#9e9e9e', dark: '#5f5f5f', flying: false, kind: 'armored', splashResist: 0.5,
  },
  king: {
    name: 'Umbral King', hp: 5200, speed: 30, gold: 400, lives: 10, radius: 34,
    colour: '#2b1d4e', dark: '#120a24', flying: false, kind: 'boss', spawnsWisps: true,
  },
};

export const ENEMY_ORDER = ['shade', 'wisp', 'husk', 'batwing', 'mender', 'splitter', 'hexer', 'golem'];

// HP grows with the wave so the siege keeps pressing.
export function scaledHp(kind, wave) {
  const base = ENEMY_KINDS[kind].hp;
  const growth = 1 + (wave - 1) * 0.34 + Math.max(0, wave - 10) * 0.08;
  return Math.round(base * growth);
}

export function scaledGold(kind, wave) {
  const base = ENEMY_KINDS[kind].gold;
  return base + Math.floor(wave / 5);
}
