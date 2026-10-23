// Fig 0: the recorder. A strip-chart recorder on a bench plate: fan-fold chart paper feeds from a
// supply tray over a platen, under a pen carriage that rides a bridge rail, into a catch tray.
// The page itself is this paper. Live parts (paper rulings, sprocket holes, trace, carriage,
// knob pointer) are drawn by live.ts from figure.json.
//   node src/figures/recorder/build.mjs          writes figure.html + figure.json
//   node src/figures/recorder/build.mjs --page   standalone page for anatomy's checks (needs ANATOMY)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as k from '../kit/iso-kit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 640;
const HEIGHT = 380;

const PLATE = { x: -150, y: -64, w: 300, d: 128, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// Paper runs along +x. Width across y.
const PAPER_Y = [-30, 30];
const PAPER_Z = 14; // top of the platen
const PAPER_T = 0.5;
const PAPER_TOP = PAPER_Z + PAPER_T;
const PAPER_X = [-112, 104]; // visible run: from the supply stack to the catch-tray lip
const SUPPLY = { x: -134, y: -36, w: 40, d: 72, r: 2 };
const CATCH = { x: 96, y: -36, w: 40, d: 72, r: 2 };
const PLATEN = { x: -92, y: -34, w: 186, d: 68, r: 2 };

// Bridge and carriage.
const PEN_X = 4; // where the pen touches the paper
const RAIL = { x: PEN_X - 4, y: -50, w: 8, d: 100, r: 1 };
const RAIL_Z = [40, 46];
const POSTS = [{ x: PEN_X - 6, y: -54, w: 12, d: 8, r: 1.2 }, { x: PEN_X - 6, y: 46, w: 12, d: 8, r: 1.2 }];
const CARRIAGE = { x: PEN_X - 7, y: -6, w: 14, d: 12, r: 1.6 }; // built at y = 0, moved along y
const CARRIAGE_Z = [31, 40];
const SWING = 26; // carriage travel either side of centre, = full scale

// Drive: gearbox with a feed-speed knob, beside the platen on the +y side.
const GEARBOX = { x: -70, y: 38, w: 34, d: 18, r: 2 };
const GEAR_TOP = 18;
const KNOB = [-53, 47];
const KNOB_R = 6.5;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PEN_X, -54, RAIL_Z[1] + 1], [PEN_X, 54, RAIL_Z[1] + 1]],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 38 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (points) => [...points].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: 'lo' }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: 'mid' }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(PLATE, -4, P, 8), { tone: 'faint' }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: 'lo' }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler strip along the front (+y) edge, right of the gearbox.
  const strip = { x: -24, y: PLATE.y + PLATE.d - 13, w: 150, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.2], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.45 }));
  // Label plate on the back edge.
  const label = { x: -112, y: -58, w: 44, d: 12, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: 'lo', crease: 'none' }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: 'faint' }));
  out.push(L([30, 20, 25].map((len, i) => k.lineOnTop([label.x + 6, label.y + 3.5 + i * 2.6], [label.x + 6 + len, label.y + 3.5 + i * 2.6], 0.8, P)).join(''), { tone: 'lo', free: true }));
  out.push(D([at([label.x + 3, label.y + 6, 0.8]), at([label.x + label.w - 3, label.y + 6, 0.8])], { size: 0.4 }));
  return out.join('');
}

// Input terminals on the back edge, with the signal cable running to the back post's foot.
function terminals() {
  const out = [];
  const block = { x: 30, y: -58, w: 40, d: 10, r: 1.2 };
  out.push(S(k.slabOf(block, 0, 7, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(block, 3, P, 3), { tone: 'faint' }) }));
  for (const x of [36, 46, 56, 64]) {
    out.push(S(k.cylinder(x, -53, 2.4, 7, 1.6, P, 18), { tone: 'hi', crease: 'lo' }));
    out.push(L(k.lineOnTop([x - 1.6, -53], [x + 1.6, -53], 8.6, P), { tone: 'mid' }));
  }
  out.push(k.wireSvg(at([30, -53, 2]), at([PEN_X + 6, -50, 2]), { via: [at([18, -53, 0.6]), at([14, -50, 0.6])], tone: 'mid', size: 0.9 }));
  return out.join('');
}

function trays() {
  const out = [];
  for (const [tray, folds] of [[SUPPLY, 7], [CATCH, 4]]) {
    out.push(`<path class="iso-halo" d="${k.haloOf(tray, 0, 4, P)}"/>`);
    out.push(S(k.slabOf(tray, 0, 4, P, 3, 0.5), { tone: 'mid' }));
    out.push(D(k.corners(tray, 2.5).map(([x, y]) => at([x, y, 4])), { size: 0.45 }));
    // Fan-folded sheets, one slab per fold.
    const sheet = { x: tray.x + 4, y: PAPER_Y[0], w: tray.w - 8, d: PAPER_Y[1] - PAPER_Y[0], r: 0.4 };
    const h = (PAPER_Z - 4) / 7;
    for (let i = 0; i < folds; i++) out.push(S(k.slabOf(sheet, 4 + i * h, h, P, 2), { tone: 'hi', crease: 'faint' }));
  }
  // The platen the paper runs over.
  out.push(S(k.slabOf(PLATEN, 0, PAPER_Z, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(PLATEN, 4, P, 3), { tone: 'faint' }) }));
  out.push(D([-84, -40, 40, 86].map((x) => at([x, PLATEN.y + PLATEN.d - 2.5, PAPER_Z])), { size: 0.4 }));
  return out.join('');
}

// The paper strip itself; rulings, holes and the trace are live (drawn into data-part slots).
function paper() {
  const plan = { x: PAPER_X[0], y: PAPER_Y[0], w: PAPER_X[1] - PAPER_X[0], d: PAPER_Y[1] - PAPER_Y[0], r: 0.4 };
  return S(k.slabOf(plan, PAPER_Z, PAPER_T, P, 2), { tone: 'hi', crease: 'faint' });
}

function gearbox() {
  const out = [`<path class="iso-halo" d="${k.haloOf(GEARBOX, 0, GEAR_TOP, P)}"/>`];
  out.push(S(k.slabOf(GEARBOX, 0, GEAR_TOP, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(GEARBOX, 14, P, 4), { tone: 'faint' }) }));
  // Vent slots on the front face.
  const face = GEARBOX.y + GEARBOX.d;
  for (let i = 0; i < 5; i++) {
    const x0 = GEARBOX.x + 5 + i * 5;
    out.push(L(k.pathOf([[x0, face, 4], [x0 + 2.4, face, 4], [x0 + 2.4, face, 11], [x0, face, 11]].map(at), true), { tone: 'lo' }));
  }
  // Knob with a collar, a knurled skirt and a speed scale around it.
  const [x, y] = KNOB;
  // Speed scale on a thin dial plate: every tick runs from the plate's rim ring to the collar.
  const plate = KNOB_R + 4.6;
  out.push(S(k.cylinder(x, y, plate + 0.8, GEAR_TOP, 0.4, P, 48), { tone: 'lo', crease: 'none' }));
  out.push(L(k.ring(x, y, plate, GEAR_TOP + 0.4, P, 48), { tone: 'lo' }));
  const t = k.radialTicks(x, y, plate, 12, 4, GEAR_TOP + 0.4, [3, 3], P, -2.2, 4.4);
  out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }));
  out.push(S(k.cylinder(x, y, KNOB_R + 1.6, GEAR_TOP + 0.4, 1.2, P, 40), { tone: 'mid' }));
  out.push(S(k.cylinder(x, y, KNOB_R, GEAR_TOP + 1.6, 5, P, 48, 0.5), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.knurl(x, y, KNOB_R, GEAR_TOP + 1.6, GEAR_TOP + 6.6, 40, P), { tone: 'lo' }));
  out.push(D(k.corners(GEARBOX, 3).map(([px, py]) => at([px, py, GEAR_TOP])), { size: 0.45 }));
  return out.join('');
}

function post(plan) {
  const out = [];
  out.push(S(k.slabOf(k.insetPlan(plan, -2), 0, 3, P, 3, 0.4), { tone: 'lo' }));
  out.push(S(k.slabOf(plan, 3, RAIL_Z[0] - 3, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(plan, 20, P, 3), { tone: 'faint' }) }));
  out.push(D(k.corners(k.insetPlan(plan, -2), 1.4).map(([x, y]) => at([x, y, 3])), { size: 0.4 }));
  return out.join('');
}

function carriage() {
  const out = [];
  // Pen holder: arm down from the carriage, collar, and the pen tip on the paper.
  out.push(S(k.cylinder(PEN_X, 0, 1.3, PAPER_TOP + 3.6, CARRIAGE_Z[0] - PAPER_TOP - 3.6, P, 16), { tone: 'mid', crease: 'none' }));
  out.push(S(k.cylinder(PEN_X, 0, 2.6, PAPER_TOP + 3.6, 3.4, P, 20), { tone: 'mid' }));
  out.push(S(k.cylinder(PEN_X, 0, 1.1, PAPER_TOP, 3.6, P, 14), { tone: 'hi', lit: true }));
  out.push(S(k.slabOf(CARRIAGE, CARRIAGE_Z[0], CARRIAGE_Z[1] - CARRIAGE_Z[0], P, 3, 0.5), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(CARRIAGE, 35, P, 3), { tone: 'faint' }) }));
  out.push(D([[CARRIAGE.x + CARRIAGE.w, -3, 37], [CARRIAGE.x + CARRIAGE.w, 3, 37]].map(at), { size: 0.45, tone: 'hi' }));
  return out.join('');
}

function rail() {
  const out = [];
  out.push(S(k.slabOf(RAIL, RAIL_Z[0], RAIL_Z[1] - RAIL_Z[0], P, 3, 0.5), { tone: 'mid' }));
  // Scale on top of the rail, across the paper, ticks rooted on the front edge.
  const sc = k.topTicks(-SWING, SWING, 2.6, 5, RAIL.x + 0.8, RAIL_Z[1], [1.4, 2.8], P, 'y');
  out.push(L(sc.minor, { tone: 'lo' }), L(sc.major, { tone: 'mid' }));
  // Drive belt on the rail's +x face, post to post.
  const fx = RAIL.x + RAIL.w;
  out.push(L(k.segment([fx, RAIL.y, 41.6], [fx, RAIL.y + RAIL.d, 41.6], P) + k.segment([fx, RAIL.y, 44.4], [fx, RAIL.y + RAIL.d, 44.4], P), { tone: 'lo' }));
  out.push(D([[PEN_X, RAIL.y + 2, RAIL_Z[1]], [PEN_X, RAIL.y + RAIL.d - 2, RAIL_Z[1]]].map(at), { size: 0.45 }));
  return out.join('');
}

// Order: plate, back parts, trays and platen, paper + live marks, back post, carriage, rail, front post, gearbox.
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    'A strip-chart recorder on a bench plate. Fan-folded chart paper feeds from a supply tray, across a platen and into a catch tray. A pen on a carriage rides a rail across the paper and draws a line around 50 hertz; each project on this page is one event in that line. A knob on the gearbox sets the feed speed.',
  body: [
    plate(),
    terminals(),
    trays(),
    paper(),
    `<g data-part="rulings"></g><g data-part="holes"></g><g data-part="trace"></g>`,
    post(POSTS[0]),
    `<g data-part="carriage">${carriage()}</g>`,
    rail(),
    post(POSTS[1]),
    gearbox(),
    `<path data-part="knob" class="iso-line" data-tone="hi" d="" style="stroke-width:1.1"/>`,
  ],
});

const plateMarkup = k.plateHtml({
  fig: 'Fig 0',
  title: 'The recorder',
  hint: 'Slide across to change feed',
  readout: '50.000 Hz',
  keys: [
    { mark: 'lit', label: 'The pen and the paper it writes on' },
    { mark: 'raised', label: 'Six events, one for each project below' },
  ],
  caption:
    'This page is the paper from this machine. The pen draws around 50 Hz, the grid’s nominal frequency, and every project further down is one event it wrote.',
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Paper feed speed. Use the arrow keys to change it." aria-valuemin="1" aria-valuemax="5" aria-valuenow="2">${svg}</div>`,
});

const data = {
  P,
  paper: { x: PAPER_X, y: PAPER_Y, top: PAPER_TOP, penX: PEN_X },
  swing: SWING,
  knob: { at: KNOB, r: KNOB_R, top: GEAR_TOP + 6.6 },
};

if (process.argv.includes('--page')) {
  const { kitScript } = await import(pathToFileURL(join(process.env.ANATOMY ?? '', 'scripts/inline-kit.mjs')).href);
  writeFileSync(join(HERE, 'page-light.html'), k.pageHtml({ title: 'The recorder', theme: 'light', body: plateMarkup, script: kitScript(), width: 720 }));
  console.log('wrote page-light.html');
} else {
  writeFileSync(join(HERE, 'figure.html'), plateMarkup);
  writeFileSync(join(HERE, 'figure.json'), JSON.stringify(data));
  console.log('wrote figure.html, figure.json');
}
