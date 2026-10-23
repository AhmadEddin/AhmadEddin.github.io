// Global motion for this site: runs once on the client, before the first page initializes.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, onPage, onScroll, scrollToTarget, setTransition } from '../engine';
import { startRecorder } from './recorder';

export function setupMotion() {
  // Page transition: a fresh sheet of chart paper feeds up over the page, then on past it.
  setTransition({
    leave: (c) => gsap.timeline()
      .set(c, { autoAlpha: 1 })
      .fromTo(c.querySelector('.curtain__panel'), { yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: ease.inOut }),
    enter: (c) => gsap.timeline()
      .to(c.querySelector('.curtain__panel'), { yPercent: -100, duration: 0.85, ease: ease.inOut })
      .set(c, { autoAlpha: 0 }),
  });

  startRecorder();

  // CSS intros wait for the curtain after a swap (Astro rewrites <html> attributes, so re-add).
  document.addEventListener('astro:after-swap', () => document.documentElement.classList.add('nav-swap'));
  // Links like /#work from a case page land on their section once the new page is in.
  onPage(() => {
    if (!location.hash) return;
    const el = document.querySelector<HTMLElement>(decodeURIComponent(location.hash));
    if (el) gsap.delayedCall(0.1, () => scrollToTarget(el));
  });

  // The frame steps aside while reading down and returns on the way back up.
  let last = 0;
  onScroll(({ y }) => {
    if (Math.abs(y - last) < 4) return;
    document.documentElement.classList.toggle('frame-away', y > 160 && y > last);
    last = y;
  });

  // Home: the nav marks the section being read.
  onPage(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-spy]')];
    if (!document.querySelector('[data-home]')) return;
    links.forEach((a) => {
      const id = a.dataset.spy!;
      const sec = document.getElementById(id);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (s) => a.classList.toggle('is-current', s.isActive),
      });
    });
    return () => links.forEach((a) => a.classList.remove('is-current'));
  });
}
