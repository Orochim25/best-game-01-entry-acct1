// LUMENFALL — the siege schedule: 20 waves that teach, press and swarm, then
// wave 21, the Umbral King. A wave is a list of spawn groups; each group names
// a kind, a count, a gap between spawns, and a delay before it starts.
function g(kind, count, gap, delay = 0) {
  return { kind, count, gap, delay };
}

export const WAVES = [
  // 1 — first shades, gentle.
  [g('shade', 8, 1.1)],
  // 2 — more shades, tighter.
  [g('shade', 12, 0.9)],
  // 3 — wisps arrive: fast, fragile.
  [g('shade', 8, 0.9), g('wisp', 6, 0.7, 4)],
  // 4 — husks, the first walls.
  [g('shade', 10, 0.8), g('husk', 3, 1.6, 5)],
  // 5 — wisp swarm.
  [g('wisp', 14, 0.55), g('shade', 8, 0.8, 6)],
  // 6 — batwings over the road.
  [g('batwing', 8, 0.8), g('shade', 10, 0.8, 4)],
  // 7 — husks in a column.
  [g('husk', 6, 1.4), g('wisp', 10, 0.6, 5)],
  // 8 — menders keep the line alive.
  [g('shade', 12, 0.75), g('mender', 3, 2.0, 4), g('batwing', 6, 0.7, 8)],
  // 9 — splitters multiply.
  [g('splitter', 8, 1.0), g('wisp', 10, 0.55, 5)],
  // 10 — the first golem.
  [g('golem', 1, 1.0), g('shade', 14, 0.65, 3), g('husk', 4, 1.4, 8)],
  // 11 — hexers shield the march.
  [g('hexer', 3, 1.8), g('shade', 12, 0.7, 3), g('batwing', 8, 0.65, 6)],
  // 12 — night swarm.
  [g('wisp', 20, 0.45), g('splitter', 6, 0.9, 6), g('mender', 2, 2.0, 9)],
  // 13 — golem pair.
  [g('golem', 2, 2.5), g('husk', 6, 1.2, 3), g('batwing', 10, 0.6, 7)],
  // 14 — menders behind husks.
  [g('husk', 8, 1.1), g('mender', 4, 1.8, 4), g('shade', 12, 0.6, 8)],
  // 15 — everything at once.
  [g('wisp', 16, 0.5), g('splitter', 8, 0.9, 4), g('hexer', 3, 1.6, 8), g('batwing', 10, 0.6, 10)],
  // 16 — golem wall.
  [g('golem', 3, 2.2), g('shade', 16, 0.55, 3), g('mender', 3, 1.8, 8)],
  // 17 — the dark tide.
  [g('shade', 20, 0.5), g('husk', 8, 1.0, 5), g('wisp', 16, 0.45, 9)],
  // 18 — hexer phalanx.
  [g('hexer', 5, 1.5), g('golem', 2, 2.2, 3), g('batwing', 14, 0.55, 6)],
  // 19 — the last swarm before the King.
  [g('splitter', 10, 0.8), g('wisp', 22, 0.42, 4), g('mender', 4, 1.7, 8), g('husk', 6, 1.1, 10)],
  // 20 — golem vanguard.
  [g('golem', 4, 2.0), g('hexer', 4, 1.5, 3), g('shade', 18, 0.5, 6), g('batwing', 12, 0.55, 9)],
  // 21 — THE UMBRAL KING, with an escort of wisps.
  [g('king', 1, 1.0), g('wisp', 10, 0.7, 6), g('mender', 2, 2.5, 10)],
];

export function waveCount(wave) {
  return WAVES[wave - 1].reduce((sum, grp) => sum + grp.count, 0);
}

export function waveLabel(wave) {
  if (wave === 21) return 'FINAL WAVE — THE UMBRAL KING';
  return `WAVE ${wave} / 20`;
}
