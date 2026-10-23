// Fig 1: the closed loop. A test bench: the edge controller in the middle of a ruled plate,
// wired to four simulator modules. Solar is wired to the grid meter, not the controller,
// because the controller only ever sees the net at the meter.
//   node src/figures/testbed/build.mjs        writes figure.html + figure.json next to this file
//   node src/figures/testbed/build.mjs --page writes a standalone page for anatomy's checks
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as k from '../kit/iso-kit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 640;
const HEIGHT = 420;

const PLATE = { x: -152, y: -98, w: 304, d: 196, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Controller (Raspberry Pi in a case on a DIN block).
const DIN = { x: -28, y: -20, w: 56, d: 40, r: 2 };
const CASE = { x: -22, y: -15, w: 44, d: 30, r: 4 };
const CASE_Z = 5.2;
const CASE_TOP = 24;

// Simulator modules. sx, sy: which quadrant.
const CHARGER = { plinth: { x: -115, y: -67, w: 30, d: 24, r: 2 }, post: { x: -110, y: -62, w: 20, d: 14, r: 2 }, top: 76 };
const METER = { plan: { x: 80, y: -72, w: 40, d: 34, r: 3 }, top: 44, dial: [100, -55], r: 12.5 };
const BATTERY = { plan: { x: -123, y: 36, w: 46, d: 38, r: 2 }, top: 52 };
const SOLAR = { frame: { x: 68, y: 38, w: 64, d: 38, r: 1.2 }, z: 15 };

// Wire routes on the plate (z = 0.6): controller pad, corner, module pad.
const Z = 0.6;
const routes = {
  meter: [[34, -24], [34, -55], [73, -55]],
  charger: [[-34, -24], [-34, -55], [-78, -55]],
  battery: [[-34, 24], [-34, 55], [-70, 55]],
  solar: [[100, 31], [100, -31]],
};
const pads = [
  ...Object.values(routes).flatMap((r) => [r[0], r[r.length - 1]]),
];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [-110, -62, CHARGER.top + 2], [-90, -48, CHARGER.top + 2], [120, -38, METER.top + 6]],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 45 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (x, y) => k.depthOf([x, y, 0], P);
const byDepth = (points) => [...points].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
const closed = (pts) => k.pathOf(pts.map(at), true);
// A closed rectangle on a vertical face: x = const ('x') or y = const ('y').
const faceRect = (axis, at0, a0, a1, z0, z1) =>
  closed(axis === 'x'
    ? [[at0, a0, z0], [at0, a1, z0], [at0, a1, z1], [at0, a0, z1]]
    : [[a0, at0, z0], [a1, at0, z0], [a1, at0, z1], [a0, at0, z1]]);

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: 'lo' }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: 'mid' }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(PLATE, -5, P, 8), { tone: 'faint' }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: 'lo' }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler strip along the front edge.
  const strip = { x: -118, y: PLATE.y + PLATE.d - 15, w: 236, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // Label plate, back edge.
  const label = { x: 12, y: -90, w: 46, d: 14, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: 'lo', crease: 'none' }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: 'faint' }));
  out.push(L([[16, 30], [16, 22], [16, 26]].map(([x0, len], i) => k.lineOnTop([label.x + 6, label.y + 4 + i * 3], [label.x + 6 + len, label.y + 4 + i * 3], 0.8, P)).join(''), { tone: 'lo', free: true }));
  out.push(D([at([label.x + 3, label.y + 7, 0.8]), at([label.x + label.w - 3, label.y + 7, 0.8])], { size: 0.4 }));
  return out.join('');
}

// Cables lie on the plate. Each is drawn before anything standing, so standing parts hide it correctly.
function wires() {
  return Object.entries(routes)
    .map(([name, r]) => `<g data-wire="${name}">${k.wireSvg(at([...r[0], Z]), at([...r[r.length - 1], Z]), { via: r.slice(1, -1).map((p) => at([...p, Z])), tone: 'mid', size: 1.1 })}</g>`)
    .join('');
}

function padsSvg() {
  return byDepth(pads)
    .map(([x, y]) => S(k.slabOf({ x: x - 3.5, y: y - 3.5, w: 7, d: 7, r: 1.2 }, 0, 2.2, P, 3, 0.4), { tone: 'mid' }) + L(k.ring(x, y, 1.4, 2.2, P, 12), { tone: 'lo' }))
    .join('');
}

function controller() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(DIN, 2), 0, 4, P)}"/>`];
  out.push(S(k.slabOf(DIN, 0, 4, P, 3, 0.5), { tone: 'mid' }));
  out.push(D(k.corners(DIN, 3).map(([x, y]) => at([x, y, 4])), { size: 0.45 }));
  // DIN rail running the length of the block.
  out.push(S(k.slabOf({ x: -27, y: -3.5, w: 54, d: 7, r: 0.6 }, 4, 1.2, P, 2), { tone: 'lo', crease: 'none' }));
  out.push(S(k.slabOf(CASE, CASE_Z, CASE_TOP - CASE_Z, P, 6, 1), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(CASE, 19, P, 6), { tone: 'faint' }) }));
  // Vent slots on the lid: closed outlines.
  for (let i = 0; i < 5; i++) out.push(L(k.planOutline({ x: -16 + i * 5, y: -10, w: 2.4, d: 14, r: 1.2 }, CASE_TOP, P, 3), { tone: 'lo' }));
  out.push(L(k.planOutline({ x: 10, y: -10, w: 8, d: 8, r: 1 }, CASE_TOP, P, 3), { tone: 'faint' }));
  // Ports on the +x face: two RJ45 blocks and a USB pair.
  out.push(S(k.slabOf({ x: 22, y: -11, w: 2.4, d: 8, r: 0.4 }, 7, 6, P, 2), { tone: 'mid', crease: 'none' }));
  out.push(S(k.slabOf({ x: 22, y: -1, w: 2.4, d: 8, r: 0.4 }, 7, 6, P, 2), { tone: 'mid', crease: 'none' }));
  out.push(S(k.slabOf({ x: 22, y: 9, w: 1.6, d: 4.4, r: 0.3 }, 8, 3, P, 2), { tone: 'lo', crease: 'none' }));
  // Status LEDs on the +y face; the live one is drawn separately (data-part="leds").
  out.push(L(faceRect('y', 15, -16, -4, 10, 14), { tone: 'lo' }));
  out.push(D([[-13, 15, 12], [-10, 15, 12], [-7, 15, 12]].map(at), { size: 0.55, tone: 'mid' }));
  out.push(D(k.corners(CASE, 3).map(([x, y]) => at([x, y, CASE_TOP])), { size: 0.4 }));
  return out.join('');
}

function charger() {
  const { plinth, post, top } = CHARGER;
  const out = [`<path class="iso-halo" d="${k.haloOf(plinth, 0, 4, P)}"/>`];
  out.push(S(k.slabOf(plinth, 0, 4, P, 3, 0.5), { tone: 'mid' }));
  out.push(D(k.corners(plinth, 2.5).map(([x, y]) => at([x, y, 4])), { size: 0.45 }));
  out.push(S(k.slabOf(post, 4, top - 4 - 3, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(post, 22, P, 4), { tone: 'faint' }) }));
  out.push(S(k.slabOf(k.insetPlan(post, -1.6), top - 3, 3, P, 4, 0.6), { tone: 'mid' }));
  // Screen and its bezel on the +x face; a card-reader pad below it.
  out.push(L(faceRect('x', post.x + post.w, -59, -51, 54, 66), { tone: 'lo' }));
  out.push(L(faceRect('x', post.x + post.w, -58, -52, 55.5, 64.5), { tone: 'mid' }));
  out.push(L(faceRect('x', post.x + post.w, -58, -52, 44, 50), { tone: 'faint' }));
  // Holster on the +y face, and the cable coiling down to the plate and back up into it.
  out.push(S(k.slabOf({ x: -105, y: -48, w: 10, d: 4, r: 1 }, 34, 12, P, 3, 0.4), { tone: 'mid' }));
  out.push(S(k.slabOf({ x: -103, y: -44, w: 6, d: 5, r: 1.5 }, 38, 7, P, 3, 0.4), { tone: 'hi', crease: 'lo' }));
  // The cable hangs in one smooth loop from a gland on the post to the bottom of the plug.
  const cable = Array.from({ length: 25 }, (_, i) => {
    const s = i / 24;
    const bow = Math.sin(Math.PI * s);
    return [-96 - 4 * s, -48 + 6.5 * s + 10 * bow, 18 + 20 * s - 26 * bow ** 1.4];
  });
  out.push(S(k.slabOf({ x: -98, y: -48, w: 4, d: 1.2, r: 0.4 }, 16, 4, P, 2), { tone: 'mid', crease: 'none' }));
  out.push(`<g style="--anatomy-weight:1.3px">${k.wireSvg(at(cable[0]), at(cable[24]), { via: cable.slice(1, -1).map(at), tone: 'mid', size: 0.8 })}</g>`);
  return out.join('');
}

const NEEDLE = { min: -1.05, max: 1.05 };
const needleAt = (value) => {
  const [x, y] = METER.dial;
  const a = NEEDLE.min + (NEEDLE.max - NEEDLE.min) * value;
  return k.lineOnTop([x - Math.sin(a) * 2.6, y + Math.cos(a) * 2.6], [x + Math.sin(a) * (METER.r - 3.4), y - Math.cos(a) * (METER.r - 3.4)], METER.top + 5.2, P);
};

function meter() {
  const { plan, top, dial, r } = METER;
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, 0, top, P)}"/>`];
  out.push(S(k.slabOf(plan, 0, top, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(plan, 5, P, 4), { tone: 'faint' }) }));
  // Door on the +y face with hinge pins and a latch.
  const face = plan.y + plan.d;
  out.push(L(faceRect('y', face, 84, 116, 9, 38), { tone: 'lo' }));
  out.push(S(k.slabOf({ x: 111, y: face, w: 3, d: 1.6, r: 0.5 }, 21, 5, P, 2), { tone: 'hi', crease: 'none' }));
  out.push(D([[85.5, face, 13], [85.5, face, 34]].map(at), { size: 0.5, tone: 'hi' }));
  // Vent slots on the +x face.
  for (let i = 0; i < 4; i++) out.push(L(faceRect('x', plan.x + plan.w, -66 + i * 6.5, -62 + i * 6.5, 24, 36), { tone: 'lo' }));
  // Dial, face up.
  const [x, y] = dial;
  out.push(S(k.cylinder(x, y, r + 1.4, top, 1.4, P, 48), { tone: 'mid' }));
  out.push(S(k.cylinder(x, y, r, top + 1.4, 3.8, P, 64, 0.6), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.ring(x, y, r - 1.8, top + 5.2, P, 64), { tone: 'lo' }));
  const t = k.radialTicks(x, y, r - 2.4, 24, 4, top + 5.2, [1.1, 2.2], P, NEEDLE.min, NEEDLE.max - NEEDLE.min);
  out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }));
  out.push(L(k.ring(x, y, 1.3, top + 5.2, P, 16), { tone: 'mid' }));
  out.push(D(k.corners(plan, 3).map(([px, py]) => at([px, py, top])), { size: 0.45 }));
  return out.join('');
}

function battery() {
  const { plan, top } = BATTERY;
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, 0, top, P)}"/>`];
  const seams = [4, 17, 30, 43].map((z) => L(k.sideSeam(plan, z, P, 3), { tone: 'lo' })).join('');
  out.push(S(k.slabOf(plan, 0, top, P, 3, 0.8), { tone: 'mid', inner: seams }));
  // One handle per module on the +x face.
  for (const z of [9, 22, 35]) out.push(S(k.slabOf({ x: plan.x + plan.w, y: 49, w: 2.2, d: 12, r: 0.8 }, z, 3, P, 2, 0.3), { tone: 'hi', crease: 'lo' }));
  // Vent slots on the +y face of each module.
  const face = plan.y + plan.d;
  for (const z of [8, 21, 34]) for (let i = 0; i < 4; i++) out.push(L(faceRect('y', face, -118 + i * 6, -114 + i * 6, z, z + 6), { tone: 'faint' }));
  // Terminals and a busbar on top.
  for (const [tx, ty] of [[-114, 48], [-86, 48]]) {
    out.push(S(k.cylinder(tx, ty, 3.4, top, 2, P, 24), { tone: 'mid' }));
    out.push(S(k.cylinder(tx, ty, 2, top + 2, 3, P, 20), { tone: 'hi', crease: 'lo' }));
  }
  out.push(S(k.slabOf({ x: -116, y: 60, w: 32, d: 5, r: 1 }, top, 1.2, P, 2), { tone: 'lo', crease: 'none' }));
  out.push(D(k.corners(plan, 3).map(([px, py]) => at([px, py, top])), { size: 0.45 }));
  return out.join('');
}

function solar() {
  const { frame, z } = SOLAR;
  const out = [`<path class="iso-halo" d="${k.haloOf(frame, 0, z, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(frame, 4))) {
    out.push(S(k.cylinder(x, y, 3.2, 0, 1.4, P, 20), { tone: 'lo' }));
    out.push(S(k.cylinder(x, y, 1.8, 1.4, z - 1.4, P, 16), { tone: 'mid', crease: 'none' }));
  }
  out.push(S(k.slabOf(frame, z, 2.6, P, 3, 0.4), { tone: 'mid' }));
  // Junction box under the front edge.
  out.push(S(k.slabOf({ x: 118, y: 46, w: 8, d: 10, r: 1 }, z - 4, 4, P, 2), { tone: 'lo', crease: 'none' }));
  const glass = k.insetPlan(frame, 2.2);
  const gz = z + 2.6;
  out.push(S(k.slabOf(glass, gz, 0.6, P, 2), { tone: 'hi', crease: 'lo' }));
  // Cell grid, edge to edge on the glass.
  const cells = [];
  for (let i = 1; i < 6; i++) { const x = glass.x + (glass.w / 6) * i; cells.push(k.lineOnTop([x, glass.y], [x, glass.y + glass.d], gz + 0.6, P)); }
  for (let j = 1; j < 3; j++) { const y = glass.y + (glass.d / 3) * j; cells.push(k.lineOnTop([glass.x, y], [glass.x + glass.w, y], gz + 0.6, P)); }
  out.push(L(cells.join(''), { tone: 'lo' }));
  return out.join('');
}

// Paint standing parts back to front by footprint centre.
const standing = [
  { name: 'controller', c: [0, 0], svg: controller() },
  { name: 'charger', c: [-100, -55], svg: charger() },
  { name: 'meter', c: [100, -55], svg: meter() },
  { name: 'battery', c: [-100, 55], svg: battery() },
  { name: 'solar', c: [100, 57], svg: solar() },
].sort((a, b) => depth(...a.c) - depth(...b.c));

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    'A test bench. An edge controller sits in the middle of a ruled plate, wired to four simulators: a grid meter, an EV charger, a battery cabinet and a solar panel. The solar panel is wired to the grid meter, not to the controller. Signals travel the cables in a loop: telemetry in, a decision, a setpoint out to the battery, and the meter reading the change.',
  body: [
    plate(),
    wires(),
    `<g data-part="tokens"></g>`,
    padsSvg(),
    ...standing.map((s) => `<g data-part="${s.name}">${s.svg}${s.name === 'meter' ? `<path data-needle class="iso-line" data-tone="hi" data-free="start" d="${needleAt(0.35)}" style="stroke-width:1.1"/>` : ''}${s.name === 'controller' ? `<g data-leds>${D([[-13, 15, 12], [-10, 15, 12], [-7, 15, 12]].map(at), { size: 0.85, tone: 'hi' })}</g>` : ''}</g>`),
  ],
});

const plateMarkup = k.plateHtml({
  fig: 'Fig 1',
  title: 'The closed loop',
  hint: 'Point at a part',
  readout: 'Solar and loads net at the meter',
  keys: [
    { mark: 'lit', label: 'Signals on the cables, one loop every few seconds' },
    { mark: 'raised', label: 'The controller: production code, unmodified' },
  ],
  caption:
    'The production controller runs unmodified. Everything it talks to is simulated, so a site’s telemetry can be replayed on the bench. Solar is wired to the meter rather than the controller, because the controller only ever sees the net.',
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Closed-loop testbed figure. Use the arrow keys to step through the parts.">${svg}</div>`,
});

const data = {
  P,
  Z,
  routes,
  needle: { dial: METER.dial, r: METER.r, top: METER.top + 5.2, min: NEEDLE.min, max: NEEDLE.max },
};

if (process.argv.includes('--page')) {
  const { kitScript } = await import(pathToFileURL(join(process.env.ANATOMY ?? '', 'scripts/inline-kit.mjs')).href);
  writeFileSync(join(HERE, 'page-light.html'), k.pageHtml({ title: 'The closed loop', theme: 'light', body: plateMarkup, script: kitScript(), width: 720 }));
  console.log('wrote page-light.html');
} else {
  writeFileSync(join(HERE, 'figure.html'), plateMarkup);
  writeFileSync(join(HERE, 'figure.json'), JSON.stringify(data));
  console.log('wrote figure.html, figure.json');
}
