// LUMENFALL — the map: the shadow road, the lighthouse, and the build pads.
// The road snakes from the western dark to the lighthouse on the east cliff.
export const WAYPOINTS = [
  { x: -40, y: 110 },
  { x: 980, y: 110 },
  { x: 980, y: 290 },
  { x: 220, y: 290 },
  { x: 220, y: 470 },
  { x: 1080, y: 470 },
  { x: 1080, y: 360 },
  { x: 1210, y: 360 },
];

export const LIGHTHOUSE = { x: 1210, y: 360 };

// Build pads: stone circles in the open ground between road segments.
// Each pad holds one tower. Coordinates are pad centres.
export const PADS = [
  // top band, between the y=110 and y=290 runs
  { x: 120, y: 200 }, { x: 280, y: 200 }, { x: 440, y: 200 },
  { x: 600, y: 200 }, { x: 760, y: 200 }, { x: 890, y: 200 },
  // middle band, between the y=290 and y=470 runs
  { x: 100, y: 380 }, { x: 360, y: 380 }, { x: 520, y: 380 },
  { x: 680, y: 380 }, { x: 840, y: 380 }, { x: 980, y: 380 },
  // bottom band, below the y=470 run
  { x: 120, y: 560 }, { x: 280, y: 560 }, { x: 440, y: 560 },
  { x: 600, y: 560 }, { x: 760, y: 560 }, { x: 920, y: 560 },
];

export const PAD_RADIUS = 34;

// Total road length, for enemy progress (0..1 along the road).
export function roadLength() {
  let total = 0;
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const dx = WAYPOINTS[i].x - WAYPOINTS[i - 1].x;
    const dy = WAYPOINTS[i].y - WAYPOINTS[i - 1].y;
    total += Math.hypot(dx, dy);
  }
  return total;
}

export const ROAD_LENGTH = roadLength();

// Position + heading at a distance along the road.
export function pointOnRoad(dist) {
  let remaining = Math.max(0, dist);
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const a = WAYPOINTS[i - 1];
    const b = WAYPOINTS[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x),
      };
    }
    remaining -= seg;
  }
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  const prev = WAYPOINTS[WAYPOINTS.length - 2];
  return { x: last.x, y: last.y, angle: Math.atan2(last.y - prev.y, last.x - prev.x) };
}
