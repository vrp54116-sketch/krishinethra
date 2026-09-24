# KrishiNethra AI v2 🌾 — Liquid Glass Smart Farm

**KrishiNethra AI v2 — Liquid Glass Smart Farm.** Har Khet Ka AI Doctor:
an offline-first smart farm command center with a refractive **liquid glass**
UI — live sensor simulation, AI agent reasoning, smart irrigation, weather,
spray planner, fertilizer, market, schemes, diary, tasks, KrishiGPT
assistant, reports, alerts and voice control — all running from
`localStorage`, installable as a PWA, with true wireless ESP32 control over
MQTT from any network.

## V2 Liquid Glass Features

- **Liquid glass design system** — refractive glass cards, pills, buttons and
  sheets with 28px radius, 24px padding, 6-layer inset shadows, backdrop
  blur + saturate, and a slow specular sheen.
- **SVG filter pipeline** — `#liquid-refraction` (chromatic split),
  `#liquid-gooey` (goo morph for route/step transitions),
  `#liquid-distortion` (turbulence displacement) rendered once in
  `LiquidFilterDefs`.
- **Dashboard liquid glass grid** — desktop 2-column (sensors 2×2 + AI
  reasoning + sensor health | farm health ring + pump + live camera +
  alerts), tablet single-column 16px stack, mobile compact cards with a
  bottom tab bar and floating action button.
- **Liquid glass navigation** — sidebar panel (16px margins, rounded-3xl,
  strong glass), leaf logo in a glowing emerald circle, pill nav items with
  emerald tint + left glow bar, Farm Health ring + LIVE badge; mobile
  bottom tab bar in strong glass (`mx-4 mb-4`, rounded-full).
- **Onboarding wizard** — single default crop (Tomato), single zone
  "Your Farm", hardware bill-of-materials note, liquid-glass cards and a
  gooey morphing progress bar.
- **AI Agent Reasoning card** — live rule evaluation with spring entrance
  (soil ↔ threshold ↔ rain ↔ pump state).
- **Live camera** — device webcam feed on the dashboard with `next/image`
  snapshots (quality 80).
- **Performance** — Recharts components memoized, MQTT telemetry throttled
  to ≤10 store updates/sec (`lodash.throttle`), `/reports` `/diary`
  `/schemes` lazy-loaded with `React.lazy` + `Suspense`, heavy charts/maps
  code-split with `next/dynamic`, `will-change: transform` on glass cards,
  `contain: strict` on isolated glass containers.
- **Accessibility** — skip-to-content link, focus-trapped modals/sheets with
  focus restore, screen-reader announcements for pump state + alerts
  (`aria-live`), aria-labels on interactive elements, WCAG AA contrast on
  glass surfaces, global keyboard focus ring.
- **Reduced motion & color scheme** — `prefers-reduced-motion` disables all
  glass animations/transitions; dark mode is the default and
  `prefers-color-scheme` is honored automatically.

## Features

- **Dashboard** — farm health score ring, 4 live sensor cards (soil, temp,
  humidity, AQI) with sparklines, AI agent reasoning, sensor health, pump
  control, live webcam, alerts feed, AI suggestions, quick actions.
- **Farm Map** — digital twin of the single zone with crop + moisture status.
- **Crop Doctor (Camera)** — leaf scanner with severity heatmap, natural +
  chemical treatment, spray-plan generation, pan-tilt pad (simulated or live).
- **Irrigation** — manual/auto/schedule pump, weekly slots, tank gauge, usage
  tracker, energy monitor, AI explainer.
- **Climate** — 6 live sensors, 5-day Open-Meteo forecast with offline fallback
  badge, AI advisor, 12h history graphs, crop comfort panel.
- **Spray Planner** — weather-aware plans with rain-safe windows.
- **Fertilizer** — dose calculator + 15-day cycle tracking.
- **Market** — mandi prices, trends, sell-vs-hold guidance for your crops.
- **Schemes** — govt scheme recommendations matched to farm profile.
- **Diary / Tasks / Assistant / Reports / Alerts / Voice / Settings** — full
  exhibition loop: 4 diary entries, 5 tasks, active spray plan, disease scans,
  30-day reports, 6 alerts, KrishiGPT chat, Telegram forwarding, multi-language
  (EN/HI/GU/MR) + voice I/O.
- **Wireless edge (MQTT)** — ESP32 publishes telemetry to `…/up`, the app
  subscribes over `wss` from ANY device/network, commands (`PUMP:ON`,
  `BUZZ:…`, `LCD1:…`) publish to `…/cmd`; throttled to 10 updates/sec.
- **PWA** — `app/manifest.ts`, generated 192/512 icons, apple touch icon,
  service worker (`public/sw.js`) with app-shell cache + `/offline` fallback,
  header **Install App** button (`beforeinstallprompt`, mobile).
- **Resilience** — per-page loading skeletons (Suspense), on-theme
  `error.tsx` / `not-found.tsx`; Open-Meteo and Telegram failures degrade
  silently with offline badges.

## Demo Script

1. **Show the dashboard** — liquid glass sensor cards (soil, temperature,
   humidity, AQI) updating in real time with animated sparklines and the
   Farm Health ring breathing with the score.
2. **Grip the soil probe** — watch moisture drop on the soil card; when it
   crosses the low threshold the pump turns on automatically with the water
   droplet animation and pulse on the pump card.
3. **Open the AI Agent Reasoning card** — it spring-animates to the new
   decision: *"Soil 18% < 35% threshold AND no rain → Pump ON (Auto mode)"*.
4. **Trigger the rain sensor** — the pump locks OFF and an amber banner
   slides down: *"Rain detected — pump locked OFF … Water savings algorithm
   engaged."*
5. **Phone on mobile data** — open the site from anywhere; the liquid glass
   bottom tab bar, FAB and pump buttons control the same farm over MQTT.
6. **Test buzzer patterns** — Alerts → Buzzer Pattern Tester; each pattern
   fires the physical buzzer with visual feedback on the button.
7. **Send a custom message to the physical LCD** — Settings/Hardware → LCD
   form posts `LCD1:`/`LCD2:` lines through the liquid glass form; the 16×2
   display updates instantly.

## Hardware Requirements

Exact components for the v2 single-zone edge node (matches the onboarding
note: *1 soil sensor, 1 air quality sensor, 1 temp/humidity sensor, 1 rain
sensor, 1 pump*):

| # | Component | Qty | Role |
|---|-----------|-----|------|
| 1 | ESP32 DevKit (30-pin) | 1 | Edge gateway — sensors, relay, MQTT |
| 2 | Capacitive soil-moisture sensor v1.2 | 1 | Soil moisture % (Zone "Your Farm") |
| 3 | MQ-135 gas sensor | 1 | Air quality / AQI proxy |
| 4 | DHT22 (AM2302) | 1 | Temperature + humidity |
| 5 | Rain sensor module (analog out) | 1 | Rain detect → pump lock-out |
| 6 | 1-channel 5 V relay module | 1 | Pump switching (active-HIGH) |
| 7 | Submersible pump (12 V/DC or AC) | 1 | Irrigation |
| 8 | 5 V 2 A power supply | 1 | ESP32 + sensors (common GND) |
| 9 | 16×2 I2C LCD (optional) | 1 | Field status display (`LCD1`/`LCD2`) |
| 10 | Piezo buzzer (optional) | 1 | Alarm patterns (`BUZZ:n:ms`) |
| 11 | SG90 servos + pan-tilt bracket (optional) | 2 | Camera sweep (`SERVO`, `SWEEP`) |
| 12 | HC-SR04 ultrasonic (optional) | 1 | Tank level % |

- Contract: [`docs/HARDWARE_CONTRACT.md`](docs/HARDWARE_CONTRACT.md)
- Flash/wire guide: [`docs/ESP32_QUICKSTART.md`](docs/ESP32_QUICKSTART.md)

## Liquid Glass Features (implementation notes)

- **SVG filters** (`src/components/ui/glass/LiquidFilterDefs.tsx`):
  - `#liquid-refraction` — per-channel offsets (R −20 / G −24 / B −28) plus a
    3px blur applied *inside* `backdrop-filter`, so refraction tints the
    backdrop while content stays sharp (guarded with `@supports`).
  - `#liquid-gooey` — `feGaussianBlur` 13 + `feColorMatrix` alpha 13 makes
    edges merge; used for route morphs and the onboarding progress fill.
  - `#liquid-distortion` — `feTurbulence` + `feDisplacementMap` (scale 77)
    for organic wobble.
- **Animations** — slow specular sheen (`liquid-sheen`), ambient blob drift
  (6 blobs, 50–80s), rotating icon blobs, pump droplet falls, alert shake,
  card ripples, spring entrances (framer-motion), staggered reveals
  (`LiquidStagger`), and spring layout pills in the sidebar.
- **Tokens** — `--glass-blur: 20px`, `--glass-blur-strong: 28px`,
  `--glass-radius: 28px`, `--glass-saturation: 1.4`, light/dark tints swap
  on `html.light`.
- **Performance guards** — `will-change: transform` on glass cards,
  `contain: strict` on isolated containers (`.liquid-contain`), Recharts
  memoized, MQTT throttled to 10 Hz, route-level code splitting.
- **Accessibility** — every glass surface keeps AA text contrast; the global
  `:focus-visible` ring is emerald 2px; modals and sheets trap focus and
  restore it on close; pump/alert changes are announced through a polite
  `aria-live` region; `prefers-reduced-motion: reduce` switches every
  animation off and reduces transitions to opacity-only.

## Local dev

```bash
npm i
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), complete the 5-step
wizard (defaults: Tomato + "Your Farm"), and explore `/dashboard`. First load
seeds a rich demo state (diary, tasks, spray plan, scans, 30-day summaries,
alerts) so the app feels alive immediately. All data persists in
`localStorage` key `krishinethra-v1`.

```bash
npm run build   # must pass cleanly
npm start       # serve the production build
npm run lint    # eslint
ANALYZE=true npm run build   # bundle report via @next/bundle-analyzer
```

## Deploy to Vercel

No `vercel.json` needed — default Next.js works. Web Vitals + Speed Insights
are wired up in `src/app/layout.tsx`.

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Set environment variables (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_MQTT_BROKER_URL` — preferred `wss://` MQTT broker URL
     (falls back to public EMQX/HiveMQ brokers).
   - `NEXT_PUBLIC_MQTT_TOKEN` — farm token (topic password on the public
     broker; default `patelfarm01`).
   - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — Telegram alert forwarding.
   - `HARDWARE_GATEWAY_URL` — default ESP32/RPi gateway base URL for HTTP
     LIVE mode (can also be set per-device in Settings → Hardware Bridge).
   - `DATA_GOV_IN_API_KEY` — data.gov.in API key for LIVE mandi prices.
   - `COMMODITY_RESOURCE_ID` — mandi price dataset resource
     (default `9ef84268-d588-465a-a308-a864a43d0070`).
4. Click **Deploy** (or `npx vercel --prod`). Vercel's Edge Network CDN
   serves the build globally.

> Without a mandi API key the Market page keeps showing its built-in demo
> table with a DEMO DATA badge (offline-safe for exhibitions). Telegram also
> works per-device: Settings → Alerts → paste bot token + chat ID.

## Connecting real hardware later

The app runs in **Simulation** mode by default and flips to **LIVE** mode in
Settings → Hardware Bridge without any UI changes — the 2s poller merges
gateway snapshots into the same store slices the simulator writes to. Over
MQTT the flip is automatic: fresh telemetry (<5s) → EDGE-LIVE, silence →
graceful SIMULATION fallback.

- Contract: [`docs/HARDWARE_CONTRACT.md`](docs/HARDWARE_CONTRACT.md) — the exact
  JSON for `GET /status`, `GET /sensors`, `POST /pump`, `POST /servo` plus the
  `/api/hw/*` bridge envelope (`{ ok, data, source }`, never throws).
- Quickstart: [`docs/ESP32_QUICKSTART.md`](docs/ESP32_QUICKSTART.md) — flash,
  wire and point `HARDWARE_GATEWAY_URL` (or Settings → Hardware Bridge) at the
  device, then flip mode to LIVE.

## Project layout

- `src/app/` — routes (`/` landing/wizard, `(app)/dashboard … /settings`,
  `/offline`, `manifest.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`).
  `/reports`, `/diary`, `/schemes` lazy-load their views with
  `React.lazy` + `Suspense`.
- `src/components/` — dashboard, climate, irrigation, camera, map, liquid
  glass UI kit (`ui/glass`) + layout shell.
- `src/lib/` — one zustand store (persisted), simulation tick (1s),
  `liquid-glass.css` tokens, MQTT bridge (throttled 10 Hz), rich first-run
  seed.
- `public/` — PWA icons generated by `scripts/gen-icons.mjs`, plus `sw.js`.
