# KrishiNethra Hardware Contract

This is the **exact JSON contract** between the Next.js app and the field
gateway (ESP32 serving HTTP directly, or a Raspberry Pi relay in front of
it). Implement these four endpoints on the gateway and the app works with
**zero UI changes** — LIVE mode just swaps the data source.

```
App (browser) ──poll 2s──▶ Next.js /api/hw/* ──proxy──▶ Gateway (ESP32 / Pi)
                              │                              │
                              │  ?gw=<base URL override>      │  :80
                              │  HARDWARE_GATEWAY_URL fallback│
```

The browser never talks to the gateway directly. It calls the bridge
(`src/app/api/hw/*`), which proxies to `<gateway>` + path. The `?gw=`
query param overrides the `HARDWARE_GATEWAY_URL` server env var at
runtime (it carries `settings.hardwareGatewayUrl` from Settings →
Hardware Bridge).

---

## 0. Bridge envelope (all `/api/hw/*` routes)

Every bridge route returns HTTP 200 with this shape — it **never throws**
to the client. Reachability is signalled by `ok`, not by HTTP status.

```jsonc
{
  "ok": true,                    // boolean — gateway reachable + valid
  "data": { "...": "..." },      // endpoint payload (see below)
  "source": "live | simulation"  // "simulation" when no gateway configured
}
```

`source: "simulation"` is returned when neither `?gw=` nor
`HARDWARE_GATEWAY_URL` is set (or `?mode=simulation` is passed) — the
app then keeps using the local simulator. Simulation is the default and
is unaffected by any of this.

Optional auth: the app forwards `X-Farm-Key` to the gateway when present.
The gateway MAY enforce it (return HTTP 401 with `{"error": "..."}`)
or ignore it entirely.

---

## 1. `GET /status` → gateway liveness + firmware

Bridge: `GET /api/hw/status?gw=<base>` → proxies `GET <base>/status`.

Gateway response (JSON):

```jsonc
{
  "ok": true,          // boolean — gateway healthy
  "uptime": 45231,     // number — seconds since gateway boot
  "firmware": "krishi-esp32-v1"  // string — firmware id
}
```

Simulation fallback (`data`):

```json
{ "mode": "simulation", "ok": true }
```

---

## 2. `GET /sensors` → full `SensorSnapshot` JSON

Bridge: `GET /api/hw/sensors?gw=<base>` → proxies `GET <base>/sensors`.

The gateway MUST serve **every field below with the exact name, type
and unit**. This mirrors `SensorSnapshot` in `src/lib/types.ts` 1:1:

```ts
export interface SensorSnapshot {
  timestamp: number;        // ms epoch (Date.now())
  tempC: number;            // °C air temperature (DHT22)
  humidity: number;         // % relative humidity (DHT22)
  aqi: number;              // unitless air-quality index (MQ-135 mapped)
  lightLux: number;         // lux ambient light
  rainMm: number;           // mm rainfall for this sample window
  tankLevelPercent: number; // % water tank level (HC-SR04 mapped)
  flowRateLpm: number;      // L/min instantaneous flow (0 when pump off)
  pumpCurrentA: number;     // A pump current draw (0 when pump off)
  soilMoistureA: number;    // % volumetric, Zone A (capacitive sensor)
  soilMoistureB: number;    // % volumetric, Zone B (capacitive sensor)
}
```

| Field              | Type   | Unit    | Range      | Sensor (reference build) |
| ------------------ | ------ | ------- | ---------- | ------------------------ |
| `timestamp`        | number | ms epoch| ≥ 0       | gateway clock (`millis()` + boot epoch, or NTP) |
| `tempC`            | number | °C      | −10…60     | DHT22 temperature |
| `humidity`         | number | % RH    | 0…100      | DHT22 humidity |
| `aqi`              | number | index   | 0…500      | MQ-135 (analog → index map) |
| `lightLux`         | number | lux     | 0…100000   | ambient light / LDR (or fixed curve) |
| `rainMm`           | number | mm      | 0…100      | rain gauge / analog rain sensor |
| `tankLevelPercent` | number | %       | 0…100      | HC-SR04 distance → % |
| `flowRateLpm`      | number | L/min   | 0…10       | flow meter (0 when pump off) |
| `pumpCurrentA`     | number | A       | 0…10       | current sensor (0 when pump off) |
| `soilMoistureA`    | number | %       | 0…100      | capacitive sensor, Zone A |
| `soilMoistureB`    | number | %       | 0…100      | capacitive sensor, Zone B |

Example gateway payload:

```json
{
  "timestamp": 1726646400000,
  "tempC": 31.4,
  "humidity": 62.5,
  "aqi": 85,
  "lightLux": 640,
  "rainMm": 0,
  "tankLevelPercent": 78,
  "flowRateLpm": 0.4,
  "pumpCurrentA": 0.25,
  "soilMoistureA": 45.2,
  "soilMoistureB": 28.7
}
```

Rules:

- All values are JSON **numbers** (not strings). Send `0` for sensors you
  don't have yet — never omit a field.
- The bridge sanitizes live payloads (missing/non-numeric → fallback) but
  the UI expects the full shape, so serve it completely.
- Simulation fallback serves a fresh snapshot from the same engine shape
  (`createInitialSnapshot`), so both sources are interchangeable.

---

## 3. `POST /pump` → pump relay

Bridge: `POST /api/hw/pump?gw=<base>` → proxies `POST <base>/pump`.

Request:

```jsonc
{
  "action": "on | off",   // string, required
  "durationSec": 10       // number, optional, seconds; relay auto-stops after this
}
```

Validation (bridge + gateway): `action` must be `"on"`/`"off"`;
`durationSec` when present must be a positive number (clamped to ≤ 3600).
Invalid bodies return `{ "ok": false, "data": { "error": "..." } }`.

Gateway success response (example):

```jsonc
{
  "action": "on",     // echoed
  "durationSec": 10,  // echoed when sent
  "running": true,    // boolean — relay state after applying
  "applied": "live"
}
```

Simulation acknowledgement (`data`): `{ "action", "durationSec?", "applied": "simulation" }`
(the client store applies the run locally in that case).

---

## 4. `POST /servo` → pan-tilt camera head

Bridge: `POST /api/hw/servo?gw=<base>` → proxies `POST <base>/servo`.

Request:

```jsonc
{
  "axis": "pan | tilt",  // string, required
  "angle": 90            // number, required, degrees 0–180
}
```

Out-of-range angles are **clamped** to 0–180 and the clamped value is
echoed back. Non-numeric angles return `ok: false`.

Gateway success response (example):

```json
{ "axis": "pan", "angle": 90, "applied": "live" }
```

Simulation acknowledgement (`data`): `{ "axis", "angle", "applied": "simulation" }`.

---

## 5. Auth

- Header: `X-Farm-Key: <shared secret>` (optional).
- The app forwards it when configured; the gateway may enforce it
  (401 + `{"error": "unauthorized"}`) or ignore it.
- No other auth is required on the LAN.

---

## 6. Polling

- In LIVE mode (`settings.mode === "live"`) the app polls the bridge
  every **2 seconds**: `GET /api/hw/sensors` + `GET /api/hw/status`.
- Results merge into the **same store slices** the simulator writes to
  (`snapshot`, `zones`, `sensorHistory`, `farmHealthScore`, `alerts`),
  so every page works unchanged.
- Pump buttons call `POST /api/hw/pump`; pan-tilt calls
  `POST /api/hw/servo` (throttled client-side).
- The header shows a `LIVE • connected / disconnected` pill driven by
  poll reachability (green/red dot).
- Simulation mode polls nothing and behaves exactly as before.

---

## 7. Minimal gateway checklist

1. Serve `GET /status`, `GET /sensors`, `POST /pump`, `POST /servo` as
   `Content-Type: application/json` with CORS `Access-Control-Allow-Origin: *`.
2. `GET /sensors` returns all 11 `SensorSnapshot` fields as numbers.
3. `POST /pump` toggles the relay (honour `durationSec` with an auto-off
   timer) and echoes `{ action, running }`.
4. `POST /servo` drives the two servos (0–180°) and echoes `{ axis, angle }`.
5. (Optional) enforce `X-Farm-Key`.

See `docs/ESP32_QUICKSTART.md` for a ready-to-flash Arduino sketch that
implements exactly this contract on the ESP32 itself.
