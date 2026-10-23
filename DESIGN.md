# DESIGN.md

## Brief

- **Subject:** Ahmad Kamal Eddin, software and AI engineer in Karlskrona, Sweden. Backend systems
  (TypeScript/Node.js, Go), production troubleshooting and root-cause investigation. Five years
  across telecom (Ericsson), public sector (Trafikverket) and energy (Vera Energy), plus his own
  company NEXA Data and Software.
- **Audience:** hiring managers and engineering leads, recruiters screening fast, and peers who
  will open a case study to check the depth.
- **Job:** get hired (backend, reliability or applied AI roles, remote with international teams).
- **Assets:** the CV only. No photos, no screenshots. All copy comes from the CV; case studies
  expand CV lines without adding new numbers.
- **Language:** English.
- **Constraints:** no invented metrics, clients or awards. Phone number left off the public site.

## Concepts

| | Idea | Anchor | Signature | O/F/Fe/P |
|---|---|---|---|---|
| A. Material | The page is chart paper feeding past a recorder pen that writes the grid's 50 Hz line; every project is an event the trace records | He works on frequency reserve and finds why production misbehaves: deviations from nominal are his job | scroll feeds the paper, the fixed pen writes the trace, and each project row bends the line into its own event shape | 4 / 5 / 4 / 2 |
| B. Process | Every project is an incident replay: symptom, replay, root cause, fix, scrubbed on a timeline | His testbed: reproduce before any field change | a playhead you scrub through each case | 3 / 5 / 4 / 3 |
| C. Place | Karlskrona as a sea chart: projects are depth soundings in the archipelago | the naval city he lives in | soundings appear as you sail down the page | 4 / 2 / 3 / 2 |

**Pick A.** Strongest fit and least portable: the trace, the 50 Hz scale and the event shapes only
make sense for someone whose work is noticing deviation in live systems. Stolen from B: case pages
for incident work read as symptom, replay, root cause, fix. Stolen from C: the footer carries
Karlskrona's real coordinates.

## Concept card

```
Idea:        A strip-chart recorder writes the grid's 50 Hz line down the page; each project is an event on that record.
Metaphor:    a control-room strip-chart recorder (ruled paper, a fixed pen on an arm, events annotated in the margin)
Signature:   scroll feeds the paper under a fixed pen that draws the trace live; at each project the line bends into
             that project's event shape and the row's annotation connects to it (src/motion/recorder.ts)
Emotion:     calm instrument precision; a quiet line, then something worth looking at
Motion verb: feed like chart paper: steady vertical advance, then settle; nothing bounces
Screenshot:  the name set huge over ruled paper with the blue trace running behind it and the pen reading 50.00x Hz
```

## Art direction

**Palette** (recorder paper with red rulings, a blue ink pen and a red event pen)

| Role | Hex | Use |
|---|---|---|
| ground (paper) | `#EEF1EB` | page ground, a cool green-tinted chart paper, not cream |
| ink | `#121614` | text |
| muted | `#555E58` | secondary text (6.0:1 on paper) |
| line | `rgb(18 22 20 / 0.14)` | hairlines |
| ruling | `#D9806C` | chart rulings, low alpha only |
| pen (accent) | `#2B31C9` | the trace, focus ring, CTA fill, leader lines |
| mark | `#C42F1B` | event ticks, used only where an event is recorded |
| curtain | `#E2E7DF` | page-transition paper (a fresh sheet feeding in) |

**Type**
- Familjen Grotesk (Google, OFL), a Swedish grotesk with an idiosyncratic g and y. 600 for display
  (tracking -0.045em at mega, -0.03em at xl), 400 for text and UI.
- JetBrains Mono 400, only for instrument readings: Hz values, the scale, event stamps,
  coordinates. Never for general labels.
- Scale: mega clamp(3.6rem, 0.9rem + 12.6vw, 14.5rem); xl, l, m, body, s, xs per tokens.

**Grid and rhythm**
- 12 columns. Columns 1 to 3 are the chart strip (the recorder paper), column 4 is the margin
  where leader lines run, content hangs from the column 5 line. Secondary blocks start on column 9.
- The hero name is the only element allowed to cross the strip, and only on desktop, sized
  (min of 16.5vw and 25svh) so it always ends above the pen. The footer CTA hangs from column 5
  because at the end of the page it sat under the pen readout.
- Rhythm moods: hero full viewport, statement airy, work rows tall (each row needs room for its
  event), facts tight, experience normal, footer full viewport.
- Phone (390): the strip shrinks to a 52 px band on the left, content hangs from 68 px.

**Shape:** zero radius everywhere except the pen nib (a circle). Paper and instruments are square.

**Motion language**
- Eases: engine `out` (expo.out) for reveals, `inOut` for the curtain, `soft` for hovers.
- Reveals feed upward under a mask (line splits), never fade-up blocks.
- Hovers: nav and text buttons feed one line (vertical roll, paper advancing). Work rows: the
  title advances right, the leader line draws from the trace to the row, and that row's event on
  the trace swells. CTAs: pen ink floods up from the bottom edge. Inline links: underline rises.
- Idle: the pen nib trembles around nominal and the readout keeps reading (50.00x Hz). Grid
  frequency never sits still; the recorded ink does not change.
- Page transition: a fresh sheet of chart paper feeds up over the page, sprocket holes leading.
- No loader (decided in QA pass 1: a full-screen loader cost 4.3 s on a throttled phone). The
  intro is the concept itself: the pen writes the visible record from the top of the strip down
  to the nib while the readout settles from 49.800 Hz to the live value. Hero type feeds in with
  CSS on first paint, so it never waits for JavaScript (mobile LCP went from 5.0 s to about 2 s).

**Composition plan**

```
HOME
1 Poster (hero)            |strip| AHMAD                          nav (top right)
                           |~~~~ | KAMAL EDDIN (mega, crosses strip)
                           |  o--| 50.003 Hz    role line (col 5-9)   Email me
1b Figure (anatomy)       |strip|        Fig 0: the recorder that writes this page (col 5-12)
2 Statement                |strip|        I own the testbed... (t-l, col 5-12)
3 Index as concept (work)  |~/\~ |--------  2025  Closed-loop testbed    Vera Energy
                           |~~~~ |--------  ...   (tall rows, one event each)
4 Data / facts             |strip|        5 of 5 | 245 kW | 4.3 GB | 521 (tabular, col 5-12)
5 Asymmetric (experience)  |strip|        years col 5-6 | org + role col 7-12
6 Columns (skills)         |strip|        three lists, col 5 / col 9
7 Footer finale            Email me (mega, crosses strip) / links / 56.16 N 15.59 E / copyright

CASE /work/<slug>
1 Poster: title (xl) + meta, the project's own event drawn large on the strip in the first frame
2 Sticky narrative: section heads at col 5, text col 5-10 (symptom/replay/cause/fix or problem/build/detail/outcome)
3 Figure (anatomy) on the testbed case only: the closed loop as an isometric test rig
4 Next project (full-width link, feeds into the next case)

404: the pen draws a dead flat line. "Nothing recorded here."
```

**Idle:** the nib drifts slowly around nominal (about ±0.017 Hz, like real grid frequency) and
the last 320 px of ink tremble with it; the recorded line further up never changes. The 404 is
still on purpose: its line is dead flat and the readout shows no signal.

**Explainer figure:** the testbed case page. Object mapping: an isometric test rig where the edge
controller box sits in the middle, wired to a simulated grid meter, EV chargers, a solar array and
a battery. Signals travel the wires in a loop; the readout shows the loop's step. Built with the
anatomy skill.

## Genericness test

- "Dark tech portfolio with mono labels and a green accent" is where a generic model lands for a
  backend engineer. Changed: light ruled paper, blue ink, a red event pen, mono only for readings.
- "Projects as cards" changed to an index whose rows are events on one continuous record.
- "Hero with a typing terminal" changed to an instrument at rest drawing a nominal line.
