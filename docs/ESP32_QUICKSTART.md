# ESP32 Quickstart — serve the hardware contract with no Pi

This guide flashes an ESP32 (DevKit / NodeMCU-32S) so it **is** the
gateway: it reads the field sensors and serves the exact endpoints in
`docs/HARDWARE_CONTRACT.md`. Afterwards, point the app at it:

- Settings → Hardware Bridge → Gateway URL: `http://<esp32-ip>`
  (port 80, no trailing path — e.g. `http://192.168.1.50`)
- Switch mode to **LIVE**. The app polls the ESP32 every 2 s.
- Or set the server env `HARDWARE_GATEWAY_URL=http://<esp32-ip>` and
  pass nothing from the client (`?gw=` overrides it at runtime).

Simulation mode stays the default — nothing changes until you flip the
switch above.

---

## 1. What you need

| Part | Notes |
| ---- | ----- |
| ESP32 DevKit (30-pin) | Arduino core `esp32` ≥ 2.x |
| DHT22 (AM2302) | temperature + humidity |
| 2× capacitive soil-moisture sensor v1.2 | Zones A + B (analog out) |
| HC-SR04 ultrasonic | tank level (needs 5 V + echo divider) |
| MQ-135 gas sensor | AQI proxy (needs 5 V + 24 h burn-in ideally, 5 min minimum) |
| LDR + 10 kΩ resistor | light divider (lux proxy) |
| Rain sensor module (analog out) | rain proxy (optional — fixed `0` if skipped) |
| 1-channel 5 V relay module | pump (active-HIGH wiring used here) |
| 2× SG90 servos | pan + tilt camera head |
| 5 V 2 A supply | servos + sensors; **common GND** with the ESP32 |

Arduino libraries (Library Manager):

- `DHT sensor library` (Adafruit) + `Adafruit Unified Sensor`
- `ESP32Servo`
- `ArduinoJson` (v6)

Board settings: **ESP32 Dev Module**, default partition, 115200 baud monitor.

---

## 2. Pin table (contract field ↔ GPIO)

| Contract field | Sensor | ESP32 pin | Power | Notes |
| -------------- | ------ | --------- | ----- | ----- |
| `tempC`, `humidity` | DHT22 DATA | **GPIO 15** | 3V3 / GND | 10 kΩ pull-up DATA→3V3 (many modules include it) |
| `soilMoistureA` | Capacitive #1 (Zone A) | **GPIO 34** (ADC1, input-only) | 3V3 / GND | analog 0–4095 |
| `soilMoistureB` | Capacitive #2 (Zone B) | **GPIO 35** (ADC1, input-only) | 3V3 / GND | analog 0–4095 |
| `tankLevelPercent` | HC-SR04 TRIG / ECHO | **GPIO 5** / **GPIO 18** | 5 V (VCC) | ECHO is 5 V → divide to 3V3 (1 kΩ + 2 kΩ) before GPIO 18 |
| `aqi` | MQ-135 AO | **GPIO 32** (ADC1) | 5 V | pre-heat ≥ 5 min; map against your clean-air baseline |
| `lightLux` | LDR divider midpoint | **GPIO 36** (ADC1, input-only) | 3V3 via LDR→3V3, 10 kΩ→GND | brighter = higher reading |
| `rainMm` | Rain module AO | **GPIO 33** (ADC1) | 3V3/5 V per module | wetter = lower reading; omit → reports `0` |
| pump relay | Relay IN | **GPIO 23** | 5 V coil supply | active-HIGH; pump on `HIGH` |
| pan servo | SG90 signal (pan) | **GPIO 13** | 5 V external | `POST /servo {"axis":"pan"}` |
| tilt servo | SG90 signal (tilt) | **GPIO 12** | 5 V external | `POST /servo {"axis":"tilt"}` |

> ADC1 only (GPIO 32–36) is used for analog reads so Wi-Fi stays stable
> (ADC2 conflicts with Wi-Fi on the ESP32). Servo + relay pins avoid the
> strapping pins (0/2/12-boot caveat: GPIO 12 must be LOW at boot — the
> servo library attaches in `setup()`, after boot, which is fine; if your
> board fails to boot, move tilt to GPIO 14).

---

## 3. Calibration (do once, edit the `CAL_*` constants)

1. **Soil (per zone):** hold the probe in dry air → note raw (`SOIL_DRY`,
   ≈ 3000+); submerge tip in water → note raw (`SOIL_WET`, ≈ 1200).
   The sketch maps `[DRY..WET] → [0..100] %`.
2. **Tank:** measure `TANK_EMPTY_CM` (sensor→bottom) and
   `TANK_FULL_CM` (sensor→water surface when full); level is mapped
   between them, clamped 0–100 %.
3. **MQ-135:** after warm-up in clean air, note raw and set
   `AIR_CLEAN_RAW`; AQI ≈ `map(raw, CLEAN..SMOKY, 60..300)`.
4. **LDR:** note dark vs daylight raw; lux ≈ `map(raw, DARK..BRIGHT, 0..900)`.
5. **Rain:** note dry raw (`RAIN_DRY_RAW`); rain mm ≈ small puddle proxy
   `map(DRY..WET, 0..5)` — it is a coarse indicator, and that is fine.

---

## 4. Sketch (`krishi_gateway.ino`)

```cpp
/*
 * KrishiNethra ESP32 gateway — serves HARDWARE_CONTRACT.md directly.
 *   GET  /status   -> { ok, uptime, firmware }
 *   GET  /sensors  -> full SensorSnapshot JSON (11 numeric fields)
 *   POST /pump     -> { action: "on"|"off", durationSec? }
 *   POST /servo    -> { axis: "pan"|"tilt", angle: 0..180 }
 * Optional auth: set FARM_KEY ("" = disabled); enforced via X-Farm-Key.
 */
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// ---------- Wi-Fi ----------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* FARM_KEY  = "";  // e.g. "secret123" or "" to disable auth

// ---------- Pins ----------
#define DHT_PIN      15
#define DHT_TYPE     DHT22
#define SOIL_A_PIN   34
#define SOIL_B_PIN   35
#define TRIG_PIN     5
#define ECHO_PIN     18
#define MQ135_PIN    32
#define LDR_PIN      36
#define RAIN_PIN     33
#define RELAY_PIN    23
#define PAN_PIN      13
#define TILT_PIN     12

// ---------- Calibration (tune once, see section 3) ----------
const int   SOIL_DRY = 3100, SOIL_WET = 1300;   // raw ADC
const float TANK_EMPTY_CM = 60.0, TANK_FULL_CM = 8.0;
const int   AIR_CLEAN_RAW = 900, AIR_SMOKY_RAW = 2400;
const int   LDR_DARK = 200, LDR_BRIGHT = 3500;
const int   RAIN_DRY_RAW = 3000, RAIN_WET_RAW = 1200;

const char* FIRMWARE = "krishi-esp32-v1";

DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);
Servo panServo, tiltServo;
int panAngle = 90, tiltAngle = 90;
bool pumpOn = false;
unsigned long pumpOffAt = 0;  // millis() deadline for durationSec auto-off

// ---------- Helpers ----------
void cors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, X-Farm-Key");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

bool authed() {
  if (strlen(FARM_KEY) == 0) return true;
  return server.header("X-Farm-Key") == String(FARM_KEY);
}

void unauthorized() {
  cors();
  server.send(401, "application/json", "{\"error\":\"unauthorized\"}");
}

float readTankCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long us = pulseIn(ECHO_PIN, HIGH, 30000);  // 30 ms timeout
  if (us == 0) return TANK_EMPTY_CM;
  return us / 58.0;  // cm
}

float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// ---------- Endpoints ----------
void handleStatus() {
  cors();
  StaticJsonDocument<128> doc;
  doc["ok"] = true;
  doc["uptime"] = (unsigned long)(millis() / 1000);
  doc["firmware"] = FIRMWARE;
  String out; serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleSensors() {
  cors();
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t)) t = 0;
  if (isnan(h)) h = 0;

  int soilA = analogRead(SOIL_A_PIN);
  int soilB = analogRead(SOIL_B_PIN);
  float moistA = clampf((SOIL_DRY - soilA) * 100.0 / (SOIL_DRY - SOIL_WET), 0, 100);
  float moistB = clampf((SOIL_DRY - soilB) * 100.0 / (SOIL_DRY - SOIL_WET), 0, 100);

  float distCm = readTankCm();
  float tankPct = clampf((TANK_EMPTY_CM - distCm) * 100.0 / (TANK_EMPTY_CM - TANK_FULL_CM), 0, 100);

  int mq = analogRead(MQ135_PIN);
  int aqi = (int)clampf((mq - AIR_CLEAN_RAW) * 240.0 / (AIR_SMOKY_RAW - AIR_CLEAN_RAW) + 60, 60, 300);

  int ldr = analogRead(LDR_PIN);
  int lux = (int)clampf((ldr - LDR_DARK) * 900.0 / (LDR_BRIGHT - LDR_DARK), 0, 900);

  int rainRaw = analogRead(RAIN_PIN);
  float rainMm = clampf((RAIN_DRY_RAW - rainRaw) * 5.0 / (RAIN_DRY_RAW - RAIN_WET_RAW), 0, 25);

  StaticJsonDocument<384> doc;
  doc["timestamp"] = (unsigned long long)0;  // no RTC/NTP: app stamps arrival; set via NTP below if wanted
  doc["tempC"] = roundf(t * 10) / 10;
  doc["humidity"] = roundf(h * 10) / 10;
  doc["aqi"] = aqi;
  doc["lightLux"] = lux;
  doc["rainMm"] = roundf(rainMm * 10) / 10;
  doc["tankLevelPercent"] = roundf(tankPct * 100) / 100;
  doc["flowRateLpm"] = pumpOn ? 0.4 : 0;
  doc["pumpCurrentA"] = pumpOn ? 0.25 : 0;
  doc["soilMoistureA"] = roundf(moistA * 100) / 100;
  doc["soilMoistureB"] = roundf(moistB * 100) / 100;
  String out; serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handlePump() {
  cors();
  if (!authed()) { unauthorized(); return; }
  if (server.method() == HTTP_OPTIONS) { server.send(200, "application/json", "{}"); return; }
  StaticJsonDocument<128> doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    server.send(400, "application/json", "{\"error\":\"invalid JSON\"}");
    return;
  }
  String action = doc["action"] | "";
  if (action != "on" && action != "off") {
    server.send(400, "application/json", "{\"error\":\"action must be on|off\"}");
    return;
  }
  long dur = doc.containsKey("durationSec") ? (long)doc["durationSec"] : 0;

  pumpOn = (action == "on");
  digitalWrite(RELAY_PIN, pumpOn ? HIGH : LOW);
  pumpOffAt = (pumpOn && dur > 0) ? millis() + (unsigned long)dur * 1000 : 0;

  StaticJsonDocument<128> res;
  res["action"] = action;
  if (dur > 0) res["durationSec"] = dur;
  res["running"] = pumpOn;
  res["applied"] = "live";
  String out; serializeJson(res, out);
  server.send(200, "application/json", out);
}

void handleServo() {
  cors();
  if (!authed()) { unauthorized(); return; }
  if (server.method() == HTTP_OPTIONS) { server.send(200, "application/json", "{}"); return; }
  StaticJsonDocument<128> doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    server.send(400, "application/json", "{\"error\":\"invalid JSON\"}");
    return;
  }
  String axis = doc["axis"] | "";
  if (axis != "pan" && axis != "tilt") {
    server.send(400, "application/json", "{\"error\":\"axis must be pan|tilt\"}");
    return;
  }
  int angle = doc["angle"] | -1;
  if (angle < 0) {
    server.send(400, "application/json", "{\"error\":\"angle must be a number 0..180\"}");
    return;
  }
  angle = constrain(angle, 0, 180);
  if (axis == "pan") { panAngle = angle; panServo.write(panAngle); }
  else { tiltAngle = angle; tiltServo.write(tiltAngle); }

  StaticJsonDocument<128> res;
  res["axis"] = axis;
  res["angle"] = angle;
  res["applied"] = "live";
  String out; serializeJson(res, out);
  server.send(200, "application/json", out);
}

void handleOptions() {
  cors();
  server.send(200, "application/json", "{}");
}

// ---------- Setup / loop ----------
void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  analogReadResolution(11);  // 0..2047 softens capacitive-sensor noise
  dht.begin();
  panServo.attach(PAN_PIN);
  tiltServo.attach(TILT_PIN);
  panServo.write(panAngle);
  tiltServo.write(tiltAngle);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("Connecting to %s", WIFI_SSID);
  for (int i = 0; i < 60 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }
  Serial.println();
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());  // <-- put this IP in the app gateway URL

  server.on("/status", HTTP_GET, handleStatus);
  server.on("/sensors", HTTP_GET, handleSensors);
  server.on("/pump", HTTP_POST, handlePump);
  server.on("/servo", HTTP_POST, handleServo);
  server.onNotFound(handleOptions);  // CORS preflight
  server.begin();
  Serial.println("Krishi gateway up: /status /sensors /pump /servo");
}

void loop() {
  server.handleClient();
  // durationSec auto-off for the pump relay
  if (pumpOn && pumpOffAt != 0 && (long)(millis() - pumpOffAt) >= 0) {
    pumpOn = false;
    pumpOffAt = 0;
    digitalWrite(RELAY_PIN, LOW);
  }
  delay(2);
}
```

> `timestamp` is `0` without a clock — the Next.js bridge keeps the field
> numeric and the app re-stamps arrival time, so charts keep working. For
> real timestamps add `configTime()` (NTP) in `setup()` and serve
> `time(nullptr) * 1000`. Any numeric value is contract-valid.

---

## 5. Flash, verify, connect

1. Fill in `WIFI_SSID` / `WIFI_PASS`, flash, open the serial monitor.
2. Note the printed IP, then verify from a laptop on the **same Wi-Fi**:
   - `http://<ip>/status` → `{"ok":true,"uptime":…,"firmware":"krishi-esp32-v1"}`
   - `http://<ip>/sensors` → 11 numeric fields
   - `curl -X POST http://<ip>/pump -H "Content-Type: application/json" -d "{\"action\":\"on\",\"durationSec\":5}"`
   - `curl -X POST http://<ip>/servo -H "Content-Type: application/json" -d "{\"axis\":\"pan\",\"angle\":120}"`
3. In the app: Settings → Hardware Bridge → Gateway URL
   `http://<ip>` → **Test Connection** → flip to **LIVE**.
4. The header pill turns `LIVE • connected` (green); every page now reads
   the ESP32. Flip back to **SIMULATION** any time — the demo is untouched.

## 6. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `Test Connection` unreachable | Same Wi-Fi? Phone hotspot isolation? Try the IP (not `esp32.local`) and `http://` (not `https`). |
| Soil stuck at 0/100 % | Re-do dry/wet raw calibration; capacitive probes need 3V3, not 5 V. |
| HC-SR04 always 0 % / 100 % | Check ECHO divider wiring; measure `distCm` over serial; re-set `TANK_*_CM`. |
| MQ-135 reads max constantly | Warm up 5+ min; set `AIR_CLEAN_RAW` from your room; keep away from the relay supply noise (common GND, separate 5 V wire). |
| Board won't boot with tilt servo | GPIO 12 strapping — move tilt signal to GPIO 14 and update `TILT_PIN`. |
| Servos jitter | Power servos from the external 5 V supply (not the ESP32 5 V pin); common GND is mandatory. |
