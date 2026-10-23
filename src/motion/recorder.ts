// The recorder: one driver for everything that carries the concept.
// The page is chart paper. A pen fixed at --pen-y writes the grid's frequency as the paper feeds
// (scroll). Ink only exists where paper has passed the pen ("recorded"). Every [data-event]
// element bends the line into its own shape over its own height; the red event pen marks the
// span in the strip's margin. At rest the nib trembles around nominal and the readout keeps
// reading. Reduced motion: the whole record is drawn at once and the nib holds still.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, onScroll, scrollState, prefersReducedMotion, ease } from '../engine';
import type { EventKind } from '../data/site';

const NOMINAL = 50;
const RANGE = 0.3; // Hz from centre to strip edge
const PEN = 0.7; // pen position, fraction of viewport height

type Ev = { kind: EventKind; y0: number; y1: number; gain: number; el: HTMLElement };

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let readout: HTMLElement | null = null;
let strip = { left: 0, width: 0 };
let vh = 0;
let penY = 0;
let dpr = 1;
let recorded = 0;
let events: Ev[] = [];
let flat = false; // 404: no signal
let lastText = '';
let lastTextAt = 0;
let reduced = false;
const write = { p: 1 }; // intro: the pen writes the visible record from the top of the strip
let colors = { pen: '#2b31c9', mark: '#c42f1b', ink: '#121614' };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const win = (u: number, a = 0.06) => smooth(0, a, u) * (1 - smooth(1 - a, 1, u));
const gauss = (u: number, c: number, w: number) => Math.exp(-(((u - c) / w) ** 2));

// Event signatures in Hz. Illustrative shapes, not recorded data.
export const shapes: Record<EventKind, (u: number) => number> = {
  // a frequency excursion the battery should answer, clamped flat and hunting
  clamp: (u) => Math.min(0.15, 0.24 * smooth(0.05, 0.3, u)) * (1 - smooth(0.78, 0.98, u)) + 0.022 * Math.sin(u * Math.PI * 2 * 7) * smooth(0.25, 0.35, u) * (1 - smooth(0.7, 0.85, u)),
  // five incidents, five catches
  spikes: (u) => [0, 1, 2, 3, 4].reduce((s, k) => s + (k % 2 ? -0.14 : 0.17) * gauss(u, 0.14 + k * 0.18, 0.03), 0),
  // a modelled response settling
  damped: (u) => 0.2 * Math.sin(u * Math.PI * 2 * 3.2) * Math.exp(-3.4 * u) * win(u, 0.04),
  // raw 5 Hz samples, then the aggregate line
  aggregate: (u) =>
    (0.05 * Math.sin(u * 118) + 0.035 * Math.sin(u * 171 + 1) + 0.022 * Math.sin(u * 236 + 2)) * win(u, 0.05) * (1 - smooth(0.42, 0.58, u)) +
    0.11 * Math.sin(Math.PI * smooth(0.42, 1, u)) ** 2 * smooth(0.42, 0.58, u),
  // a system stepping between states
  steps: (u) => {
    const lv = [0, 0.11, -0.07, 0.15, 0.03];
    const x = u * lv.length;
    const i = Math.min(lv.length - 1, Math.floor(x));
    const f = smooth(0, 0.12, x - i);
    const prev = i === 0 ? 0 : lv[i - 1];
    return (prev + (lv[i] - prev) * f) * (1 - smooth(0.9, 1, u));
  },
  // a period on the CV: the event pen marks it, the line only shifts a little
  period: (u) => 0.03 * Math.sin(Math.PI * u) ** 2,
  // player traffic arriving in bursts
  bursts: (u) =>
    [0.08, 0.17, 0.22, 0.36, 0.41, 0.55, 0.63, 0.67, 0.81, 0.9].reduce((s, c, k) => s + (0.07 + 0.13 * (((k * 7919) % 10) / 10)) * gauss(u, c, 0.016), 0) * win(u),
};

function base(y: number) {
  if (flat) return 0;
  return 0.011 * Math.sin(y * 0.0117) + 0.0065 * Math.sin(y * 0.0291 + 1.3) + 0.0036 * Math.sin(y * 0.071 + 0.4) + 0.0018 * Math.sin(y * 0.173 + 2.1);
}

function hz(y: number) {
  let d = base(y);
  for (const e of events) {
    if (y < e.y0 || y > e.y1) continue;
    d += shapes[e.kind]((y - e.y0) / (e.y1 - e.y0)) * e.gain;
  }
  return d;
}

// The phone strip is narrow, so it reads a tighter range (the scale is only printed on desktop).
const xOf = (d: number) => strip.width / 2 + (d / (strip.width < 80 ? RANGE * 0.85 : RANGE)) * (strip.width / 2) * 0.92;

function jitter(t: number) {
  if (flat || reduced) return 0;
  // Grid frequency wanders slowly and trembles a little; this is the live part under the pen.
  return 0.012 * Math.sin(t * 0.9) + 0.004 * Math.sin(t * 2.3 + 1) + 0.0015 * Math.sin(t * 6.1 + 2);
}

function measure() {
  if (!canvas) return;
  const s = document.querySelector<HTMLElement>('.strip');
  if (!s) return;
  const r = s.getBoundingClientRect();
  strip = { left: r.left, width: r.width };
  vh = innerHeight;
  penY = Math.round(vh * PEN);
  document.documentElement.style.setProperty('--pen-y', `${penY}px`);
  dpr = Math.min(2, devicePixelRatio || 1);
  canvas.style.left = `${strip.left}px`;
  canvas.style.width = `${strip.width}px`;
  canvas.style.height = `${vh}px`;
  canvas.width = Math.round(strip.width * dpr);
  canvas.height = Math.round(vh * dpr);
  const cs = getComputedStyle(document.documentElement);
  colors = { pen: cs.getPropertyValue('--c-accent').trim(), mark: cs.getPropertyValue('--c-mark').trim(), ink: cs.getPropertyValue('--c-fg').trim() };
  const y = scrollState().y || scrollY;
  events = [...document.querySelectorAll<HTMLElement>('[data-event]')].map((el) => {
    const b = el.getBoundingClientRect();
    const old = events.find((e) => e.el === el);
    return { kind: el.dataset.event as EventKind, y0: b.top + y, y1: b.bottom + y, gain: old?.gain ?? 1, el };
  });
  if (reduced) recorded = Number.POSITIVE_INFINITY;
}

function draw(t: number) {
  if (!ctx || !canvas || !strip.width) return;
  const y = scrollState().y || scrollY;
  recorded = Math.max(recorded, y + penY * write.p);
  const w = strip.width;
  const narrow = w < 80;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, vh);

  const end = Math.min(vh, recorded - y);
  const penDoc = y + penY;
  const nibX = xOf(hz(penDoc) + jitter(t));

  // Red event pen: marks the span of every event in the right margin of the strip.
  ctx.strokeStyle = colors.mark;
  ctx.lineWidth = 2;
  const mx = w - (narrow ? 4 : 9);
  for (const e of events) {
    const a = Math.max(e.y0 - y, 0);
    const b = Math.min(e.y1 - y, end);
    if (b <= a) continue;
    ctx.beginPath();
    ctx.moveTo(mx, a);
    ctx.lineTo(mx, b);
    ctx.stroke();
    if (e.y0 - y >= 0 && e.y0 - y <= end) {
      ctx.beginPath();
      ctx.moveTo(mx - (narrow ? 4 : 7), e.y0 - y);
      ctx.lineTo(mx, e.y0 - y);
      ctx.stroke();
    }
  }

  // The trace.
  ctx.strokeStyle = colors.pen;
  ctx.lineWidth = narrow ? 1.35 : 1.8;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const step = 1.5;
  let first = true;
  // The freshest ink, just above the pen, still trembles with the nib.
  const atPen = write.p === 1 && end <= penY + step;
  const j = jitter(t);
  for (let sy = 0; sy <= end; sy += step) {
    const wet = atPen ? Math.max(0, 1 - (penY - sy) / 320) ** 2 : 0;
    const x = xOf(hz(y + sy) + j * wet);
    if (first) { ctx.moveTo(x, sy); first = false; } else ctx.lineTo(x, sy);
  }
  if (!first && atPen) ctx.lineTo(nibX, penY);
  ctx.stroke();

  // Carriage rail and nib.
  ctx.strokeStyle = colors.ink;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, penY + 0.5);
  ctx.lineTo(w, penY + 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.ink;
  ctx.fillRect(0, penY - 3, narrow ? 3 : 6, 7);
  ctx.fillStyle = colors.pen;
  ctx.beginPath();
  ctx.arc(nibX, penY, narrow ? 2.8 : 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Readout, a few times a second (a real display does not repaint at 60 Hz).
  if (readout && (t - lastTextAt > 0.14 || !lastText)) {
    lastTextAt = t;
    const live = NOMINAL + hz(penDoc) + jitter(t);
    const text = flat ? '--.---' : (49.8 + (live - 49.8) * write.p).toFixed(3);
    if (text !== lastText) { lastText = text; readout.firstElementChild!.textContent = text; }
  }
}

export function startRecorder() {
  reduced = prefersReducedMotion();
  const tick = (t: number) => draw(t);
  const onResize = () => { measure(); draw(gsap.ticker.time); };

  onPage(({ intro }) => {
    canvas = document.getElementById('trace') as HTMLCanvasElement | null;
    readout = document.getElementById('readout');
    ctx = canvas?.getContext('2d') ?? null;
    if (!canvas || !ctx) return;
    flat = document.querySelector('[data-trace="flat"]') !== null;
    lastText = '';
    recorded = 0;
    events = [];
    measure();
    recorded = reduced ? Number.POSITIVE_INFINITY : scrollState().y || scrollY;
    if (!reduced) {
      write.p = 0;
      intro.add(gsap.to(write, { p: 1, duration: 1.0, ease: ease.out }), 0);
    }
    draw(gsap.ticker.time);

    // Rows swell their event while pointed at or focused: the annotation and the record agree.
    const off: (() => void)[] = [];
    for (const e of events) {
      const host = e.el.querySelector<HTMLElement>('a') ?? e.el;
      const on = () => gsap.to(e, { gain: 1.45, duration: 0.6, ease: ease.soft, overwrite: true });
      const out = () => gsap.to(e, { gain: 1, duration: 0.8, ease: ease.soft, overwrite: true });
      host.addEventListener('pointerenter', on);
      host.addEventListener('pointerleave', out);
      host.addEventListener('focus', on);
      host.addEventListener('blur', out);
      off.push(() => {
        host.removeEventListener('pointerenter', on);
        host.removeEventListener('pointerleave', out);
        host.removeEventListener('focus', on);
        host.removeEventListener('blur', out);
      });
    }

    ScrollTrigger.addEventListener('refresh', onResize);
    addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);
    if (!reduced) gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ScrollTrigger.removeEventListener('refresh', onResize);
      removeEventListener('resize', onResize);
      off.forEach((f) => f());
    };
  });

  // Reduced motion: no idle, redraw only when the paper moves.
  if (reduced) onScroll(() => draw(0));
}
