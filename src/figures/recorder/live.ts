// Fig 0, live: the paper feeds on the site's clock (gsap.ticker) and the pen writes the six project
// events in order, the same shapes the page's own trace uses. Sliding across the figure (or the
// arrow keys) sets the feed speed, which the knob's pointer shows.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, prefersReducedMotion } from '../../engine';
import { iso, lineOnTop, translateAlong } from '../kit/iso-kit.mjs';
import { shapes } from '../../motion/recorder';
import { projects } from '../../data/site';
import data from './figure.json';

type Pt = [number, number];
const { P, paper, swing, knob } = data as {
  P: { origin: Pt; scale: number; azimuth?: number; elevation?: number };
  paper: { x: Pt; y: Pt; top: number; penX: number };
  swing: number;
  knob: { at: Pt; r: number; top: number };
};

const RANGE = 0.3; // Hz at full swing
const CYCLE = 72; // paper units per event slot
const EVENT = 46; // paper units an event occupies
const SPEEDS = [4, 7, 10, 15, 22]; // paper units per second, knob positions 1..5
const [X0, X1] = paper.x;
const [Y0, Y1] = paper.y;
const Z = paper.top;
const NS = 'http://www.w3.org/2000/svg';

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const base = (s: number) => 0.012 * Math.sin(s * 0.11) + 0.007 * Math.sin(s * 0.27 + 1.3) + 0.003 * Math.sin(s * 0.63 + 0.4);
// Which event a paper position belongs to, and how far into it.
function slot(s: number) {
  const n = Math.floor(s / CYCLE);
  const u = (s - n * CYCLE) / EVENT;
  return { i: ((n % projects.length) + projects.length) % projects.length, u };
}
function hzAt(s: number) {
  const { i, u } = slot(s);
  return base(s) + (u <= 1 ? shapes[projects[i].event](u) : 0);
}
const yOf = (hz: number) => Math.max(-swing, Math.min(swing, (hz / RANGE) * swing));
const pt = (x: number, y: number) => iso([x, y, Z], P) as Pt;

onPage(() => {
  const stage = document.querySelector<HTMLElement>('.fig-recorder .iso-stage');
  if (!stage) return;
  const fig = stage.closest('.iso-figure');
  const readout = fig?.querySelector<HTMLElement>('[data-readout]') ?? null;
  const hint = fig?.querySelector<HTMLElement>('[data-corner="hint"]');
  if (hint && matchMedia('(hover: none)').matches) hint.textContent = 'Drag across to change feed';
  const svg = stage.querySelector('svg')!;
  const rulings = svg.querySelector('[data-part="rulings"]')!;
  const holes = svg.querySelector('[data-part="holes"]')!;
  const traceG = svg.querySelector('[data-part="trace"]')!;
  const carriage = svg.querySelector<SVGGElement>('[data-part="carriage"]')!;
  const knobEl = svg.querySelector<SVGPathElement>('[data-part="knob"]')!;

  const mk = (tag: string, attrs: Record<string, string>, parent: Element) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, v] of Object.entries(attrs)) el.setAttribute(key, v);
    parent.appendChild(el);
    return el;
  };
  // Lengthwise rulings are fixed; cross rulings, holes, event marks and ink move with the paper.
  const fixed = [-20, -10, 10, 20].map((y) => `M${pt(X0, y).join(' ')}L${pt(X1, y).join(' ')}`).join('');
  mk('path', { class: 'rec-ruling', d: fixed }, rulings);
  mk('path', { class: 'rec-ruling rec-ruling--centre', d: `M${pt(X0, 0).join(' ')}L${pt(X1, 0).join(' ')}` }, rulings);
  const cross = mk('path', { class: 'rec-ruling' }, rulings);
  const marks = mk('path', { class: 'rec-mark' }, traceG);
  const ink = mk('path', { class: 'rec-ink' }, traceG);
  const dots = Array.from({ length: 2 * Math.ceil((X1 - X0) / 6) + 2 }, () => mk('circle', { r: '0.9', class: 'rec-hole' }, holes));

  const reduced = prefersReducedMotion();
  let level = 2; // index into SPEEDS
  let speed = SPEEDS[level];
  let target = speed;
  let feed = CYCLE * 2 + 10; // paper position under the pen
  let lastText = '';

  // Projection is linear, so paper points are an origin plus two screen axes: no iso() per point.
  const o = pt(0, 0), ax = pt(1, 0), ay = pt(0, 1);
  const ex: Pt = [ax[0] - o[0], ax[1] - o[1]], ey: Pt = [ay[0] - o[0], ay[1] - o[1]];
  const fast = (x: number, y: number) => `${(o[0] + ex[0] * x + ey[0] * y).toFixed(1)} ${(o[1] + ex[1] * x + ey[1] * y).toFixed(1)}`;
  const STEP = matchMedia('(max-width: 767px)').matches ? 1.6 : 0.9;
  let lastFeed = Number.NaN;

  function draw(t: number) {
    const moved = feed !== lastFeed;
    lastFeed = feed;
    if (moved) paperMarks();
    inkAndPen(t);
  }

  function paperMarks() {
    // Cross rulings every 8 units, holes every 6, all riding the paper.
    let d = '';
    for (let x = X0 + (((feed % 8) + 8) % 8); x <= X1; x += 8) d += `M${fast(x, Y0)}L${fast(x, Y1)}`;
    cross.setAttribute('d', d);
    let k = 0;
    for (const y of [Y0 + 2.4, Y1 - 2.4]) {
      for (let x = X0 + (((feed % 6) + 6) % 6); x <= X1 && k < dots.length; x += 6, k++) {
        dots[k].setAttribute('cx', (o[0] + ex[0] * x + ey[0] * y).toFixed(1));
        dots[k].setAttribute('cy', (o[1] + ex[1] * x + ey[1] * y).toFixed(1));
        dots[k].setAttribute('opacity', (smooth((x - X0) / 8) * smooth((X1 - x) / 8)).toFixed(2));
      }
    }
    for (; k < dots.length; k++) dots[k].setAttribute('opacity', '0');
  }

  function inkAndPen(t: number) {
    // Ink: paper position s was under the pen when it was written; it now sits at penX + (feed - s).
    let line = '';
    let mark = '';
    let inEvent = false;
    for (let x = paper.penX; x <= X1; x += STEP) {
      const s = feed - (x - paper.penX);
      line += `${line ? 'L' : 'M'}${fast(x, yOf(hzAt(s)))}`;
      const ev = slot(s).u <= 1;
      if (ev !== inEvent) mark += `${ev ? 'M' : 'L'}${fast(x, Y1 - 5.5)}`;
      inEvent = ev;
    }
    if (inEvent) mark += `L${fast(X1, Y1 - 5.5)}`;
    const jitter = reduced ? 0 : 0.004 * Math.sin(t * 2.1) + 0.002 * Math.sin(t * 5.3);
    const live = hzAt(feed) + jitter;
    const penY = yOf(live);
    line += `L${fast(paper.penX, penY)}`;
    ink.setAttribute('d', line);
    marks.setAttribute('d', mark);
    carriage.setAttribute('transform', translateAlong(P, [0, penY, 0]));

    const a = -2.2 + (4.4 * (speed - SPEEDS[0])) / (SPEEDS[SPEEDS.length - 1] - SPEEDS[0]);
    const [kx, ky] = knob.at;
    knobEl.setAttribute('d', lineOnTop([kx, ky], [kx + Math.sin(a) * (knob.r - 1.2), ky - Math.cos(a) * (knob.r - 1.2)], knob.top, P));

    const { i, u } = slot(feed);
    const text = u <= 1 ? projects[i].eventNote : `${(50 + live).toFixed(3)} Hz`;
    if (readout && text !== lastText) { lastText = text; readout.textContent = text; }
    stage.setAttribute('aria-valuenow', String(level + 1));
  }

  const setLevel = (l: number) => {
    level = Math.max(0, Math.min(SPEEDS.length - 1, l));
    target = SPEEDS[level];
    if (reduced) { speed = target; draw(0); }
  };
  const move = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    setLevel(Math.round(((e.clientX - r.left) / r.width) * (SPEEDS.length - 1)));
  };
  const key = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    setLevel(level + step);
  };
  const leave = () => setLevel(2);
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerleave', leave);
  stage.addEventListener('keydown', key);
  const off = () => {
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerleave', leave);
    stage.removeEventListener('keydown', key);
  };

  draw(0);
  if (reduced) return off;

  // Phones redraw the figure at 30 Hz: slow paper reads the same and the page keeps its frames.
  const every = STEP > 1 ? 1 / 30 : 0;
  let last = -1;
  const tick = (t: number) => {
    if (last >= 0 && t - last < every) return;
    const dt = last < 0 ? 0 : Math.min(t - last, 0.06);
    last = t;
    speed += (target - speed) * (1 - Math.exp(-dt / 0.4));
    feed += speed * dt;
    draw(t);
  };
  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (s) => { last = -1; if (s.isActive) gsap.ticker.add(tick); else gsap.ticker.remove(tick); },
  });
  return () => { gsap.ticker.remove(tick); st.kill(); off(); };
});
