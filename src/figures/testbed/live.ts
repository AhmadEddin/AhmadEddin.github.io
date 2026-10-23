// Fig 1, live: one loop every six seconds on the site's clock (gsap.ticker).
// Phases are the real order of a control cycle on the bench. Pointing at or focusing a part
// shows what it does in the readout; the loop keeps running underneath.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, prefersReducedMotion } from '../../engine';
import { iso, lineOnTop } from '../kit/iso-kit.mjs';
import data from './figure.json';

type Pt = [number, number];
const { P, Z, routes, needle } = data as {
  P: { origin: Pt; scale: number; azimuth?: number; elevation?: number };
  Z: number;
  routes: Record<string, Pt[]>;
  needle: { dial: Pt; r: number; top: number; min: number; max: number };
};

const CYCLE = 6;
// [start, end, readout, routes travelling, direction] ; 'in' = module to controller.
const PHASES: { from: number; to: number; text: string; wires: string[]; dir: 'in' | 'out' | 'none' }[] = [
  { from: 0, to: 1.4, text: 'Solar and loads net at the meter', wires: ['solar'], dir: 'out' },
  { from: 1.4, to: 2.8, text: 'Telemetry in: meter, battery, charger', wires: ['meter', 'battery', 'charger'], dir: 'in' },
  { from: 2.8, to: 3.6, text: 'The controller decides', wires: [], dir: 'none' },
  { from: 3.6, to: 4.8, text: 'Setpoint out to the battery', wires: ['battery'], dir: 'out' },
  { from: 4.8, to: 6, text: 'The meter reads the change', wires: [], dir: 'none' },
];
const PARTS: Record<string, string> = {
  controller: 'Edge controller: production code, unmodified',
  meter: 'Grid meter sim: site import and export',
  charger: 'EV charger sim: speaks OCPP',
  battery: 'Battery sim: takes setpoints, reports state',
  solar: 'Solar sim: feeds the meter, not the controller',
};
const ORDER = ['controller', 'meter', 'solar', 'battery', 'charger'];

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

// Screen polylines with cumulative lengths, for placing a token at a fraction of a route.
const paths = Object.fromEntries(Object.entries(routes).map(([name, pts]) => {
  const s = pts.map(([x, y]) => iso([x, y, Z], P) as Pt);
  const len = [0];
  for (let i = 1; i < s.length; i++) len.push(len[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  return [name, { s, len }];
}));
function pointOn(name: string, f: number): Pt {
  const { s, len } = paths[name];
  const d = f * len[len.length - 1];
  let i = 1;
  while (i < len.length - 1 && len[i] < d) i++;
  const k = (d - len[i - 1]) / (len[i] - len[i - 1] || 1);
  return [s[i - 1][0] + (s[i][0] - s[i - 1][0]) * k, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * k];
}
function needleD(v: number) {
  const [x, y] = needle.dial;
  const a = needle.min + (needle.max - needle.min) * v;
  return lineOnTop([x - Math.sin(a) * 2.6, y + Math.cos(a) * 2.6], [x + Math.sin(a) * (needle.r - 3.4), y - Math.cos(a) * (needle.r - 3.4)], needle.top, P);
}
// Net import at the meter, 0..1 on the dial: rises as loads and solar net out, falls once the battery answers.
const needleAt = (t: number) => 0.35 + 0.4 * smooth(t / 1.4) - 0.4 * smooth((t - 4.8) / 1.0);

onPage(() => {
  const stage = document.querySelector<HTMLElement>('.fig .iso-stage');
  if (!stage) return;
  const readout = stage.closest('.iso-figure')?.querySelector<HTMLElement>('[data-readout]') ?? null;
  const layer = stage.querySelector('[data-part="tokens"]')!;
  const leds = stage.querySelector<SVGGElement>('[data-leds]');
  const needleEl = stage.querySelector<SVGPathElement>('[data-needle]');
  const NS = 'http://www.w3.org/2000/svg';
  const tokens = Object.fromEntries(Object.keys(routes).map((name) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '2.4');
    c.setAttribute('class', 'fig-token');
    c.setAttribute('opacity', '0');
    layer.appendChild(c);
    return [name, c];
  }));
  const reduced = prefersReducedMotion();
  const hint = stage.closest('.iso-figure')?.querySelector<HTMLElement>('[data-corner="hint"]');
  if (hint && matchMedia('(hover: none)').matches) hint.textContent = 'Tap a part';
  let focus: string | null = null;
  let lastText = '';
  const say = (text: string) => { if (readout && text !== lastText) { lastText = text; readout.textContent = text; } };
  const setFocus = (name: string | null) => {
    focus = name;
    if (name) stage.dataset.focus = name; else delete stage.dataset.focus;
    if (name) say(PARTS[name]);
  };

  function frame(t: number) {
    const ph = PHASES.find((p) => t >= p.from && t < p.to) ?? PHASES[0];
    for (const [name, c] of Object.entries(tokens)) {
      if (!ph.wires.includes(name)) { c.setAttribute('opacity', '0'); continue; }
      const u = (t - ph.from) / (ph.to - ph.from);
      // On these routes the first point is the controller end (solar: the solar end).
      const f = ph.dir === 'in' ? 1 - smooth(u) : smooth(u);
      const [x, y] = pointOn(name, f);
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('opacity', (smooth(u / 0.12) * smooth((1 - u) / 0.12)).toFixed(2));
    }
    const thinking = ph.text === 'The controller decides' ? Math.sin(((t - ph.from) / (ph.to - ph.from)) * Math.PI) : 0;
    leds?.setAttribute('opacity', (0.15 + 0.85 * thinking).toFixed(2));
    needleEl?.setAttribute('d', needleD(needleAt(t)));
    if (!focus) say(ph.text);
  }

  const over = (e: Event) => setFocus((e.target as Element).closest<HTMLElement>('[data-part]')?.dataset.part ?? null);
  const leave = () => setFocus(null);
  const key = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) { if (e.key === 'Escape') setFocus(null); return; }
    e.preventDefault();
    const i = focus ? ORDER.indexOf(focus) : -1;
    setFocus(ORDER[(i + step + ORDER.length) % ORDER.length]);
  };
  stage.addEventListener('pointerover', over);
  stage.addEventListener('pointerleave', leave);
  stage.addEventListener('keydown', key);
  stage.addEventListener('blur', leave);
  // Hover parts are the module groups; tokens stay out of hit testing.
  (layer as SVGGElement).style.pointerEvents = 'none';

  if (reduced) {
    frame(2.0); // one still frame: telemetry on its way in
    return () => { stage.removeEventListener('pointerover', over); stage.removeEventListener('pointerleave', leave); stage.removeEventListener('keydown', key); stage.removeEventListener('blur', leave); };
  }

  let clock = 0;
  let last = -1;
  const tick = (t: number) => {
    const dt = last < 0 ? 0 : Math.min(t - last, 0.05);
    last = t;
    clock = (clock + dt) % CYCLE;
    frame(clock);
  };
  frame(0);
  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (s) => { last = -1; if (s.isActive) gsap.ticker.add(tick); else gsap.ticker.remove(tick); },
  });
  return () => {
    gsap.ticker.remove(tick);
    st.kill();
    Object.values(tokens).forEach((c) => c.remove());
    stage.removeEventListener('pointerover', over);
    stage.removeEventListener('pointerleave', leave);
    stage.removeEventListener('keydown', key);
    stage.removeEventListener('blur', leave);
  };
});
