// Every visible string on the site lives here.
// Source: Ahmad's CV. Case studies expand CV lines into problem, approach and outcome without
// adding new numbers, clients or results.
// Assumptions (mirrored in the hand-off):
//   - site.url is the GitHub Pages address (canonical, OG, sitemap use it).
//   - The phone number from the CV is deliberately left off the public site.
//   - Event shapes on the trace are illustrative signatures, not recorded data.

export type EventKind = 'clamp' | 'spikes' | 'damped' | 'aggregate' | 'steps' | 'bursts' | 'period';

export type Project = {
  slug: string;
  title: string;
  org: string;
  years: string;
  role: string;
  stack: string[];
  summary: string; // one sentence: what was built, for whom, what changed
  event: EventKind; // the shape this project draws on the trace
  eventNote: string; // what the shape stands for, in a few words
  body: { heading: string; text: string }[];
  figure?: boolean; // the closed-loop explainer figure
};

export const site = {
  name: 'Ahmad Kamal Eddin',
  role: 'Software and AI engineer',
  url: 'https://ahmadeddin.github.io', // GitHub Pages; change here, in astro.config.mjs and robots.txt for a custom domain
  description:
    'Ahmad Kamal Eddin, software and AI engineer in Karlskrona. Backend systems in TypeScript and Go, production troubleshooting and root-cause investigation.',
  email: 'ahmadeeddin@gmail.com',
  location: 'Karlskrona, Sweden',
  coordinates: '56.16 N  15.59 E',
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ahmad-eddin-b891802b7' },
    { label: 'GitHub', href: 'https://github.com/AhmadEddin' },
  ],
  hero: {
    line: 'Software and AI engineer. I build backend systems and find out why production does what it does.',
    meta: 'Karlskrona, Sweden (CET). Open to remote roles with international teams.',
  },
  statement:
    'I own the testbed my team uses to reproduce production incidents before anyone changes a live site. When a battery delivered less frequency reserve than it should have, I traced the shortfall to peak-shaving logic that no log line showed.',
  about:
    'Five years across telecom, public-sector and energy platforms, mostly backend services in TypeScript/Node.js and Go with React front ends. I move between quick fixes and long investigations, write the runbooks and handoff documents the team works from, and demo the platform to enterprise customers and partners myself. MSc in AI and Machine Learning Engineering from Blekinge Institute of Technology.',
};

export const projects: Project[] = [
  {
    slug: 'closed-loop-testbed',
    title: 'Closed-loop testbed',
    org: 'Vera Energy',
    years: '2025 to now',
    role: 'Owner: design, build and operation',
    stack: ['Docker', 'MQTT', 'Modbus TCP', 'OCPP', 'Bash', 'Raspberry Pi'],
    summary:
      'A Docker testbed that runs the unmodified production edge controller against a simulated grid, EV chargers, solar and site loads, so incidents are replayed from real telemetry before any field change.',
    event: 'clamp',
    eventNote: 'a response clamped and hunting',
    figure: true,
    body: [
      {
        heading: 'Symptom',
        text: 'A battery at a live customer site delivered less frequency reserve than it was contracted for. The controller logs looked clean: no error, no warning, nothing that explained the shortfall.',
      },
      {
        heading: 'Replay',
        text: 'The testbed closes the loop around the production edge controller: a simulated grid, OCPP EV chargers, solar and site loads answer it the way a real site would. Fed with the site’s real telemetry, the shortfall came back on the bench, where it could be studied without touching the customer.',
      },
      {
        heading: 'Root cause',
        text: 'Peak-shaving curtailment logic was clamping the battery’s response during frequency events. Each feature did what its own code said. The fault lived in how they interacted, which only shows up in closed loop, and that is why no log line ever pointed at it.',
      },
      {
        heading: 'Guard',
        text: 'I wrote a non-interactive CI gate in Bash that runs the discharge, frequency-reserve and balancing scenarios end to end and asserts on simulator state, controller log markers and message-envelope validation. Every closed integration gap gets a regression test. The gap tracker and the status, demo and Raspberry Pi deployment runbooks are what the team works from.',
      },
    ],
  },
  {
    slug: 'shadow-mode-watchdog',
    title: 'Shadow-mode watchdog',
    org: 'Vera Energy',
    years: '2025 to now',
    role: 'Design and build',
    stack: ['Temporal', 'PostgreSQL', 'Docker', 'Claude API'],
    summary:
      'Nine deterministic health checks over the platform’s workflow orchestration, an LLM narrator that writes up each finding, and a ledger that measures whether the findings were right.',
    event: 'spikes',
    eventNote: 'five incidents, five catches',
    body: [
      {
        heading: 'Problem',
        text: 'The platform’s workflows run on Temporal and PostgreSQL. When something stalls, the evidence is spread across database state, workflow pollers, service health endpoints and worker logs, and somebody has to put it together by hand.',
      },
      {
        heading: 'Build',
        text: 'Nine deterministic checks read those four sources and decide whether something is wrong. An LLM narrator then writes each finding up with its probable cause, so the model explains alerts but never raises one on its own.',
      },
      {
        heading: 'Shadow mode',
        text: 'The watchdog observes and reports and changes nothing. Operators mark each finding right or wrong, and the ledger turns those verdicts into precision and recall, so trust in it is measured rather than assumed.',
      },
      {
        heading: 'Outcome',
        text: 'Golden tests replay five real production incidents. The watchdog catches all five, and any change to a check has to keep it that way.',
      },
    ],
  },
  {
    slug: 'battery-digital-twin',
    title: 'Battery digital twin',
    org: 'Vera Energy',
    years: '2025 to now',
    role: 'Design and build',
    stack: ['Go', 'Modbus TCP', 'MQTT', 'Python'],
    summary:
      'A physics-based model of a grid-tied 245 kW battery system, written in Go, that the unmodified production controller talks to as if it were the hardware.',
    event: 'damped',
    eventNote: 'a modelled response settling',
    body: [
      {
        heading: 'Problem',
        text: 'Testing controller changes against a real battery is slow and carries risk, and a mock that returns canned values hides exactly the behaviour worth testing.',
      },
      {
        heading: 'Build',
        text: 'The twin models a grid-tied 245 kW battery system in Go and speaks Modbus TCP and MQTT, the same interfaces as the field hardware, so the production controller runs against it without a single change.',
      },
      {
        heading: 'Calibration',
        text: 'A Python pipeline calibrates the model against field telemetry. A confidence policy scores each calibration profile and rejects the ones it cannot trust, so a poor fit never quietly becomes the model.',
      },
      {
        heading: 'Outcome',
        text: 'Controller behaviour gets checked against a calibrated battery before it meets a real one.',
      },
    ],
  },
  {
    slug: 'telemetry-at-5-hz',
    title: 'Telemetry at 5 Hz',
    org: 'Vera Energy',
    years: '2025 to now',
    role: 'Data pipelines and analysis',
    stack: ['MQTT', 'AWS Kinesis', 'TimescaleDB', 'Python'],
    summary:
      'Pipelines from MQTT and Kinesis into TimescaleDB, and an energy-budget model whose results changed the configuration proposed in a live enterprise deal.',
    event: 'aggregate',
    eventNote: 'raw samples becoming a usable line',
    body: [
      {
        heading: 'Problem',
        text: 'Metering at 5 Hz is too much to reason about raw and too valuable to smooth away carelessly. A sizing question in a live enterprise deal needed numbers that would hold up.',
      },
      {
        heading: 'Pipeline',
        text: 'Telemetry flows over MQTT and Kinesis into TimescaleDB. I aggregated 4.3 GB of 5 Hz metering data and checked that the result stayed within 1% of the raw data before using it for anything.',
      },
      {
        heading: 'Model',
        text: 'On top of the aggregate sits a 15-minute energy-budget model of the site, the window the decision depended on.',
      },
      {
        heading: 'Outcome',
        text: 'The model’s results changed the configuration proposed in the deal.',
      },
    ],
  },
  {
    slug: 'portal-and-cockpit',
    title: 'Portal and cockpit',
    org: 'Vera Energy',
    years: '2025 to now',
    role: 'UI design and front-end engineering',
    stack: ['React', 'Next.js', 'TypeScript', 'Node.js', 'MQTT', 'WebSocket'],
    summary:
      'A redesigned customer energy-management portal, ported into the production Next.js monorepo as a shared component library, and a React operations cockpit on live telemetry.',
    event: 'steps',
    eventNote: 'a system moving between states',
    body: [
      {
        heading: 'Problem',
        text: 'The customer-facing energy-management portal needed a new design, and the operations dashboard had become legacy.',
      },
      {
        heading: 'Design and port',
        text: 'I designed the new portal UI and ported it into the production React and Next.js monorepo (Node.js, TypeScript).',
      },
      {
        heading: 'Library',
        text: 'The port was refactored into a shared component library, so every application uses the same components instead of keeping its own copies.',
      },
      {
        heading: 'Cockpit',
        text: 'The legacy operations dashboard was replaced by a React cockpit fed by MQTT and WebSocket telemetry.',
      },
    ],
  },
  {
    slug: 'roblox-data-intelligence',
    title: 'Roblox data intelligence',
    org: 'NEXA Data and Software',
    years: '2022 to now',
    role: 'Founder and engineer',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker Compose', 'React', 'OAuth 2.0'],
    summary:
      'A data-intelligence platform for game studios: ingestion workers, a task scheduler and first-party analytics through the Roblox Analytics Query API.',
    event: 'bursts',
    eventNote: 'player traffic arriving in bursts',
    body: [
      {
        heading: 'Context',
        text: 'NEXA provides monetisation strategy, data analysis and growth tooling to game studios, and currently works with four major ones. The flagship client title has 3.6 billion visits and about 41,000 concurrent players.',
      },
      {
        heading: 'Build',
        text: 'A Node.js and TypeScript monorepo with ingestion workers and a task scheduler. First-party data arrives through the Roblox Analytics Query API with OAuth 2.0, lands in PostgreSQL, deploys with Docker Compose and is read through React dashboards.',
      },
      {
        heading: 'Access',
        text: 'Tiered access control keeps a studio’s own data apart from public data, and 521 automated tests hold the platform in place.',
      },
      {
        heading: 'Content pipelines',
        text: 'NEXA also runs generative-AI content pipelines that drive organic traffic for client titles, with human review and QA steps built into each pipeline.',
      },
    ],
  },
];

export const facts = [
  { value: '5 of 5', label: 'real production incidents caught by the watchdog’s golden tests' },
  { value: '9', label: 'deterministic health checks over workflows, database and logs' },
  { value: '245 kW', label: 'battery system modelled in Go for the production controller' },
  { value: '4.3 GB', label: 'of 5 Hz metering aggregated, within 1% of raw' },
  { value: '521', label: 'automated tests on the Roblox data platform' },
];

export const experience = [
  {
    org: 'Vera Energy',
    role: 'AI and software engineer',
    dates: 'Mar 2025 to now',
    text: 'Own the incident investigation path for a battery and EV-charging platform: the closed-loop testbed, its CI gate, the watchdog, the digital twin. Also built customer tools on the same stack: a white-label ROI calculator with Nord Pool and Italian GME spot-price models, lead capture and sales routing, and an LLM document parser for utility invoices with a labelled evaluation corpus. I run live demos for enterprise customers and an industrial partner and turn what they find into tracked fixes.',
  },
  {
    org: 'NEXA Data and Software',
    role: 'Founder',
    dates: 'Jan 2022 to now',
    text: 'A data and software company for game studios: monetisation strategy, data analysis and growth tooling, with four major studios as current clients.',
  },
  {
    org: 'Ericsson',
    role: 'Software developer',
    dates: 'Jan 2023 to Feb 2025',
    text: 'Backend services of carrier-grade telecom software in Java. Investigated and fixed production defects across distributed services on Linux with logs, protocol traces and debuggers, within release deadlines. Raised test coverage and shortened the release feedback loop.',
  },
  {
    org: 'Trafikverket',
    role: 'Software developer',
    dates: 'Jun 2022 to Dec 2022',
    text: 'Internal platforms and data services for road and rail operations. REST APIs and SQL integrations for planning and operations teams, built under a public agency’s documentation, security and accessibility requirements.',
  },
  {
    org: 'Blekinge Institute of Technology',
    role: 'MSc, AI and Machine Learning Engineering',
    dates: 'Karlskrona',
    text: 'Software engineering, distributed systems, databases, machine learning, deep learning and optimisation.',
  },
];

export const skills = [
  { group: 'Languages', items: ['TypeScript', 'JavaScript (Node.js)', 'Go', 'Python', 'Java', 'C', 'SQL', 'Bash', 'Ruby'] },
  {
    group: 'Backend and infrastructure',
    items: ['REST and WebSocket APIs', 'Docker and Compose', 'PostgreSQL, TimescaleDB, SQLite', 'Supabase', 'Temporal', 'MQTT, Modbus TCP', 'AWS Kinesis and IoT', 'GitHub Actions', 'Kubernetes, Terraform', 'Grafana, OpenTelemetry', 'Rails'],
  },
  {
    group: 'Debugging and reliability',
    items: ['Log analysis and log-marker assertions in CI', 'Protocol traces (Modbus, MQTT)', 'Incident replay on a testbed', 'Golden-incident regression tests', 'Performance profiling', 'Runbooks and handoff documents'],
  },
  { group: 'Frontend', items: ['React', 'Next.js', 'Tailwind', 'Shared component libraries', 'Real-time dashboards over WebSockets'] },
  { group: 'Security and networking', items: ['OAuth 2.0', 'Tiered access control', 'Least-privilege database access', 'Secrets handling', 'MQTT broker bridging', 'OT networks', 'TLS, firewalls, VPN'] },
  { group: 'AI and data', items: ['LLM applications with the Claude API and tool use', 'LLM-vision document parsing', 'Evaluation with labelled corpora', 'AI coding agents, with every change reviewed'] },
];

export const spoken = 'English and Swedish, both fluent.';
