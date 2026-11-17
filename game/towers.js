// LUMENFALL — tower types. Five roles, three tiers each. Tier 1 is bought on a
// pad; tiers 2 and 3 are upgrades of the tower already standing there.
// damage = per shot. rate = shots per second. range = pixels. slow = slow factor
// applied by frost (1 = no slow). splash = radius of area damage (0 = single).
export const TOWER_TYPES = {
  ember: {
    name: 'Ember Spire',
    short: 'Ember',
    role: 'Single-target fire',
    icon: 'flame',
    colour: '#ff8c42',
    glow: '#ffb347',
    cost: 50,
    tiers: [
      { name: 'Ember Spire', damage: 14, rate: 1.5, range: 150, splash: 0, slow: 0, cost: 50 },
      { name: 'Blaze Spire', damage: 26, rate: 1.7, range: 165, splash: 0, slow: 0, cost: 70 },
      { name: 'Inferno Spire', damage: 52, rate: 1.9, range: 180, splash: 34, slow: 0, cost: 130 },
    ],
  },
  frost: {
    name: 'Frost Obelisk',
    short: 'Frost',
    role: 'Slows enemies',
    icon: 'snow',
    colour: '#7fd4ff',
    glow: '#c8ecff',
    cost: 60,
    tiers: [
      { name: 'Frost Obelisk', damage: 5, rate: 1.0, range: 140, splash: 0, slow: 0.45, cost: 60 },
      { name: 'Glacial Obelisk', damage: 9, rate: 1.1, range: 155, splash: 0, slow: 0.35, cost: 80 },
      { name: 'Permafrost Obelisk', damage: 16, rate: 1.2, range: 175, splash: 0, slow: 0.25, cost: 150 },
    ],
  },
  storm: {
    name: 'Storm Coil',
    short: 'Storm',
    role: 'Chain lightning',
    icon: 'bolt',
    colour: '#ffe14d',
    glow: '#fff3a0',
    cost: 80,
    tiers: [
      { name: 'Storm Coil', damage: 11, rate: 1.1, range: 160, splash: 0, slow: 0, chain: 2, cost: 80 },
      { name: 'Tempest Coil', damage: 18, rate: 1.25, range: 175, splash: 0, slow: 0, chain: 3, cost: 110 },
      { name: 'Skywrath Coil', damage: 30, rate: 1.4, range: 190, splash: 0, slow: 0, chain: 5, cost: 190 },
    ],
  },
  mortar: {
    name: 'Thorn Mortar',
    short: 'Mortar',
    role: 'Splash damage',
    icon: 'bomb',
    colour: '#b6ff5e',
    glow: '#dcffb0',
    cost: 90,
    tiers: [
      { name: 'Thorn Mortar', damage: 30, rate: 0.55, range: 210, splash: 62, slow: 0, cost: 90 },
      { name: 'Bramble Mortar', damage: 52, rate: 0.6, range: 225, splash: 74, slow: 0, cost: 120 },
      { name: 'Cataclysm Mortar', damage: 96, rate: 0.65, range: 240, splash: 92, slow: 0, cost: 210 },
    ],
  },
  lantern: {
    name: 'Sun Lantern',
    short: 'Lantern',
    role: 'Buffs towers',
    icon: 'sun',
    colour: '#ffd166',
    glow: '#fff0b3',
    cost: 70,
    tiers: [
      { name: 'Sun Lantern', damage: 4, rate: 1.0, range: 130, splash: 0, slow: 0, buff: 1.25, cost: 70 },
      { name: 'Beacon Lantern', damage: 7, rate: 1.1, range: 145, splash: 0, slow: 0, buff: 1.4, cost: 95 },
      { name: 'Radiance Lantern', damage: 12, rate: 1.25, range: 165, splash: 0, slow: 0, buff: 1.6, cost: 170 },
    ],
  },
};

export const TOWER_ORDER = ['ember', 'frost', 'storm', 'mortar', 'lantern'];

export function towerStats(type, tier) {
  return TOWER_TYPES[type].tiers[tier - 1];
}

export function towerCost(type, tier) {
  return TOWER_TYPES[type].tiers[tier - 1].cost;
}

// Sell value: 70% of everything sunk into the tower.
export function sellValue(tower) {
  let spent = 0;
  for (let t = 1; t <= tower.tier; t++) spent += towerCost(tower.type, t);
  return Math.floor(spent * 0.7);
}
